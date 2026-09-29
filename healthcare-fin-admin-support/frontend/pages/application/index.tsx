import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useI18n } from '../../lib/i18n'
import { endpoints, type Match } from '../../lib/api'
import { EligibilityCard } from '../../components/EligibilityCard'
import { DocumentUploader } from '../../components/DocumentUploader'

type Stage = 'matches' | 'documents' | 'consent' | 'done'

export default function ApplicationPage() {
  const { t } = useI18n()
  const [stage, setStage] = useState<Stage>('matches')
  const [matches, setMatches] = useState<Match[]>([])
  const [appId, setAppId] = useState<string | null>(null)
  const [esign, setEsign] = useState('')
  const [scopes, setScopes] = useState({ insurer: true, hospital: true, government: true })
  const [reference, setReference] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('hfas.matches')
    if (saved) setMatches(JSON.parse(saved) as Match[])
  }, [])

  async function startApplication(slug: string) {
    try {
      const res = await endpoints.createApplication(slug)
      setAppId(res.id)
      setReference(res.reference)
      setStage('documents')
    } catch (err) {
      setError(String(err))
    }
  }

  async function submit() {
    if (!appId) return
    try {
      await endpoints.recordConsent(appId, {
        consent_version: 'v1.0',
        scopes: Object.entries(scopes).filter(([, v]) => v).map(([k]) => k),
        esign_name: esign,
      })
      const res = await endpoints.submit(appId)
      setReference(res.reference)
      setStage('done')
    } catch (err) {
      setError(String(err))
    }
  }

  const stages: { id: Stage; label: string }[] = [
    { id: 'matches', label: t('results.title') },
    { id: 'documents', label: t('application.step.documents') },
    { id: 'consent', label: t('application.step.consent') },
  ]

  return (
    <>
      <Head><title>{t('application.title')} — {t('app.name')}</title></Head>
      <main className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <h2 style={{ fontSize: 24 }}>{t('application.title')}</h2>
        {reference && <p className="muted u-mono" style={{ fontSize: 13 }}>{reference}</p>}

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 8, margin: '16px 0 24px' }} role="progressbar" aria-valuenow={stages.findIndex((s) => s.id === stage) + 1} aria-valuemax={3}>
          {stages.map((s, i) => (
            <div key={s.id} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, background: i <= stages.findIndex((x) => x.id === stage) ? 'var(--color-primary-600)' : 'var(--color-gray-200)' }} />
              <div style={{ fontSize: 12, marginTop: 6 }} className="muted">{s.label}</div>
            </div>
          ))}
        </div>

        {error && <p className="error-text" role="alert">{error}</p>}

        {stage === 'matches' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {matches.map((m) => (
              <EligibilityCard key={m.schemeId} match={m} onApply={(slug) => void startApplication(slug)} />
            ))}
          </div>
        )}

        {stage === 'documents' && (
          <div style={{ maxWidth: 560 }}>
            <DocumentUploader docType="hospital_invoice" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => setStage('consent')}>
                {t('application.step.consent')} →
              </button>
            </div>
          </div>
        )}

        {stage === 'consent' && (
          <div className="card" style={{ maxWidth: 560 }}>
            {/* **REQUIRES LEGAL REVIEW**: consent copy must be approved by counsel (docs/ConsentForm.md) */}
            <p style={{ marginBottom: 16 }}>{t('application.consent.text')}</p>
            <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['insurer', 'hospital', 'government'] as const).map((k) => (
                <label key={k} style={{ display: 'flex', gap: 8, fontSize: 14 }}>
                  <input type="checkbox" checked={scopes[k]} onChange={(e) => setScopes((s) => ({ ...s, [k]: e.target.checked }))} />
                  {k}
                </label>
              ))}
            </fieldset>
            <label className="label" htmlFor="esign" style={{ marginTop: 16 }}>{t('application.consent.esign')}</label>
            <input id="esign" className="input" value={esign} onChange={(e) => setEsign(e.target.value)} />
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 16 }}
              disabled={esign.trim().length < 3 || !Object.values(scopes).some(Boolean)}
              onClick={() => void submit()}
            >
              {t('application.consent.submit')}
            </button>
          </div>
        )}

        {stage === 'done' && (
          <div className="card" style={{ maxWidth: 560, textAlign: 'center' }}>
            <p style={{ fontSize: 40 }}>✓</p>
            <h3>{t('application.submitted')}</h3>
            <p className="muted u-mono">{reference}</p>
          </div>
        )}
      </main>
    </>
  )
}
