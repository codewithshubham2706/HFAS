import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * E2E stubs — require a live stack (docker compose up: db + storage).
 * Run: docker compose up -d db storage && npm run test:e2e
 *
 * Covers: signup → profile → create upload → confirm → OCR → prefill →
 * consent → submit → admin queue visibility.
 */
describe('HFAS API (e2e)', () => {
  let app: INestApplication
  let token: string
  const email = `e2e-${Date.now()}@demo.hfas`

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email, password: 'e2e-Password-2026!' })
      .expect(201)
    token = res.body.accessToken
    expect(token).toBeTruthy()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/schemes returns seeded schemes', async () => {
    const res = await request(app.getHttpServer()).get('/api/schemes').expect(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(3)
  })

  it('POST /api/eligibility/assess returns scored matches', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/eligibility/assess')
      .set('Authorization', `Bearer ${token}`)
      .send({ profile: { annual_income_inr: 240000 }, onboarding: { condition: 'cardiac', facility_type: 'govt' } })
      .expect(201)
    const subsidy = res.body.find((m: { slug: string }) => m.slug === 'hospital-care-subsidy')
    expect(subsidy.assessment.score).toBe(100)
  })

  it('upload → confirm → ocr → prefill → consent → submit', async () => {
    // 1. presigned upload URL
    const up = await request(app.getHttpServer())
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ doc_type: 'aadhaar', content_type: 'image/png', byte_size: 2048 })
      .expect(201)
    expect(up.body.uploadUrl).toBeTruthy()

    // 2. confirm with checksum
    await request(app.getHttpServer())
      .post(`/api/documents/${up.body.documentId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send({ checksum_sha256: 'a'.repeat(64) })
      .expect(201)

    // 3. OCR
    const ocr = await request(app.getHttpServer())
      .post(`/api/documents/${up.body.documentId}/process-ocr`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
    expect(ocr.body.status).toBe('parsed')
    expect(ocr.body.fields.length).toBeGreaterThan(0)

    // 4. application create → prefill shows OCR fields
    const appRes = await request(app.getHttpServer())
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ scheme_slug: 'hospital-care-subsidy' })
      .expect(201)
    const appId = appRes.body.id

    const prefill = await request(app.getHttpServer())
      .get(`/api/applications/${appId}/prefill`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(prefill.body.prefill.name).toBe('Sunita Devi') // from mock OCR

    // 5. consent then submit
    await request(app.getHttpServer())
      .post(`/api/applications/${appId}/consent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ consent_version: 'v1.0', scopes: ['insurer', 'government'], esign_name: 'E2E Tester' })
      .expect(201)

    const sub = await request(app.getHttpServer())
      .post(`/api/applications/${appId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
    expect(sub.body.status).toBe('submitted')
  })

  it('rejects submit without consent', async () => {
    const appRes = await request(app.getHttpServer())
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ scheme_slug: 'hope-trust-grant' })
      .expect(201)
    await request(app.getHttpServer())
      .post(`/api/applications/${appRes.body.id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400) // consent gate
  })
})
