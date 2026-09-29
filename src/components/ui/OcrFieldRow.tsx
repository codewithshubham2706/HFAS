import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import type { OcrField } from '../../data/mockData'

type OcrFieldRowProps = {
  field: OcrField
  onAccept: (id: string) => void
  onEdit: (id: string, value: string) => void
}

type Tier = 'high' | 'medium' | 'low'

/** Confidence tier: ≥90 green, 70–89 orange (verify), <70 red (verify required). */
function tierOf(confidence: number): Tier {
  if (confidence >= 90) return 'high'
  if (confidence >= 70) return 'medium'
  return 'low'
}

const TIER_STYLES: Record<Tier, { chip: string; dot: string }> = {
  high: {
    chip: 'bg-[var(--color-success-50)] text-[var(--color-success-600)]',
    dot: 'bg-[var(--color-success-500)]',
  },
  medium: {
    chip: 'bg-[var(--color-warning-50)] text-[var(--color-warning-600)]',
    dot: 'bg-[var(--color-warning-500)]',
  },
  low: {
    chip: 'bg-[var(--color-error-50)] text-[var(--color-error-600)]',
    dot: 'bg-[var(--color-error-500)]',
  },
}

/**
 * Extracted-field chip with per-field confidence scoring:
 *  - green: auto-acceptable
 *  - orange: "Verify" suggested (soft nudge)
 *  - red: must Verify (edit or explicit confirm) before Accept unlocks
 * Check-burst plays on accept. KPI: fewer manual corrections downstream.
 */
export function OcrFieldRow({ field, onAccept, onEdit }: OcrFieldRowProps) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [burst, setBurst] = useState(false)
  const [verified, setVerified] = useState(false)

  const tier = tierOf(field.confidence)
  const style = TIER_STYLES[tier]
  const verifyRequired = tier === 'low' && !field.accepted && !verified
  const acceptBlocked = verifyRequired

  function handleAccept() {
    if (field.accepted || acceptBlocked) return
    setBurst(true)
    window.setTimeout(() => setBurst(false), 700)
    onAccept(field.id)
  }

  function handleVerify() {
    // Low-confidence flow: user either edits or explicitly confirms the value.
    setVerified(true)
  }

  return (
    <motion.div
      className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 ${
        field.accepted
          ? 'border-[var(--color-success-100)] bg-[var(--color-success-50)]'
          : tier === 'low'
            ? 'border-[var(--color-error-100)] bg-white'
            : 'border-[var(--border-subtle)] bg-white'
      }`}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 0.9, 0.35, 1] }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="u-caption font-semibold">{t(field.labelKey)}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2 py-0.5 text-[11px] font-bold ${style.chip}`}
            title={t('docs.confidenceTitle', { tier })}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
            {field.confidence}%
          </span>
          {!field.accepted && tier !== 'high' && (
            <span className="u-caption font-medium text-[var(--color-warning-600)]">
              {t('docs.confidenceTitle', { tier })}
            </span>
          )}
        </div>
        {editing ? (
          <input
            autoFocus
            className="mt-1 h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-primary-600)] px-2 text-[14px] focus:outline-none"
            defaultValue={field.value}
            onBlur={(e) => {
              onEdit(field.id, e.target.value)
              setEditing(false)
              setVerified(true) // editing counts as human verification
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEdit(field.id, e.currentTarget.value)
                setEditing(false)
                setVerified(true)
              }
            }}
          />
        ) : (
          <p className="truncate text-[14px] font-medium text-[var(--text-primary)]">{field.value}</p>
        )}
      </div>
      <div className="relative flex shrink-0 items-center gap-1.5">
        {/* check-burst on accept */}
        <AnimatePresence>
          {burst && (
            <motion.svg
              width="44" height="44" viewBox="0 0 44 44"
              className="pointer-events-none absolute -right-2 -top-2"
              initial={{ opacity: 1, scale: 0.4 }}
              animate={{ opacity: 0, scale: 1.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              aria-hidden="true"
            >
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg} x1="22" y1="10" x2="22" y2="16"
                  stroke="var(--color-success-500)" strokeWidth="2.4" strokeLinecap="round"
                  transform={`rotate(${deg} 22 22)`}
                />
              ))}
            </motion.svg>
          )}
        </AnimatePresence>

        {field.accepted ? (
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-success-600)]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.5 10.6 3.9 8l-1.1 1.1 3.7 3.7 7.3-7.3L12.7 4.4 6.5 10.6Z" />
            </svg>
            {t('common.accept')}
          </span>
        ) : verifyRequired ? (
          <button
            type="button"
            className="rounded-[var(--radius-sm)] bg-[var(--color-error-600)] px-2.5 py-1 text-[13px] font-semibold text-white hover:bg-[var(--color-error-700)]"
            onClick={() => setEditing(true)}
          >
            {t('docs.verifyField')}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="rounded-[var(--radius-sm)] px-2 py-1 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--color-gray-100)]"
              onClick={() => setEditing(true)}
            >
              {t('common.edit')}
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-sm)] bg-[var(--color-primary-600)] px-2.5 py-1 text-[13px] font-semibold text-white hover:bg-[var(--color-primary-700)] disabled:opacity-50"
              onClick={handleAccept}
            >
              {t('common.accept')}
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
