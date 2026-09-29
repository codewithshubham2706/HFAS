import { useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { AppShell, TopHeader } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { TimelineItem } from '../components/ui/TimelineItem'
import { timelineEvents, type TimelineType } from '../data/mockData'

type Filter = 'all' | TimelineType

/** Page 12 — status-timeline: vertical activity timeline with filters, appeal, download. */
export function StatusTimeline() {
  const { t } = useI18n()
  const { showToast, openOverlay } = useAppState()
  const [filter, setFilter] = useState<Filter>('all')

  const events = useMemo(
    () => timelineEvents.filter((e) => filter === 'all' || e.type === filter),
    [filter],
  )

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('timeline.filterAll') },
    { id: 'status', label: t('timeline.filterStatus') },
    { id: 'docs', label: t('timeline.filterDocs') },
    { id: 'messages', label: t('timeline.filterMessages') },
  ]

  return (
    <AppShell active="/status-timeline">
      <TopHeader />
      <main className="mx-auto w-full max-w-[820px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="u-h2">{t('timeline.title')}</h1>
            <p className="u-caption u-mono mt-1">{t('timeline.ref')}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast(t('toast.historyDownloaded'))}
          >
            {t('timeline.downloadHistory')}
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`rounded-[var(--radius-full)] border px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 ${
                filter === f.id
                  ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white'
                  : 'border-[var(--border-strong)] bg-white text-[var(--text-secondary)] hover:border-[var(--color-primary-300)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ol className="mt-7">
          {events.map((e) => (
            <TimelineItem
              key={e.id}
              event={e}
              onAppeal={() => openOverlay('supportChat')}
            />
          ))}
        </ol>

        <p className="u-caption mt-2">{t('timeline.appealNote')}</p>
      </main>
    </AppShell>
  )
}
