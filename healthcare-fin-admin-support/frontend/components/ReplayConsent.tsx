import { useEffect, useState } from 'react'
import { tracker } from '../lib/tracker'

/**
 * Session-replay consent — shown once, before any recording.
 * Plain-language per docs/telemetry-privacy.md § consent snippets.
 * **REQUIRES LEGAL REVIEW** — exact wording + "all future sessions" pre-check
 * is NOT allowed; future scope must be a deliberate user action.
 */
export function ReplayConsent() {
  const [visible, setVisible] = useState(false)
  const [future, setFuture] = useState(false)

  useEffect(() => {
    // Ask only if never answered (localStorage) — re-ask on consent-version bump.
    if (!localStorage.getItem('hfas.replayConsent')) setVisible(true)
  }, [])

  async function decide(granted: boolean) {
    setVisible(false)
    await tracker.setReplayConsent(granted, future && granted ? 'all_future_sessions' : 'current_session')
    // Initialize the replay SDK here ONLY if granted:
    // if (granted) initReplay({ masking: maskingPolicyStrict }) — TODO(org)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replay-consent-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div className="card" style={{ maxWidth: 480 }}>
        <h3 id="replay-consent-title" style={{ fontSize: 18 }}>Help us improve HFAS</h3>
        <p className="muted" style={{ margin: '12px 0', fontSize: 14 }}>
          With your permission, we record how the screen is used — clicks and
          scrolls — to find and fix confusing steps. Personal details (ID
          numbers, bank details, phone) are always hidden before recording.
          You can change your mind anytime in Settings.
        </p>
        <label style={{ display: 'flex', gap: 8, fontSize: 14, alignItems: 'flex-start', marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={future}
            onChange={(e) => setFuture(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span>Also apply this choice to my future visits (optional — you choose each time otherwise)</span>
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => void decide(false)}>No thanks</button>
          <button className="btn btn-primary" onClick={() => void decide(true)}>Allow recording</button>
        </div>
      </div>
    </div>
  )
}
