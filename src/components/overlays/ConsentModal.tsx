import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { useAppState } from '../../state/AppStateContext'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

/** Consent modal — legal text, sharing checkboxes, e-sign, loading spinner then success. */
export function ConsentModal() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { overlay, closeOverlay, showToast } = useAppState()
  const [shareInsurer, setShareInsurer] = useState(true)
  const [shareHospital, setShareHospital] = useState(true)
  const [shareGovt, setShareGovt] = useState(true)
  const [esign, setEsign] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const open = overlay === 'consentModal'

  function handleSubmit() {
    setSubmitting(true)
    window.setTimeout(() => {
      setSubmitting(false)
      closeOverlay()
      navigate('/submission-confirmation')
      showToast(t('toast.consentSubmitted'))
    }, 1400)
  }

  const canSubmit = shareInsurer || shareHospital || shareGovt

  return (
    <Modal open={open} onClose={closeOverlay} title={t('consent.title')} size="md">
      <div className="flex flex-col gap-4">
        <p className="u-body u-muted">
          {t('consent.body')}{' '}
          <span className="rounded-[var(--radius-full)] bg-[var(--color-warning-50)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-warning-600)]">
            **REQUIRES LEGAL REVIEW**
          </span>
        </p>

        <div className="flex flex-col gap-2.5">
          <label className="flex items-start gap-2.5 text-[14px]">
            <input type="checkbox" checked={shareInsurer} onChange={(e) => setShareInsurer(e.target.checked)} className="mt-0.5 accent-[var(--color-primary-600)]" />
            <span>{t('consent.shareInsurer')}</span>
          </label>
          <label className="flex items-start gap-2.5 text-[14px]">
            <input type="checkbox" checked={shareHospital} onChange={(e) => setShareHospital(e.target.checked)} className="mt-0.5 accent-[var(--color-primary-600)]" />
            <span>{t('consent.shareHospital')}</span>
          </label>
          <label className="flex items-start gap-2.5 text-[14px]">
            <input type="checkbox" checked={shareGovt} onChange={(e) => setShareGovt(e.target.checked)} className="mt-0.5 accent-[var(--color-primary-600)]" />
            <span>{t('consent.shareGovt')}</span>
          </label>
        </div>

        <Input
          label={t('consent.esign')}
          placeholder={t('consent.esignPlaceholder')}
          hint={t('consent.esignNote')}
          value={esign}
          onChange={(e) => setEsign(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={closeOverlay}>
            {t('consent.reviewCancel')}
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>
            {submitting ? t('consent.submitting') : t('consent.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
