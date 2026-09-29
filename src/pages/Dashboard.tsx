import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { AppShell, TopHeader, SectionHeading } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { SchemeCard } from '../components/ui/SchemeCard'
import { schemes } from '../data/mockData'

/** Page 4 — dashboard: welcome, eligibility summary, quick actions, active application. */
export function Dashboard() {
  const { t } = useI18n()
  const { openOverlay } = useAppState()
  const topSchemes = [...schemes].sort((a, b) => b.match - a.match).slice(0, 3)

  return (
    <AppShell active="/dashboard">
      <TopHeader />
      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: [0.22, 0.9, 0.35, 1] }}
        >
          <h1 className="u-h2">{t('dash.welcome')}</h1>
          <p className="u-body u-muted mt-1">{t('dash.subtitle')}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => openOverlay('appStepper')}>
              {t('dash.quickAction')}
            </Button>
            <Link to="/eligibility-results">
              <Button size="lg" variant="secondary">{t('results.viewAll')}</Button>
            </Link>
          </div>
        </motion.div>

        <section className="mt-8">
          <SectionHeading title={t('dash.eligibilitySummary')} />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)]"
          >
            <p className="u-body">{t('dash.eligibilityBody', { count: schemes.length })}</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--color-gray-100)]">
              <motion.div
                className="h-full rounded-full bg-[var(--color-success-500)]"
                initial={{ width: 0 }}
                animate={{ width: '72%' }}
                transition={{ duration: 0.8, ease: [0.22, 0.9, 0.35, 1] }}
              />
            </div>
            <p className="u-caption mt-2">{t('dash.eligibilityFootnote')}</p>
          </motion.div>
        </section>

        <section className="mt-8">
          <SectionHeading
            title={t('dash.recommended')}
            action={
              <Link to="/eligibility-results" className="text-[14px] font-semibold text-[var(--color-primary-600)] hover:underline">
                {t('results.viewAll')}
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            {topSchemes.map((s) => (
              <SchemeCard key={s.id} scheme={s} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <SectionHeading title={t('dash.applicationsActive')} />
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="u-caption">{t('dash.invLabel')}</p>
                <p className="u-h4 mt-0.5 u-mono">INV-20260712-019</p>
                <p className="u-caption mt-1">{t('dash.invScheme')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-[var(--radius-full)] bg-[var(--color-info-50)] px-3 py-1 text-[12px] font-semibold text-[var(--color-info-600)]">
                  {t('dash.invStatus')}
                </span>
                <Link to="/status-timeline" className="text-[14px] font-semibold text-[var(--color-primary-600)] hover:underline">
                  {t('common.viewTimeline')}
                </Link>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--color-gray-100)]">
              <div className="h-full w-[60%] rounded-full bg-[var(--color-primary-600)]" />
            </div>
            <p className="u-caption mt-2">{t('dash.invProgress')}</p>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
