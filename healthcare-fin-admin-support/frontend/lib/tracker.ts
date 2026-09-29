/**
 * tracker.ts — HFAS behavioral telemetry client.
 * - Batches events, flushes every 5s or 20 events, on visibilitychange.
 * - sessionId rotates after 30 min inactivity; anonymousId persists.
 * - userId attached only when logged in (passed in via identify()).
 * - PII policy: schemas/v1/* are strict — validator blocks new fields.
 * - Replay recording starts ONLY after consent (see ReplayConsent).
 */
import { api } from './api'

type EventProps = Record<string, unknown>
type OutEvent = {
  eventId: string; eventName: string; schemaVersion: 'v1'
  sessionId: string; userId: string | null; anonymousId: string
  timestamp: string; traceId?: string; properties: EventProps
}

const SESSION_KEY = 'hfas.session'
const ANON_KEY = 'hfas.anonymousId'
const REPLAY_KEY = 'hfas.replayConsent'
const IDLE_ROTATE_MS = 30 * 60 * 1000
const FLUSH_MS = 5000
const FLUSH_AT = 20

let queue: OutEvent[] = []
let userId: string | null = null
let flushTimer: ReturnType<typeof setInterval> | null = null

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function getSession(): { id: string; startedAt: number } {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      const s = JSON.parse(raw) as { id: string; startedAt: number }
      if (Date.now() - s.startedAt < IDLE_ROTATE_MS) return s
    }
  } catch { /* corrupted — rotate */ }
  const fresh = { id: uuid(), startedAt: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(fresh))
  return fresh
}

function touchSession(): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...getSession(), startedAt: Date.now() }))
}

function anonymousId(): string {
  let id = localStorage.getItem(ANON_KEY)
  if (!id) {
    id = uuid()
    localStorage.setItem(ANON_KEY, id)
  }
  return id
}

/** Trace id joins client events with API/server logs (W3C format, coarse). */
function traceId(): string {
  return `00-${uuid().replaceAll('-', '').slice(0, 32)}-${uuid().replaceAll('-', '').slice(0, 16)}-01`
}

export const tracker = {
  identify(uid: string | null): void {
    userId = uid
  },

  track(eventName: string, properties: EventProps = {}): void {
    const s = getSession()
    touchSession()
    queue.push({
      eventId: uuid(),
      eventName,
      schemaVersion: 'v1',
      sessionId: s.id,
      userId,
      anonymousId: anonymousId(),
      timestamp: new Date().toISOString(),
      traceId: traceId(),
      properties,
    })
    if (queue.length >= FLUSH_AT) void this.flush()
    else if (!flushTimer) flushTimer = setInterval(() => void this.flush(), FLUSH_MS)
  },

  async flush(): Promise<void> {
    if (!queue.length) return
    const batch = queue.splice(0, 100)
    try {
      await api('/telemetry/ingest', { method: 'POST', body: { events: batch } })
    } catch {
      // Never break UX for telemetry: drop silently (or re-queue once).
      if (batch.length < 50) queue = [...batch, ...queue].slice(0, 200)
    }
  },

  /** Replay consent gate — see ReplayConsent component. */
  replayConsent(): { granted: boolean; scope: string | null } {
    const raw = localStorage.getItem(REPLAY_KEY)
    return raw ? JSON.parse(raw) : { granted: false, scope: null }
  },

  async setReplayConsent(granted: boolean, scope: 'current_session' | 'all_future_sessions'): Promise<void> {
    localStorage.setItem(REPLAY_KEY, JSON.stringify({ granted, scope, ts: Date.now() }))
    try {
      await api('/telemetry/replay-consent', {
        method: 'POST',
        body: { sessionId: getSession().id, anonymousId: anonymousId(), granted, scope, consentVersion: 'replay-v1.0' },
      })
    } catch { /* ledger write retried next session; event still queued */ }
    this.track('session.replay_consent', { granted, scope, consentVersion: 'replay-v1.0', maskingProfile: 'strict' })
  },

  start(): void {
    if (flushTimer) return
    flushTimer = setInterval(() => void this.flush(), FLUSH_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void this.flush()
    })
  },
}
