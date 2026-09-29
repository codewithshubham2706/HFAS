import { useState } from 'react'
import Head from 'next/head'
import { useI18n } from '../../lib/i18n'
import { endpoints } from '../../lib/api'

/** Data-subject rights UI (GDPR Art. 15–17 / DPDP). **REQUIRES LEGAL REVIEW** for copy. */
export default function Settings() {
  const { t } = useI18n()
  const [city, setCity] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function doExport() {
    const data = await endpoints.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hfas-data-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('✓ ' + t('settings.export'))
  }

  async function requestCorrection() {
    if (!city.trim()) return
    await endpoints.updateForm /* placeholder for correction endpoint */
    setMessage('✓ ' + t('settings.correction'))
  }

  async function requestDeletion() {
    await endpoints.requestDeletion()
    setConfirmDelete(false)
    setMessage('✓ ' + t('settings.deletion.confirm'))
  }

  return (
    <>
      <Head><title>{t('settings.title')} — {t('app.name')}</title></Head>
      <main className="container" style={{ maxWidth: 560, paddingTop: 32, paddingBottom: 48 }}>
        <h2 style={{ fontSize: 24 }}>{t('settings.title')}</h2>
        {message && <p className="chip chip-success" style={{ marginTop: 12 }}>{message}</p>}

        <section className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 16 }}>{t('settings.export')}</h3>
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 12px' }}>
            GDPR Art. 15 / DPDP — full machine-readable export of everything we hold.
          </p>
          <button className="btn btn-secondary" onClick={() => void doExport()}>{t('settings.export')}</button>
        </section>

        <section className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16 }}>{t('settings.correction')}</h3>
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 12px' }}>
            Tell us what to fix — a caseworker reviews within 5 working days.
          </p>
          <input className="input" placeholder="City → Nashik" value={city} onChange={(e) => setCity(e.target.value)} />
          <button className="btn btn-secondary" style={{ marginTop: 12 }} disabled={!city.trim()} onClick={() => void requestCorrection()}>
            {t('settings.correction')}
          </button>
        </section>

        <section className="card" style={{ marginTop: 16, borderColor: 'var(--color-error-600)' }}>
          <h3 style={{ fontSize: 16, color: 'var(--color-error-600)' }}>{t('settings.deletion')}</h3>
          {!confirmDelete ? (
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setConfirmDelete(true)}>
              {t('settings.deletion')}
            </button>
          ) : (
            <div style={{ marginTop: 12 }}>
              <p className="error-text">{t('settings.deletion.confirm')}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ background: 'var(--color-error-600)' }} onClick={() => void requestDeletion()}>
                  Confirm
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
