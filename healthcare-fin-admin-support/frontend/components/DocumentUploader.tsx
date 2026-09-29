import { useCallback, useState } from 'react'
import { endpoints } from '../lib/api'
import { useI18n } from '../lib/i18n'

type OcrField = { label: string; value: string; confidence: number }
type Phase = 'idle' | 'uploading' | 'ocr' | 'parsed' | 'failed'

/**
 * DocumentUploader — full signed-URL flow:
 *   1. POST /documents/upload  → presigned PUT
 *   2. PUT file to object storage (browser → storage, never via API server)
 *   3. POST /documents/{id}/confirm with SHA-256 checksum
 *   4. POST /documents/{id}/process-ocr → fields
 * Camera capture via capture="environment" on mobile.
 */
export function DocumentUploader({ docType = 'hospital_invoice' }: { docType?: string }) {
  const { t } = useI18n()
  const [phase, setPhase] = useState<Phase>('idle')
  const [fields, setFields] = useState<OcrField[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setPhase('uploading')
    try {
      // 1. presigned URL
      const up = await endpoints.createUpload(docType, file.type, file.size)

      // 2. PUT directly to object storage
      const put = await fetch(up.uploadUrl, {
        method: up.method,
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!put.ok) throw new Error(`storage upload failed: ${put.status}`)

      // 3. checksum (SHA-256 via WebCrypto) + confirm
      const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
      const checksum = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
      await endpoints.confirmUpload(up.documentId, checksum)

      // 4. OCR
      setPhase('ocr')
      const ocr = await endpoints.processOcr(up.documentId)
      setFields(ocr.fields)
      setPhase(ocr.fields.length ? 'parsed' : 'failed')
    } catch (err) {
      setError(String(err))
      setPhase('failed')
    }
  }, [docType])

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        role="button"
        tabIndex={0}
        aria-label={t('application.uploader.hint')}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) void handleFile(f)
        }}
        onClick={() => document.getElementById('hfas-file')?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && document.getElementById('hfas-file')?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-primary-600)' : 'var(--color-gray-300)'}`,
          borderRadius: 16, padding: 32, textAlign: 'center', cursor: 'pointer',
          background: dragOver ? 'var(--color-primary-50)' : 'var(--color-gray-0)',
        }}
      >
        <p className="muted">{t('application.uploader.hint')}</p>
        <button type="button" className="btn btn-secondary" style={{ marginTop: 12 }} onClick={(e) => { e.stopPropagation(); document.getElementById('hfas-file')?.click() }}>
          {t('application.uploader.browse')}
        </button>
        <input
          id="hfas-file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          capture="environment"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
          }}
        />
      </div>

      {phase === 'uploading' && <p className="muted" aria-live="polite">{t('application.uploader.processing')}</p>}
      {phase === 'ocr' && <p className="muted" aria-live="polite">{t('application.uploader.processing')}</p>}
      {phase === 'parsed' && (
        <div aria-live="polite">
          <p style={{ fontWeight: 600, color: 'var(--color-success-600)' }}>{t('application.uploader.parsed')}</p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.map((f) => (
              <li key={f.label} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>{f.label}</div>
                  <div style={{ fontWeight: 600 }}>{f.value}</div>
                </div>
                <span className="chip chip-success">{t('docs.confidence', { pct: Math.round(f.confidence * 100) })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="error-text" role="alert">{error}</p>}
    </section>
  )
}
