import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'

/**
 * Cookie consent widget — granular categories per docs/CookiePolicy.md.
 * Consent stored in localStorage AND mirrored to /api consent audit when
 * backend is wired. **REQUIRES LEGAL REVIEW** for EU ePrivacy compliance.
 */
type Consent = { essential: true; analytics: boolean; marketing: boolean; ts: string }
const KEY = 'hfas.cookie-consent'

export function CookieConsent() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  function save(prefs: { analytics: boolean; marketing: boolean }) {
    const consent: Consent = { essential: true, ...prefs, ts: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(consent))
    // Only load analytics/marketing scripts AFTER explicit consent here.
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div role="region" aria-label={t('cookie.title')}
         style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                  background: '#fff', borderTop: '1px solid var(--border-subtle)', boxShadow: '0 -4px 16px rgba(20,24,30,0.08)' }}>
      <div className="container" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', padding: '16px 24px' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ fontWeight: 600 }}>{t('cookie.title')}</p>
          <p className="muted" style={{ fontSize: 13 }}>{t('cookie.body')}</p>
        </div>
        <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked disabled /> {t('cookie.essential')}
        </label>
        <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> {t('cookie.analytics')}
        </label>
        <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> {t('cookie.marketing')}
        </label>
        <button className="btn btn-secondary" onClick={() => save({ analytics: false, marketing: false })}>
          {t('cookie.save')}
        </button>
        <button className="btn btn-primary" onClick={() => save({ analytics: true, marketing: true })}>
          {t('cookie.acceptAll')}
        </button>
      </div>
    </div>
  )
}
