import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'
import { AppShell, TopHeader } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
/** Page 11 — submission-confirmation: check-burst celebration, summary, next steps. */
export function SubmissionConfirmation() {
  const { t } = useI18n()
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setCelebrate(true), 200)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <AppShell active="/submission-confirmation">
      <TopHeader />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-8 text-center shadow-[var(--shadow-1)]">
          {/* Check-burst (Lottie stand-in) */}
          <motion.div
            className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-success-50)]"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={celebrate ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            <motion.svg width="40" height="40" viewBox="0 0 16 16" aria-hidden="true">
              <motion.path
                d="M6.5 10.6 3.9 8l-1.1 1.1 3.7 3.7 7.3-7.3L12.7 4.4 6.5 10.6Z"
                fill="var(--color-success-500)"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.26 }}
              />
            </motion.svg>
            {/* burst rays */}
            {celebrate &&
              [0, 60, 120, 180, 240, 300].map((deg) => (
                <motion.span
                  key={deg}
                  className="absolute left-1/2 top-1/2 h-1.5 w-6 rounded-full bg-[var(--color-success-100)]"
                  style={{ transformOrigin: '0 50%' }}
                  initial={{ rotate: deg, scaleX: 0.4, opacity: 1 }}
                  animate={{ rotate: deg, scaleX: 1.35, opacity: 0 }}
                  transition={{ delay: 0.22, duration: 0.55, ease: 'easeOut' }}
                />
              ))}
          </motion.div>

          <h1 className="u-h2">{t('confirm.title')}</h1>
          <p className="u-body u-muted mt-2">{t('confirm.body')}</p>

          <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--color-gray-50)] p-4 text-left">
            <p className="u-caption">{t('confirm.ref')}</p>
            <p className="u-h4 u-mono mt-0.5">INV-20260712-019</p>
          </div>

          <dl className="mt-4 space-y-2.5 text-left">
            {[
              [t('confirm.schemeRow'), t('confirm.schemeValue')],
              [t('confirm.docsRow'), t('confirm.docsValue')],
              [t('confirm.statusRow'), t('confirm.statusValue')],
            ].map(([dt, dd]) => (
              <div key={dt} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 border-b border-[var(--border-subtle)] pb-2.5">
                <dt className="u-caption">{dt}</dt>
                <dd className="u-body font-medium">{dd}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/status-timeline"
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-6 text-[15px] font-semibold text-white shadow-[var(--shadow-1)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[var(--color-primary-700)] hover:shadow-[var(--shadow-2)]"
            >
              {t('common.viewTimeline')}
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-6 text-[15px] font-semibold text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--color-gray-100)]"
            >
              {t('confirm.backHome')}
            </Link>
          </div>
        </div>

        <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)] text-left">
          <h2 className="u-h4">{t('confirm.nextSteps')}</h2>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
            <li className="u-body">{t('confirm.next1')}</li>
            <li className="u-body">{t('confirm.next2')}</li>
            <li className="u-body">{t('confirm.next3')}</li>
          </ol>
        </section>
      </main>
    </AppShell>
  )
}
