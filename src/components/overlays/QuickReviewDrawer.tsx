import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import { useAppState } from '../../state/AppStateContext'
import { Drawer } from './Drawer'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'

/** Quick-review drawer — caseworker actions: assign, request docs, note, approve. */
export function QuickReviewDrawer() {
  const { t } = useI18n()
  const { overlay, closeOverlay, showToast } = useAppState()
  const [note, setNote] = useState('')
  const open = overlay === 'quickReview'

  return (
    <Drawer open={open} onClose={closeOverlay} title={t('overlay.reviewTitle')} width={440}>
      <div className="flex flex-col gap-5">
        {/* Applicant summary row */}
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
          <Avatar name="Sunita Devi" size={40} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">Sunita Devi</p>
            <p className="u-caption">INV-20260712-019 · Hospital Care Subsidy</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              showToast(t('toast.assigned'))
              closeOverlay()
            }}
          >
            {t('overlay.reviewAssign')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              showToast(t('toast.docsRequested'))
              closeOverlay()
            }}
          >
            {t('overlay.reviewRequestDocs')}
          </Button>
          <p className="u-caption">{t('overlay.reviewRequestDocsBody')}</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--text-secondary)]">{t('overlay.reviewNote')}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('overlay.reviewNotePlaceholder')}
            rows={3}
            className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border-strong)] px-3 py-2 text-[14px] focus:border-[var(--color-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]"
          />
        </label>

        <Button
          onClick={() => {
            showToast(t('toast.assigned'))
            closeOverlay()
          }}
        >
          {t('overlay.reviewApprove')}
        </Button>
      </div>
    </Drawer>
  )
}
