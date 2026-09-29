import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { useAppState, type DocStage } from '../../state/AppStateContext'
import { Drawer } from './Drawer'
import { Stepper } from '../ui/Stepper'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { DocThumb } from '../ui/DocThumb'
import { initialDocs } from '../../data/mockData'

const STAGES: DocStage[] = ['docs', 'details', 'consent']

/** App-stepper drawer — the multi-step application flow (documents → details → consent). */
export function AppStepperDrawer() {
  const { t } = useI18n()
  const { overlay, closeOverlay, activeDocStage, setActiveDocStage, showToast } = useAppState()
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState({ name: 'Sunita Devi', dob: '14/03/1986', insurer: 'AcmeCare' })
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const stageIndex = STAGES.indexOf(activeDocStage)

  function go(next: DocStage) {
    setDirection(STAGES.indexOf(next) > stageIndex ? 1 : -1)
    setActiveDocStage(next)
  }

  function validateDetails() {
    const errs: Record<string, string | null> = {}
    if (!form.name.trim()) errs.name = t('toast.errorRequired')
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.dob)) errs.dob = t('details.errorDob')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function next() {
    if (activeDocStage === 'docs') {
      go('details')
    } else if (activeDocStage === 'details') {
      if (validateDetails()) go('consent')
    }
  }

  return (
    <Drawer
      open={overlay === 'appStepper'}
      onClose={closeOverlay}
      title={t('overlay.stepperTitle')}
      subtitle={t('overlay.stepperSub')}
      width={560}
    >
      <div className="flex flex-col gap-6">
        <Stepper
          steps={[t('overview.stepDocs'), t('overview.stepDetails'), t('overview.stepConsent')]}
          current={stageIndex}
        />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeDocStage}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.32, ease: [0.22, 0.9, 0.35, 1] }}
          >
            {activeDocStage === 'docs' && (
              <div className="u-grid-2">
                {initialDocs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.26 }}
                  >
                    <DocThumb doc={doc} />
                  </motion.div>
                ))}
              </div>
            )}

            {activeDocStage === 'details' && (
              <div className="flex flex-col gap-4">
                <Input
                  label={t('details.name')}
                  value={form.name}
                  error={errors.name ?? undefined}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                <Input
                  label={t('details.dob')}
                  value={form.dob}
                  placeholder="DD/MM/YYYY"
                  error={errors.dob ?? undefined}
                  onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                />
                <Input
                  label={t('details.insurer')}
                  value={form.insurer}
                  onChange={(e) => setForm((f) => ({ ...f, insurer: e.target.value }))}
                />
              </div>
            )}

            {activeDocStage === 'consent' && (
              <div className="flex flex-col gap-3">
                <p className="u-body u-muted">{t('consent.body')}</p>
                <label className="flex items-start gap-2.5 text-[14px]">
                  <input type="checkbox" defaultChecked className="mt-0.5 accent-[var(--color-primary-600)]" />
                  <span>{t('consent.shareInsurer')}</span>
                </label>
                <label className="flex items-start gap-2.5 text-[14px]">
                  <input type="checkbox" defaultChecked className="mt-0.5 accent-[var(--color-primary-600)]" />
                  <span>{t('consent.shareGovt')}</span>
                </label>
                <Button
                  className="mt-2"
                  onClick={() => {
                    closeOverlay()
                    showToast(t('toast.consentSubmitted'))
                  }}
                >
                  {t('consent.submit')}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {activeDocStage !== 'consent' && (
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => { showToast(t('toast.draftSaved')); closeOverlay() }}>
              {t('common.saveDraft')}
            </Button>
            <div className="flex gap-2">
              {stageIndex > 0 && (
                <Button variant="secondary" size="md" onClick={() => go(STAGES[stageIndex - 1])}>
                  {t('common.back')}
                </Button>
              )}
              <Button size="md" onClick={next}>
                {stageIndex === 0 ? t('common.continue') : t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
