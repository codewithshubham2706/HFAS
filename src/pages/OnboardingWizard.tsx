import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { Button } from '../components/ui/Button'
import { Stepper } from '../components/ui/Stepper'

type Answers = { condition: string | null; facility: string | null; income: string | null }

/** Page 3 — onboarding-wizard-desktop: 3-question intake wizard seeding eligibility. */
export function OnboardingWizard() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { showToast } = useAppState()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<Answers>({ condition: null, facility: null, income: null })

  const questions = [
    {
      key: 'condition' as const,
      title: t('onboarding.q1Title'),
      options: [t('onboarding.q1a1'), t('onboarding.q1a2'), t('onboarding.q1a3'), t('onboarding.q1a4'), t('onboarding.q1a5')],
    },
    {
      key: 'facility' as const,
      title: t('onboarding.q2Title'),
      options: [t('onboarding.q2a1'), t('onboarding.q2a2'), t('onboarding.q2a3')],
    },
    {
      key: 'income' as const,
      title: t('onboarding.q3Title'),
      options: [t('onboarding.q3a1'), t('onboarding.q3a2'), t('onboarding.q3a3'), t('onboarding.q3a4')],
    },
  ]

  const current = questions[step]
  const last = step === questions.length - 1

  function choose(option: string) {
    setAnswers((a) => ({ ...a, [current.key]: option }))
  }

  function next() {
    if (last) {
      navigate('/eligibility-results')
      return
    }
    setDirection(1)
    setStep((s) => s + 1)
  }

  function back() {
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="mx-auto flex w-full max-w-[760px] items-center justify-between px-4 py-4 md:px-5">
        <button type="button" className="flex items-center gap-2" onClick={() => navigate('/')}>
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-600)] text-[13px] font-extrabold text-white">HF</span>
          <span className="text-[16px] font-bold tracking-tight">HFAS</span>
        </button>
        <span className="u-caption">{t('onboarding.stepOf', { current: step + 1 })}</span>
      </header>

      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-6 px-4 pb-8 md:px-5">
        <Stepper steps={[t('onboarding.q1Short'), t('onboarding.q2Short'), t('onboarding.q3Short')]} current={step} />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -48 }}
            transition={{ duration: 0.32, ease: [0.22, 0.9, 0.35, 1] }}
          >
            <motion.fieldset
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              <legend className="sr-only">{current.title}</legend>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } }}
                className="u-h2 mb-6"
              >
                {current.title}
              </motion.h1>
              <div className="flex flex-col gap-2.5">
                {current.options.map((option, i) => (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => choose(option)}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.26 } },
                    }}
                    className={`flex items-center justify-between rounded-[var(--radius-md)] border px-4 py-3.5 text-left text-[15px] font-medium transition-colors duration-150 ${
                      answers[current.key] === option
                        ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                        : 'border-[var(--border-strong)] bg-white hover:border-[var(--color-primary-400)] hover:bg-[var(--color-gray-50)]'
                    }`}
                    aria-pressed={answers[current.key] === option}
                  >
                    {option}
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        answers[current.key] === option
                          ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-600)]'
                          : 'border-[var(--border-strong)]'
                      }`}
                    >
                      {answers[current.key] === option && (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="white" aria-hidden="true">
                          <path d="M6.5 10.6 3.9 8l-1.1 1.1 3.7 3.7 7.3-7.3L12.7 4.4 6.5 10.6Z" />
                        </svg>
                      )}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.fieldset>
          </motion.div>
        </AnimatePresence>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              showToast(t('toast.draftSaved'))
              navigate('/dashboard')
            }}
          >
            {t('common.saveDraft')}
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={back}>{t('common.back')}</Button>
            )}
            <Button onClick={next} disabled={!answers[current.key]}>{last ? t('onboarding.seeResults') : t('common.next')}</Button>
          </div>
        </div>
        <p className="u-caption">{t('onboarding.draftHint')}</p>
      </main>
    </div>
  )
}
