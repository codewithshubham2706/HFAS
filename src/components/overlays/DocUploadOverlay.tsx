import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { useAppState } from '../../state/AppStateContext'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button'
import { OcrFieldRow } from '../ui/OcrFieldRow'
import { initialDocs } from '../../data/mockData'

type Phase = 'idle' | 'uploading' | 'parsing' | 'done' | 'failed'

/** Doc-upload overlay: camera + drag-drop + shimmer progress + OCR parsing. */
export function DocUploadOverlay() {
  const { t } = useI18n()
  const { overlay, overlayCtx, closeOverlay, showToast, openOverlay } = useAppState()
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragOver, setDragOver] = useState(false)
  const open = overlay === 'docUpload'
  const doc = initialDocs.find((d) => d.id === (overlayCtx.docId ?? 'doc-aadhaar')) ?? initialDocs[0]

  const startUpload = useCallback(() => {
    setPhase('uploading')
    window.setTimeout(() => {
      setPhase('parsing')
      window.setTimeout(() => {
        setPhase('done')
        showToast(t('toast.ocrDone'))
      }, 1800)
    }, 1600)
  }, [showToast, t])

  function handleClose() {
    closeOverlay()
    window.setTimeout(() => {
      setPhase('idle')
      setDragOver(false)
    }, 350)
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={t('overlay.docUploadTitle')}
      subtitle={t('overlay.docUploadSub')}
      width={520}
    >
      <div className="flex flex-col gap-4">
        {/* Dropzone: Uploader/dropzone — default & dragover variants */}
        <div
          role="button"
          tabIndex={0}
          data-testid="dropzone"
          className={`flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 ${
            dragOver
              ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-50)]'
              : 'border-[var(--border-strong)] bg-[var(--color-gray-50)]'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            startUpload()
          }}
          onClick={startUpload}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') startUpload()
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-[var(--color-primary-600)]" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M12 4v12" />
          </svg>
          <p className="u-body u-muted max-w-xs">{t('docs.dropzone')}</p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={(e) => { e.stopPropagation(); startUpload() }}>
              {t('docs.browse')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                openOverlay('docViewer', { docId: doc.id })
              }}
            >
              {t('overlay.docViewerTitle')}
            </Button>
          </div>
        </div>

        {/* Upload / OCR progress states */}
        <AnimatePresence mode="wait">
          {phase === 'uploading' && (
            <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <div className="u-shimmer h-3 w-3/4 rounded-[var(--radius-full)]" />
              <div className="u-shimmer h-3 w-1/2 rounded-[var(--radius-full)]" />
            </motion.div>
          )}

          {phase === 'parsing' && (
            <motion.div key="parse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <p className="u-caption flex items-center gap-2">
                <span className="u-spinner u-spinner--dark" aria-hidden="true" />
                {t('docs.ocrParsing')}
              </p>
              <div className="u-skeleton h-10 w-full" />
              <div className="u-skeleton h-10 w-5/6" />
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <p className="u-h4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="var(--color-success-500)" aria-hidden="true">
                  <path d="M6.5 10.6 3.9 8l-1.1 1.1 3.7 3.7 7.3-7.3L12.7 4.4 6.5 10.6Z" />
                </svg>
                {t('toast.uploadComplete')}
              </p>
              {doc.fields.map((f) => (
                <OcrFieldRow key={f.id} field={f} onAccept={() => {}} onEdit={() => {}} />
              ))}
              {doc.fields.length === 0 && <p className="u-caption">{t('docs.ocrFailed')}</p>}
            </motion.div>
          )}

          {phase === 'failed' && (
            <motion.div
              key="fail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-error-100)] bg-[var(--color-error-50)] p-4"
            >
              <p className="u-body text-[var(--color-error-700)]">{t('docs.ocrFailed')}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setPhase('parsing')}>
                  {t('docs.reprocess')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setPhase('done')}>
                  {t('docs.manualEntry')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Drawer>
  )
}
