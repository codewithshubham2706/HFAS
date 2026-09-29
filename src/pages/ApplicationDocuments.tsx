import { useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { AppShell, TopHeader } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { DocThumb } from '../components/ui/DocThumb'
import { OcrFieldRow } from '../components/ui/OcrFieldRow'
import { initialDocs, type DocItem } from '../data/mockData'

/** Page 8 — application-documents: thumbnails grid, dropzone, OCR preview panel. */
export function ApplicationDocuments() {
  const { t } = useI18n()
  const { openOverlay, showToast } = useAppState()
  const [docs, setDocs] = useState<DocItem[]>(initialDocs)
  const [selectedId, setSelectedId] = useState<string>(initialDocs[0].id)
  const [dragOver, setDragOver] = useState(false)

  const selected = docs.find((d) => d.id === selectedId) ?? docs[0]

  function updateField(docId: string, fieldId: string, patch: { accepted?: boolean; value?: string }) {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, fields: d.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) }
          : d,
      ),
    )
  }

  function simulateUpload() {
    openOverlay('docUpload')
    showToast(t('docs.uploadHintShort'))
  }

  return (
    <AppShell active="/application-documents">
      <TopHeader />
      <main className="mx-auto w-full max-w-[1000px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <h1 className="u-h2">{t('docs.title')}</h1>
        <p className="u-body u-muted mt-1">{t('docs.subtitle')}</p>

        {/* Dropzone */}
        <div
          role="button"
          tabIndex={0}
          onClick={simulateUpload}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && simulateUpload()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); simulateUpload() }}
          className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed px-6 py-8 text-center transition-colors duration-150 ${
            dragOver
              ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-50)]'
              : 'border-[var(--border-strong)] bg-white hover:border-[var(--color-primary-300)]'
          }`}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-[var(--color-primary-600)]" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M12 4v12" />
          </svg>
          <p className="u-body u-muted max-w-md">
            {t('docs.dropzone')}
            <span className="ml-1 inline-flex">
              <button
                type="button"
                aria-label={t('help.dropzone')}
                onClick={(e) => { e.stopPropagation(); window.alert(t('help.dropzone')) }}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] font-bold text-[var(--text-muted)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-600)]"
              >?</button>
            </span>
          </p>
        </div>

        {/* Thumbnails */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {docs.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <DocThumb
                doc={doc}
                selected={doc.id === selectedId}
                onOpen={(id) => {
                  setSelectedId(id)
                  openOverlay('docViewer', { docId: id })
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* OCR panel */}
        <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="u-h4">{t('docs.ocrPanelTitle')}</h2>
            <Button size="sm" variant="ghost" onClick={() => openOverlay('docViewer', { docId: selected.id })}>
              {t('docs.viewInDoc')}
            </Button>
          </div>
          <p className="u-caption mt-0.5 mb-3">{t('docs.ocrHint')}</p>

          {selected.fields.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {selected.fields.map((f) => (
                <OcrFieldRow
                  key={f.id}
                  field={f}
                  onAccept={(id) => updateField(selected.id, id, { accepted: true })}
                  onEdit={(id, value) => updateField(selected.id, id, { value })}
                />
              ))}
            </div>
          ) : selected.status === 'processing' ? (
            <div className="flex flex-col gap-2">
              <p className="u-caption flex items-center gap-2">
                <span className="u-spinner u-spinner--dark" aria-hidden="true" />
                {t('docs.ocrParsing')}
              </p>
              <div className="u-skeleton h-10 w-full" />
              <div className="u-skeleton h-10 w-2/3" />
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-warning-50)] p-4">
              <p className="u-body text-[var(--color-warning-600)]">{t('docs.ocrFailed')}</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={simulateUpload}>
                {t('docs.manualEntry')}
              </Button>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}
