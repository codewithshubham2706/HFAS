import { test, expect } from '@playwright/test'

/**
 * Synthetic scenario 1: upload → OCR confirm → submit (staging).
 * Emits synthetic.run_result via the tracker; alerts fire on failure.
 * Run: npx playwright test telemetry/synthetic --project=chromium
 */
test('upload → OCR confirm → submit', async ({ page, request }) => {
  const runId = `syn-${Date.now().toString(36)}`
  const emit = (outcome: string, failedStep?: string, durationMs?: number) =>
    request.post(`${process.env.API_BASE ?? 'http://localhost:4000/api'}/telemetry/ingest`, {
      data: {
        events: [{
          eventId: crypto.randomUUID(),
          eventName: 'synthetic.run_result',
          schemaVersion: 'v1',
          sessionId: runSessionId(runId),
          anonymousId: runSessionId(runId + '-anon'),
          timestamp: new Date().toISOString(),
          traceId: runId,
          properties: {
            scenario: 'upload_ocr_confirm_submit',
            outcome,
            failedStep: failedStep ?? null,
            durationMs: durationMs ?? 0,
            environment: process.env.SYNTHETIC_ENV ?? 'staging',
            runId,
            scheduledRun: process.env.CI === 'true',
          },
        }],
      },
    })

  const started = Date.now()
  try {
    // 1. Sign in as seeded demo patient
    await page.goto(`${process.env.WEB_BASE ?? 'http://localhost:3000'}/signup`)
    await page.getByLabel(/phone/i).fill('9876543210')
    await page.getByRole('button', { name: /send otp/i }).click()
    // OTP_DEV_MODE surfaces the code in the response payload
    const otpResp = await request.post(`${process.env.API_BASE ?? 'http://localhost:4000/api'}/auth/request-otp`, {
      data: { destination: '+919876543210', channel: 'sms' },
    })
    const { devOtp } = await otpResp.json()
    await page.getByLabel(/6-digit code/i).fill(devOtp ?? '000000')
    await page.getByRole('button', { name: /verify/i }).click()

    // 2. Start application from dashboard quick action
    await page.getByRole('button', { name: /start application/i }).click()
    await expect(page.getByRole('dialog', { name: /start your application/i })).toBeVisible()

    // 3. Upload → dropzone accepts a generated 1-page PDF
    await page.setInputFiles('input[type="file"]', {
      name: 'synthetic-invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 synthetic invoice test document'),
    })
    await expect(page.getByText(/reading your document|extracted/i)).toBeVisible({ timeout: 15_000 })

    // 4. Confirm OCR fields (accept all shown chips)
    const acceptButtons = page.getByRole('button', { name: /^accept$/i })
    const count = await acceptButtons.count()
    for (let i = 0; i < count; i++) await acceptButtons.nth(i).click()

    // 5. Consent + submit
    await page.getByRole('button', { name: /continue/i }).click()
    await page.getByLabel(/full name/i).fill('Synthetic Tester')
    await page.getByRole('button', { name: /agree and submit/i }).click()
    await expect(page.getByText(/application submitted/i)).toBeVisible({ timeout: 15_000 })

    await emit('passed', undefined, Date.now() - started)
  } catch (err) {
    await emit('failed', (err as Error).message.slice(0, 80), Date.now() - started)
    throw err
  }
})

/** Deterministic UUIDv5-ish from runId (no PII). */
function runSessionId(seed: string): string {
  const h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const hex = h.toString(16).padStart(8, '0')
  return `${hex}-0000-4000-8000-${(h % 1e12).toString().padStart(12, '0')}`
}
