import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { AppShell, TopHeader } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

/** Page 10 — application-consent: legal consent, sharing targets, e-sign, submit. */
export function ApplicationConsent() {
  const { t } = useI18n()
  const { openOverlay } = useAppState()
  const [allAgree, setAllAgree] = useState(false)
  const [esign, setEsign] = useState('')

  const canOpen = allAgree && esign.trim().length >= 3

  return (
    <AppShell active="/application-consent">
      <TopHeader />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <h1 className="u-h2">{t('consent.title')}</h1>

        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-1)]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-[var(--radius-full)] bg-[var(--color-warning-50)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-warning-600)]">
              **REQUIRES LEGAL REVIEW**
            </span>
          </div>

          <p className="u-body u-muted">{t('consent.body')}</p>

          <div className="mt-5 flex flex-col gap-2.5">
            <label className="flex items-start gap-2.5 text-[14px]">
              <input type="checkbox" checked={allAgree} onChange={(e) => setAllAgree(e.target.checked)} className="mt-0.5 accent-[var(--color-primary-600)]" />
              <span>{t('consent.shareAll')}</span>
            </label>
          </div>

          <div className="mt-5">
            <Input
              label={t('consent.esign')}
              placeholder={t('consent.esignPlaceholder')}
              hint={t('consent.esignNote')}
              value={esign}
              onChange={(e) => setEsign(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button size="lg" disabled={!canOpen} onClick={() => openOverlay('consentModal')}>
              {t('consent.submit')}
            </Button>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
