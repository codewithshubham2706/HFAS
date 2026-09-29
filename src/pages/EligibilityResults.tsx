import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'
import { AppShell, TopHeader } from '../components/layout/AppShell'
import { SchemeCard } from '../components/ui/SchemeCard'
import { schemes, type ProviderType } from '../data/mockData'

type Filter = 'all' | ProviderType

/** Page 5 — eligibility-results: matched schemes grid with provider filters and sort. */
export function EligibilityResults() {
  const { t } = useI18n()
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<'match' | 'amount'>('match')

  const filtered = useMemo(() => {
    const list = schemes.filter((s) => filter === 'all' || s.providerType === filter)
    return [...list].sort((a, b) =>
      sort === 'match' ? b.match - a.match : b.amountValue - a.amountValue,
    )
  }, [filter, sort])

  const filterOptions: { id: Filter; label: string }[] = [
    { id: 'all', label: t('results.filterAll') },
    { id: 'govt', label: t('results.filterGovt') },
    { id: 'insurer', label: t('results.filterInsurer') },
    { id: 'trust', label: t('results.filterTrust') },
  ]

  return (
    <AppShell active="/eligibility-results">
      <TopHeader />
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <h1 className="u-h2">{t('results.title')}</h1>
        <p className="u-body u-muted mt-1">{t('results.subtitle', { count: filtered.length })}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="u-caption mr-1">{t('results.filterProvider')}:</span>
          {filterOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setFilter(o.id)}
              aria-pressed={filter === o.id}
              className={`rounded-[var(--radius-full)] border px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 ${
                filter === o.id
                  ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white'
                  : 'border-[var(--border-strong)] bg-white text-[var(--text-secondary)] hover:border-[var(--color-primary-400)]'
              }`}
            >
              {o.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2">
            <span className="u-caption">{t('results.sort')}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'match' | 'amount')}
              className="h-9 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-2.5 text-[13px] font-medium"
            >
              <option value="match">{t('results.sortMatch')}</option>
              <option value="amount">{t('results.sortAmount')}</option>
            </select>
          </label>
        </div>

        <motion.div
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          key={`${filter}-${sort}`}
        >
          {filtered.map((s) => (
            <motion.div
              key={s.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 0.9, 0.35, 1] } },
              }}
            >
              <SchemeCard scheme={s} />
            </motion.div>
          ))}
        </motion.div>
      </main>
    </AppShell>
  )
}
