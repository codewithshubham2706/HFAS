import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { useAppState } from '../../state/AppStateContext'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button'
import { OcrFieldRow } from '../ui/OcrFieldRow'
import { initialDocs } from '../../data/mockData'

/** Doc-viewer overlay: full preview with OCR highlights over the "scan". */
export function DocViewerOverlay() {
  const { t } = useI18n()
  const { overlay, overlayCtx, closeOverlay } = useAppState()
  const open = overlay === 'docViewer'
  const doc = initialDocs.find((d) => d.id === (overlayCtx.docId ?? 'doc-aadhaar')) ?? initialDocs[0]

  // Mock highlight boxes positioned over the fake scan
  const highlights = [
    { top: '18%', left: '12%', width: '56%' },
    { top: '32%', left: '12%', width: '40%' },
    { top: '46%', left: '12%', width: '48%' },
  ]

  return (
    <Drawer open={open} onClose={closeOverlay} title={t('overlay.docViewerTitle')} width={640}>
      <div className="flex flex-col gap-4">
        <p className="u-caption">{t('overlay.docViewerHighlight', { count: doc.fields.length })}</p>

        <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--color-gray-50)] p-4">
          {/* Fake document scan */}
          <div className="rounded-[var(--radius-sm)] bg-white p-5 shadow-[var(--shadow-1)]">
            <div className="mb-4 h-2.5 w-28 rounded-full bg-[var(--color-gray-300)]" />
            <div className="mb-2 h-2 w-3/4 rounded-full bg-[var(--color-gray-200)]" />
            <div className="mb-2 h-2 w-2/3 rounded-full bg-[var(--color-gray-200)]" />
            <div className="mb-6 h-2 w-1/2 rounded-full bg-[var(--color-gray-200)]" />

            {highlights.map((h, i) => (
              <motion.div
                key={i}
                className="absolute rounded-[var(--radius-sm)] border-2 border-[var(--color-primary-400)] bg-[var(--color-primary-100)]/40"
                style={{ top: `calc(18% + ${i * 44}px)`, left: h.left, width: h.width, height: 22 }}
                initial={{ opacity: 0, scaleX: 0.9 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.26 }}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="u-h4 mb-2">{t('docs.ocrPanel')}</h3>
          <div className="flex flex-col gap-2">
            {doc.fields.map((f) => (
              <OcrFieldRow key={f.id} field={f} onAccept={() => {}} onEdit={() => {}} />
            ))}
          </div>
        </div>

        <Button variant="secondary" size="sm" className="self-start" onClick={closeOverlay}>
          {t('overlay.docViewerFull')}
        </Button>
      </div>
    </Drawer>
  )
}
