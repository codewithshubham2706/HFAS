import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

/** Page 2 — auth-signup-desktop: phone/email signup with OTP verification modal. */
export function AuthSignup() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { showToast } = useAppState()
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [otpOpen, setOtpOpen] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  function submitIdentifier(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'phone' && !/^\d{10}$/.test(value.replace(/\s/g, ''))) {
      setError(t('toast.errorPhone'))
      return
    }
    if (mode === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
      setError(t('toast.errorEmail'))
      return
    }
    setError(null)
    setOtpOpen(true)
    showToast(t('toast.otpSent'))
  }

  function handleOtpChange(i: number, v: string) {
    if (!/^\d?$/.test(v)) return
    const next = [...otp]
    next[i] = v
    setOtp(next)
    if (v && i < 5) {
      const nextInput = document.getElementById(`otp-${i + 1}`)
      nextInput?.focus()
    }
  }

  function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.join('').length < 6) {
      setOtpError(t('auth.otpError'))
      return
    }
    setOtpError(null)
    setVerifying(true)
    window.setTimeout(() => {
      setVerifying(false)
      setOtpOpen(false)
      showToast(t('toast.otpVerified'))
      navigate('/onboarding-wizard')
    }, 900)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-gray-50)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-600)] text-[13px] font-extrabold text-white">HF</span>
          <span className="text-[17px] font-bold tracking-tight">HFAS</span>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-2)] md:p-8">
          <h1 className="u-h2 mb-1.5">{t('auth.title')}</h1>
          <p className="u-body u-muted mb-6">{t('auth.subtitle')}</p>

          <form onSubmit={submitIdentifier} className="flex flex-col gap-4" noValidate>
            {mode === 'phone' ? (
              <Input
                label={t('auth.phoneLabel')}
                inputMode="tel"
                autoComplete="tel"
                placeholder={t('auth.phonePlaceholder')}
                value={value}
                error={error ?? undefined}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : (
              <Input
                label={t('auth.emailLabel')}
                type="email"
                autoComplete="email"
                placeholder={t('auth.emailPlaceholder')}
                value={value}
                error={error ?? undefined}
                onChange={(e) => setValue(e.target.value)}
              />
            )}

            <button
              type="button"
              className="self-start text-[13px] font-semibold text-[var(--color-primary-600)] hover:underline"
              onClick={() => {
                setMode((m) => (m === 'phone' ? 'email' : 'phone'))
                setValue('')
                setError(null)
              }}
            >
              {mode === 'phone' ? t('auth.emailToggle') : t('auth.phoneToggle')}
            </button>

            <Button type="submit" size="lg">{t('auth.sendOtp')}</Button>
          </form>

          <p className="u-caption mt-4">{t('auth.privacyMicrocopy')}</p>

          <p className="mt-6 text-center text-[14px]">
            <Link to="/eligibility-results" className="font-semibold text-[var(--color-primary-600)] hover:underline">
              {t('auth.signInLink')}
            </Link>
          </p>
        </div>
      </div>

      {/* OTP modal */}
      <Modal open={otpOpen} onClose={() => setOtpOpen(false)} title={t('auth.otpTitle')}>
        <form onSubmit={verifyOtp} className="flex flex-col gap-4">
          <p className="u-body u-muted">{t('auth.otpSubtitle', { phone: mode === 'phone' ? value : t('auth.emailLabel') })}</p>
          <fieldset className="flex justify-between gap-2">
            <legend className="sr-only">{t('auth.otpLabel')}</legend>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                inputMode="numeric"
                maxLength={1}
                aria-label={`${t('auth.otpLabel')} ${i + 1}`}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                className={`h-12 w-full max-w-[48px] rounded-[var(--radius-md)] border text-center text-[18px] font-semibold focus:outline-none focus:ring-2 ${
                  otpError
                    ? 'border-[var(--color-error-500)] focus:ring-[var(--color-error-100)]'
                    : 'border-[var(--border-strong)] focus:border-[var(--color-primary-600)] focus:ring-[var(--color-primary-100)]'
                }`}
              />
            ))}
          </fieldset>
          {otpError && <p className="text-[13px] font-medium text-[var(--color-error-600)]">{otpError}</p>}
          <Button type="submit" size="lg" loading={verifying}>
            {verifying ? t('common.loading') : t('auth.otpVerify')}
          </Button>
          <button
            type="button"
            className="text-[13px] font-semibold text-[var(--color-primary-600)] hover:underline"
            onClick={() => showToast(t('toast.otpSent'))}
          >
            {t('auth.otpResend')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
