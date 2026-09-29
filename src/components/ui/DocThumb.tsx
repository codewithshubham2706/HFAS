import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import type { DocItem } from '../../data/mockData'

type DocThumbProps = {
  doc: DocItem
  selected?: boolean
  onOpen?: (docId: string) => void
}

/** Doc/thumbnail — default, processing (skeleton pulse) and flagged variants. */
export function DocThumb({ doc, selected = false, onOpen }: DocThumbProps) {
  const { t } = useI18n()

  return (
    <motion.button
      type="button"
      className={`flex w-full flex-col items-start rounded-[var(--radius-md)] border p-3 text-left shadow-[var(--shadow-1)] transition-shadow duration-150 hover:shadow-[var(--shadow-2)] ${
        selected ? 'border-[var(--color-primary-600)] ring-2 ring-[var(--color-primary-100)]' : 'border-[var(--border-subtle)]'
      }`}
      onClick={() => onOpen?.(doc.id)}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`mb-2 flex h-20 w-full items-center justify-center rounded-[var(--radius-sm)] ${
          doc.status === 'processing' ? 'u-skeleton' : 'bg-[var(--color-gray-100)]'
        }`}
      >
        {doc.status === 'processing' ? null : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--color-gray-400)]" aria-hidden="true">
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
            <path d="M14 3v6h6" />
          </svg>
        )}
      </div>
      <span className="text-[13px] font-semibold text-[var(--text-primary)]">{t(doc.nameKey)}</span>
      <span
        className={`mt-1 inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2 py-0.5 text-[11px] font-semibold ${
          doc.status === 'uploaded'
            ? 'bg-[var(--color-success-50)] text-[var(--color-success-600)]'
            : doc.status === 'processing'
              ? 'bg-[var(--color-info-50)] text-[var(--color-info-600)]'
              : 'bg-[var(--color-warning-50)] text-[var(--color-warning-600)]'
        }`}
      >
        {doc.status === 'uploaded'
          ? t('docs.statusUploaded')
          : doc.status === 'processing'
            ? t('docs.statusProcessing')
            : t('docs.statusFlagged')}
      </span>
    </motion.button>
  )
}
