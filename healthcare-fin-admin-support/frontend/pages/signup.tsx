import { FormEvent, useState } from 'react'
import Head from 'next/head'
import { useI18n } from '../lib/i18n'
import { endpoints, setSession } from '../lib/api'

export default function Signup() {
  const { t } = useI18n()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [otpStage, setOtpStage] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendOtp(e: FormEvent) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) {
      setError(t('auth.errorPhone'))
      return
    }
    setError(null)
    setBusy(true)
    try {
      const res = await endpoints.requestOtp(`+91${digits}`, 'sms')
      setDevOtp(res.devOtp ?? null) // dev mode only
      setOtpStage(true)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await endpoints.verifyOtp(`+91${phone.replace(/\D/g, '')}`, code, 'sms')
      setSession(res)
      window.location.href = res.isNewUser ? '/wizard/1' : '/application'
    } catch {
      setError(t('auth.errorOtp'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Head><title>{t('auth.title')} — {t('app.name')}</title></Head>
      <main className="container" style={{ maxWidth: 420, paddingTop: 48 }}>
        <div className="card">
          <h2 style={{ fontSize: 22 }}>{t('auth.title')}</h2>
          <p className="muted" style={{ margin: '6px 0 20px' }}>{t('auth.subtitle')}</p>

          {!otpStage ? (
            <form onSubmit={sendOtp} noValidate>
              <label className="label" htmlFor="phone">{t('auth.phone')}</label>
              <input
                id="phone" className="input" inputMode="tel" autoComplete="tel"
                placeholder={t('auth.phonePlaceholder')} value={phone}
                aria-invalid={!!error}
                onChange={(e) => setPhone(e.target.value)}
              />
              {error && <p className="error-text" role="alert">{error}</p>}
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={busy}>
                {t('auth.sendOtp')}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} noValidate>
              <p className="muted" style={{ marginBottom: 12 }}>
                {devOtp && <strong style={{ color: 'var(--color-warning-600)' }}>{t('auth.devOtp', { code: devOtp })}</strong>}
              </p>
              <label className="label" htmlFor="otp">{t('auth.otpLabel')}</label>
              <input
                id="otp" className="input" inputMode="numeric" maxLength={6}
                value={code} aria-invalid={!!error}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              {error && <p className="error-text" role="alert">{error}</p>}
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={busy || code.length !== 6}>
                {t('auth.verify')}
              </button>
            </form>
          )}

          <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>{t('auth.privacy')}</p>
        </div>
      </main>
    </>
  )
}
