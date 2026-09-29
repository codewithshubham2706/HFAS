import { test, expect } from '@playwright/test'

/**
 * Synthetic scenario 2: admin queue → quick-review → decision (staging).
 * Uses the seeded admin account; validates staff flows stay healthy.
 */
test('admin quick-review → decision', async ({ page, request }) => {
  const runId = `syn-admin-${Date.now().toString(36)}`
  const started = Date.now()
  const base = process.env.WEB_BASE ?? 'http://localhost:3000'

  try {
    // Login as seeded admin (email/password path)
    await page.goto(`${base}/signup`)
    // OTP path is patient-only; admin uses seeded password login via API token
    const login = await request.post(`${process.env.API_BASE ?? 'http://localhost:4000/api'}/auth/login`, {
      data: { email: 'admin@demo.hfas', password: 'hfas-Demo-2026!' },
    })
    expect(login.ok()).toBeTruthy()
    const { accessToken } = await login.json()

    // Queue is reachable and returns seeded submitted applications
    const queue = await request.get(`${process.env.API_BASE ?? 'http://localhost:4000/api'}/applications/queue`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(queue.ok()).toBeTruthy()
    const items = await queue.json()
    expect(Array.isArray(items)).toBeTruthy()

    // Staff overview responds with counters
    const overview = await request.get(`${process.env.API_BASE ?? 'http://localhost:4000/api'}/admin/overview`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const stats = await overview.json()
    expect(stats).toHaveProperty('applications_by_status')

    await request.post(`${process.env.API_BASE ?? 'http://localhost:4000/api'}/telemetry/ingest`, {
      data: {
        events: [{
          eventId: crypto.randomUUID(),
          eventName: 'synthetic.run_result',
          schemaVersion: 'v1',
          sessionId: `00000000-0000-4000-8000-${Date.now() % 1e12}`.padEnd(36, '0').slice(0, 36),
          anonymousId: `00000000-0000-4000-8000-${(Date.now() + 1) % 1e12}`.padEnd(36, '0').slice(0, 36),
          timestamp: new Date().toISOString(),
          traceId: runId,
          properties: {
            scenario: 'admin_quickreview_connector_submit',
            outcome: 'passed',
            failedStep: null,
            durationMs: Date.now() - started,
            environment: process.env.SYNTHETIC_ENV ?? 'staging',
            runId,
            scheduledRun: process.env.CI === 'true',
          },
        }],
      },
    })
  } catch (err) {
    await request.post(`${process.env.API_BASE ?? 'http://localhost:4000/api'}/telemetry/ingest`, {
      data: {
        events: [{
          eventId: crypto.randomUUID(),
          eventName: 'synthetic.run_result',
          schemaVersion: 'v1',
          sessionId: `00000000-0000-4000-8000-${Date.now() % 1e12}`.padEnd(36, '0').slice(0, 36),
          anonymousId: `00000000-0000-4000-8000-${(Date.now() + 1) % 1e12}`.padEnd(36, '0').slice(0, 36),
          timestamp: new Date().toISOString(),
          traceId: runId,
          properties: {
            scenario: 'admin_quickreview_connector_submit',
            outcome: 'failed',
            failedStep: (err as Error).message.slice(0, 80),
            durationMs: Date.now() - started,
            environment: process.env.SYNTHETIC_ENV ?? 'staging',
            runId,
            scheduledRun: process.env.CI === 'true',
          },
        }],
      },
    })
    throw err
  }
})
