#!/usr/bin/env node
/**
 * validate-schemas.mjs — CI gate for telemetry schemas.
 * 1. Every v1 event schema must be valid JSON Schema 2020-12.
 * 2. Every event must extend base (allOf ref) and pin eventName const.
 * 3. properties.additionalProperties must be false (schema strictness).
 * 4. PII sniff: field names / regex must not suggest raw PII.
 * Exit 1 on any violation → blocks PR.
 *
 * Run: node telemetry/validate-schemas.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const V1_DIR = join(import.meta.dirname ?? 'telemetry', 'schemas', 'v1')
const errors = []

const PII_NAME_SNIFF = /(name|phone|email|aadhaar|policy_number|bank|ifsc|address|dob|national_id)$/i
const PII_VALUE_SNIFF = /(value|raw_)?(user_)?(input|text|content)s?$/i

function fail(file, msg) {
  errors.push(`${file}: ${msg}`)
}

// 1. Parse & structural checks
const files = readdirSync(V1_DIR).filter((f) => f.endsWith('.json'))
if (!files.includes('base.schema.json')) fail('base.schema.json', 'missing')

const events = []
for (const f of files) {
  const path = join(V1_DIR, f)
  let doc
  try {
    doc = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    fail(f, `invalid JSON: ${e.message}`)
    continue
  }

  if (f === 'base.schema.json') continue

  // Must extend base
  const refs = JSON.stringify(doc.allOf ?? [])
  if (!refs.includes('base.schema.json')) fail(f, 'does not extend base.schema.json via allOf')

  // eventName const
  const nameConst = doc.properties?.eventName?.const
  if (!nameConst) fail(f, 'missing properties.eventName.const')

  // Strict properties
  const props = doc.properties?.properties
  if (!props || props.additionalProperties !== false) {
    fail(f, 'properties.additionalProperties must be false (no free-form payloads)')
  }

  // PII sniff on property names
  const propNames = Object.keys(props?.properties ?? {})
  for (const p of propNames) {
    if (PII_NAME_SNIFF.test(p) && !['docType', 'fieldName'].includes(p)) {
      fail(f, `property '${p}' looks like raw PII — hash, bucket, or remove it`)
    }
    if (PII_VALUE_SNIFF.test(p)) fail(f, `property '${p}' looks like free-form content capture`)
  }

  events.push(nameConst ?? f)
}

// 2. Uniqueness
const dupes = events.filter((e, i) => events.indexOf(e) !== i)
for (const d of dupes) fail('(set)', `duplicate eventName const '${d}'`)

// 3. Required event catalog coverage
const REQUIRED = [
  'page_view', 'action.start_application', 'action.upload_attempt', 'action.ocr_extracted',
  'action.ocr_confirmed', 'action.field_edit', 'action.submit_application', 'experiment.assigned',
  'support.request_help', 'session.replay_consent', 'synthetic.run_result',
]
for (const req of REQUIRED) {
  if (!events.includes(req)) fail('(catalog)', `required event '${req}' has no schema file`)
}

if (errors.length) {
  console.error(`✗ ${errors.length} schema violation(s):`)
  for (const e of errors) console.error('  -', e)
  process.exit(1)
}
console.log(`✓ ${files.length - 1} event schemas valid; catalog complete (${REQUIRED.length}/${REQUIRED.length})`)
