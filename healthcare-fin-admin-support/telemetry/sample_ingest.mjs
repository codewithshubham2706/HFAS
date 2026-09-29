#!/usr/bin/env node
/**
 * sample_ingest.mjs — seed a realistic local event stream.
 * Usage:
 *   node telemetry/sample_ingest.mjs            # 8 happy-path events
 *   node telemetry/sample_ingest.mjs --spike    # +12 upload failures (alert demo)
 */
const API = process.env.API_BASE ?? 'http://localhost:4000/api'
const spike = process.argv.includes('--spike')

const session = 'a1111111-0000-4000-8000-000000000001'
const anon = 'b2222222-0000-4000-8000-000000000002'
const user = '11111111-1111-4111-8111-111111111111'
const doc = 'ccccccc1-0000-4000-8000-000000000001'
const appId = 'bbbbbbb1-0000-4000-8000-000000000001'

const now = Date.now()
const iso = (offsetSec) => new Date(now + offsetSec * 1000).toISOString()
let seq = 0
const ev = (eventName, properties, offsetSec = 0) => ({
  eventId: `7b2e1c10-0000-4000-8000-${String(++seq).padStart(12, '0')}`,
  eventName, schemaVersion: 'v1',
  sessionId: session, userId: user, anonymousId: anon,
  timestamp: iso(offsetSec), traceId: '00-abc123-def456-01',
  properties,
})

const events = [
  ev('page_view', { page: 'dashboard', locale: 'en-IN', a11yMode: false }, -600),
  ev('action.start_application', { schemeSlug: 'hospital-care-subsidy', source: 'dashboard_quick_action', matchScore: 92 }, -540),
  ev('page_view', { page: 'application-documents', locale: 'en-IN' }, -480),
  ev('action.upload_attempt', { docType: 'hospital_invoice', contentType: 'image/jpeg', sizeBucket: '1mb_5mb', inputMethod: 'camera_capture', documentId: doc }, -420),
  ev('action.ocr_extracted', { documentId: doc, docType: 'hospital_invoice', provider: 'mock', fieldCount: 3, confidenceBuckets: { high_ge90: 2, medium_70_89: 1, low_lt70: 0 }, latencyMs: 1820, status: 'parsed' }, -380),
  ev('action.field_edit', { fieldName: 'invoice_no', source: 'ocr_prefill', confidence: 0.94, editOrdinal: 1 }, -300),
  ev('action.ocr_confirmed', { documentId: doc, acceptedCount: 2, editedCount: 1, lowConfidenceVerified: 0, autoAcceptRatio: 0.67, dwellMs: 41000 }, -120),
  ev('action.submit_application', { applicationId: appId, schemeSlug: 'hospital-care-subsidy', outcome: 'submitted', progressPct: 100, priorityScore: 40, approvalLikelihood: 85, totalEdits: 1, dwellMs: 600000 }, -60),
]

if (spike) {
  for (let i = 0; i < 12; i++) {
    events.push(ev('action.upload_attempt', {
      docType: 'aadhaar', contentType: 'image/jpeg', sizeBucket: '5mb_10mb',
      inputMethod: 'file_picker', documentId: null, error: 'storage_put_failed',
    }, i * 10 - 900))
  }
}

const res = await fetch(`${API}/telemetry/ingest`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ events }),
})
const body = await res.text()
console.log(`POST ${API}/telemetry/ingest → ${res.status}`)
console.log(body)

// Example of a REJECTED event (validator demo — sent separately):
const bad = { ...ev('page_view', { page: 'x' }), eventId: 'not-a-uuid' }
const res2 = await fetch(`${API}/telemetry/ingest`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ events: [bad] }),
})
console.log(`validator demo → ${res2.status}`, await res2.text())
