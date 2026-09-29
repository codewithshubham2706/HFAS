import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { AppShell, TopHeader } from '../components/layout/AppShell'
import { Stepper } from '../components/ui/Stepper'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { initialDocs } from '../data/mockData'

/** Page 7 — application-overview: draft status, progress stepper, docs summary, caseworker. */
export function ApplicationOverview() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { openOverlay, setActiveDocStage } = useAppState()
  const uploaded = initialDocs.filter((d) => d.status === 'uploaded').length

  return (
    <AppShell active="/application-overview">
      <TopHeader />
      <main className="mx-auto w-full max-w-[880px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <h1 className="u-h2">{t('overview.title')}</h1>
        <p className="u-body u-muted mt-1">{t('overview.progressLabel')}</p>

        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-1)]">
          <Stepper
            steps={[t('overview.stepDocs'), t('overview.stepDetails'), t('overview.stepConsent')]}
            current={0}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* Docs summary */}
            <section className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-4">
              <h2 className="u-h4">{t('overview.docsSummary')}</h2>
              <p className="u-h3 mt-1">
                {uploaded} / {initialDocs.length}
              </p>
              <p className="u-caption mt-1">{t('overview.docsMissing')}</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  setActiveDocStage('docs')
                  openOverlay('appStepper')
                }}
              >
                {t('common.uploadDocs')}
              </Button>
            </section>

            {/* Caseworker card */}
            <section className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-4">
              <h2 className="u-h4">{t('overview.caseworker')}</h2>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={t('overview.cwName')} size={56} />
                <div>
                  <p className="u-body font-semibold">{t('overview.cwName')}</p>
                  <p className="u-caption">{t('overview.cwRole')}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => openOverlay('supportChat')}
              >
                {t('overview.messageCw')}
              </Button>
            </section>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              onClick={() => {
                setActiveDocStage('docs')
                openOverlay('appStepper')
              }}
            >
              {t('overview.continue')}
            </Button>
          </div>
        </div>

        <p className="u-caption mt-4">
          <Link to="/status-timeline" className="font-semibold text-[var(--color-primary-600)] hover:underline">
            {t('common.viewTimeline')} →
          </Link>
        </p>
      </main>
    </AppShell>
  )
}
