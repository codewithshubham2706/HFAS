import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import type { Scheme } from '../../data/mockData'
import { Button } from './Button'

type SchemeCardProps = {
  scheme: Scheme
}

/** Card/scheme/compact — used in eligibility results grid and dashboard. */
export function SchemeCard({ scheme }: SchemeCardProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  return (
    <motion.article
      className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)]"
      whileHover={reducedMotion ? undefined : { y: -6, boxShadow: 'var(--shadow-2)' }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-[var(--radius-full)] bg-[var(--color-primary-50)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-primary-700)]">
          {t('results.matchScore', { score: scheme.match })}
        </span>
        <span className="u-caption">
          {scheme.providerType === 'govt'
            ? t('results.filterGovt')
            : scheme.providerType === 'insurer'
              ? t('results.filterInsurer')
              : t('results.filterTrust')}
        </span>
      </div>
      <h3 className="u-h4 mb-1">{t(scheme.nameKey)}</h3>
      <p className="u-caption mb-4">{t(scheme.providerKey)}</p>
      <p className="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">
        {t('results.coverage', { amount: scheme.amount })}
      </p>
      <p className="u-caption mb-5">{t('results.docsHint')}</p>
      <div className="mt-auto">
        <Button size="sm" onClick={() => navigate('/application-overview')}>
          {t('results.applyNow')}
        </Button>
      </div>
    </motion.article>
  )
}
