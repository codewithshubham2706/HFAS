import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { AppShell, TopHeader } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'

const ELIGIBILITY = ['scheme.elig1', 'scheme.elig2', 'scheme.elig3', 'scheme.elig4'] as const
const DOCS = ['scheme.docs1', 'scheme.docs2', 'scheme.docs3', 'scheme.docs4'] as const

/** Page 6 — scheme-detail: scheme header, animated eligibility checklist, doc list, contact. */
export function SchemeDetail() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { openOverlay } = useAppState()
  const [checked, setChecked] = useState<Record<string, boolean>>({ 'scheme.elig1': true, 'scheme.elig2': true })

  return (
    <AppShell active="/eligibility-results">
      <TopHeader />
      <main className="mx-auto w-full max-w-[880px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <button
          type="button"
          onClick={() => navigate('/eligibility-results')}
          className="u-caption mb-4 flex items-center gap-1 font-semibold text-[var(--color-primary-600)] hover:underline"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {t('scheme.backToResults')}
        </button>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-1)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="u-h2">{t('scheme.title')}</h1>
              <p className="u-caption mt-1">{t('scheme.provider')}</p>
            </div>
            <div className="text-right">
              <p className="u-caption">{t('scheme.coverageUpTo')}</p>
              <p className="u-h3 text-[var(--color-primary-700)]">₹2,00,000</p>
            </div>
          </div>

          <h2 className="u-h4 mt-6 mb-2">{t('scheme.about')}</h2>
          <p className="u-body u-muted">{t('scheme.aboutBody')}</p>

          <h2 className="u-h4 mt-6 mb-3">{t('scheme.eligibility')}</h2>
          <ul className="flex flex-col gap-2">
            {ELIGIBILITY.map((key) => {
              const on = !!checked[key]
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setChecked((c) => ({ ...c, [key]: !on }))}
                    aria-pressed={on}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 py-3 text-left text-[14px] font-medium transition-colors hover:border-[var(--color-primary-300)]"
                  >
                    {/* Animated stroke checkmark */}
                    <motion.span
                      className={`flex h-5.5 w-5.5 h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
                        on ? 'border-[var(--color-success-500)] bg-[var(--color-success-500)]' : 'border-[var(--border-strong)] bg-white'
                      }`}
                      animate={on ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={{ duration: 0.28 }}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
                        <motion.path
                          d="M3.5 8.5 6.5 11.5 12.5 4.5"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={false}
                          animate={{ pathLength: on ? 1 : 0 }}
                          transition={{ duration: 0.28, ease: 'easeOut' }}
                        />
                      </svg>
                    </motion.span>
                    <span className={on ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
                      {t(key)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <h2 className="u-h4 mt-6 mb-1">{t('scheme.docs')}</h2>
          <p className="u-caption mb-3">{t('scheme.docsUpload')}</p>
          <ul className="grid gap-2 md:grid-cols-2">
            {DOCS.map((key, i) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => openOverlay('docUpload', { docId: `doc-${i + 1}` })}
                  className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--color-gray-50)] px-4 py-3 text-left text-[14px] font-medium transition-colors hover:border-[var(--color-primary-300)] hover:bg-white"
                >
                  {t(key)}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-[var(--color-primary-600)]">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] bg-[var(--color-gray-50)] p-4">
            <div>
              <p className="u-h4">{t('scheme.contact')}</p>
              <p className="u-body u-muted mt-0.5">{t('scheme.contactPhone')}</p>
              <p className="u-caption">{t('scheme.contactHours')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">{t('scheme.saveForLater')}</Button>
              <Button onClick={() => openOverlay('appStepper')}>{t('scheme.startApplication')}</Button>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
