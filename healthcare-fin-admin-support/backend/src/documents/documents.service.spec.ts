import { DocumentsService } from './documents.service'
import { StorageService } from './storage.service'
import { DbService } from '../db/db.service'
import { AuditService } from '../common/audit/audit.service'

/**
 * Flow test for upload → OCR → prefill. DB and storage are mocked; the goal
 * is to verify state-machine transitions, validation gates and audit calls.
 * (Full supertest coverage against a live Postgres runs in test/jest-e2e.)
 */
describe('DocumentsService — upload → ocr flow', () => {
  const actor = { sub: 'user-1', role: 'patient' as const }
  let db: { query: jest.Mock; tx: jest.Mock }
  let audit: { record: jest.Mock }
  let storage: { assertConfigured: jest.Mock; presign: jest.Mock }
  let svc: DocumentsService

  beforeEach(() => {
    db = { query: jest.fn(), tx: jest.fn() }
    audit = { record: jest.fn().mockResolvedValue(undefined) }
    storage = {
      assertConfigured: jest.fn(),
      presign: jest.fn().mockReturnValue('http://minio/signed-url'),
    }
    svc = new DocumentsService(
      db as unknown as DbService,
      storage as unknown as StorageService,
      audit as unknown as AuditService,
    )
    process.env.SIGNED_URL_TTL_SECONDS = '900'
  })

  it('issues presigned URL and stores pending document', async () => {
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // INSERT

    const res = await svc.createUpload(actor, 'user-1', {
      doc_type: 'aadhaar', content_type: 'image/png', byte_size: 1024,
    })

    expect(res.uploadUrl).toContain('signed-url')
    expect(res.method).toBe('PUT')
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'document.upload_url.issued' }))
  })

  it('rejects disallowed content types', async () => {
    await expect(
      svc.createUpload(actor, 'user-1', { doc_type: 'x', content_type: 'application/zip', byte_size: 10 }),
    ).rejects.toThrow(/content_type/)
  })

  it('rejects files above the 25 MB cap', async () => {
    await expect(
      svc.createUpload(actor, 'user-1', { doc_type: 'x', content_type: 'image/png', byte_size: 26_214_401 }),
    ).rejects.toThrow(/byte_size/)
  })

  it('rejects other users’ documents (owner check)', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 'd1', user_id: 'someone-else', status: 'uploaded' }] })
    await expect(svc.confirmUpload(actor, 'd1', 'a'.repeat(64))).rejects.toThrow(/insufficient role/)
  })

  it('OCR success moves status uploaded → parsed with fields', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'd1', user_id: 'user-1', status: 'uploaded', content_type: 'image/png', doc_type: 'aadhaar', storage_key: 'k', ocr_fields: null }] }) // getOwned
      .mockResolvedValueOnce({ rows: [] }) // set processing
      .mockResolvedValueOnce({ rows: [] }) // set parsed
    db.tx = db.tx

    const res = await svc.processOcr(actor, 'd1')
    expect(res.status).toBe('parsed')
    expect(res.fields.length).toBeGreaterThan(0)
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'document.ocr.completed' }))
  })

  it('OCR failure persists failed status', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'd1', user_id: 'user-1', status: 'uploaded', content_type: 'image/png', doc_type: 'aadhaar', storage_key: 'k', ocr_fields: null }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error('vision down')) // final update throws

    await expect(svc.processOcr(actor, 'd1')).rejects.toThrow('vision down')
  })
})
