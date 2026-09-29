import { motion, useReducedMotion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import type { TimelineEvent } from '../../data/mockData'
import { Button } from './Button'

type TimelineItemProps = {
  event: TimelineEvent
  onAppeal?: () => void
}

/** Timeline/item — vertical rail with dot, title, time, optional body and appeal action. */
export function TimelineItem({ event, onAppeal }: TimelineItemProps) {
  const { t } = useI18n()
  const reducedMotion = useReducedMotion()

  return (
    <motion.li
      className="relative pb-6 pl-8"
      initial={reducedMotion ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26, ease: [0.34, 1.3, 0.64, 1] }}
    >
      {/* rail */}
      <span className="absolute left-[9px] top-6 bottom-0 w-px bg-[var(--border-subtle)]" aria-hidden="true" />
      {/* dot */}
      <span
        className={`absolute left-0 top-1 h-[19px] w-[19px] rounded-full border-2 ${
          event.isNew
            ? 'border-[var(--color-primary-300)] bg-[var(--color-primary-600)]'
            : 'border-[var(--color-gray-300)] bg-white'
        }`}
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="u-h4">{t(event.titleKey)}</h3>
        {event.isNew && (
          <span className="rounded-[var(--radius-full)] bg-[var(--color-primary-50)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary-700)]">
            {t('timeline.newBadge')}
          </span>
        )}
      </div>
      <p className="u-caption mt-0.5">{t(event.timeKey)}</p>
      {event.bodyKey && <p className="u-body u-muted mt-1.5">{t(event.bodyKey)}</p>}
      {event.actionable && onAppeal && (
        <div className="mt-3">
          <Button size="sm" variant="secondary" onClick={onAppeal}>
            {t('common.appeal')}
          </Button>
        </div>
      )}
    </motion.li>
  )
}
