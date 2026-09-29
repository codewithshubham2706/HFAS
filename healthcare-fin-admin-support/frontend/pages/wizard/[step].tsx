import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useI18n } from '../../lib/i18n'
import { endpoints, type Match } from '../../lib/api'

const QUESTIONS = [
  { key: 'condition', i18n: 'wizard.q1', options: ['wizard.q1.a1', 'wizard.q1.a2', 'wizard.q1.a3', 'wizard.q1.a4', 'wizard.q1.a5'] },
  { key: 'facility_type', i18n: 'wizard.q2', options: ['wizard.q2.a1', 'wizard.q2.a2', 'wizard.q2.a3'] },
  { key: 'income', i18n: 'wizard.q3', options: ['wizard.q3.a1', 'wizard.q3.a2', 'wizard.q3.a3', 'wizard.q3.a4'] },
] as const

const CONDITION_MAP: Record<string, string> = {
  'wizard.q1.a1': 'cancer', 'wizard.q1.a2': 'cardiac', 'wizard.q1.a3': 'maternity',
  'wizard.q1.a4': 'dialysis', 'wizard.q1.a5': 'other',
}
const FACILITY_MAP: Record<string, 'govt' | 'private' | 'trust'> = {
  'wizard.q2.a1': 'govt', 'wizard.q2.a2': 'private', 'wizard.q2.a3': 'trust',
}
const INCOME_MAP: Record<string, number> = {
  'wizard.q3.a1': 100000, 'wizard.q3.a2': 300000, 'wizard.q3.a3': 800000, 'wizard.q3.a4': 1200000,
}

export default function WizardStep() {
  const router = useRouter()
  const { t } = useI18n()
  const step = Math.max(1, Math.min(3, Number(router.query.step ?? 1)))
  const q = QUESTIONS[step - 1]

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [matches, setMatches] = useState<Match[] | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('hfas.onboarding')
    if (saved) setAnswers(JSON.parse(saved) as Record<string, string>)
  }, [])

  function choose(optionKey: string) {
    const next = { ...answers, [q.key]: optionKey }
    setAnswers(next)
    sessionStorage.setItem('hfas.onboarding', JSON.stringify(next))
  }

  async function next() {
    if (step < 3) {
      await router.push(`/wizard/${step + 1}`)
      return
    }
    // Final step → assess eligibility against backend rule engine.
    const facts = {
      profile: { annual_income_inr: INCOME_MAP[answers['income']] ?? 300000 },
      onboarding: {
        condition: CONDITION_MAP[answers['condition']] ?? 'other',
        facility_type: FACILITY_MAP[answers['facility_type']] ?? 'govt',
      },
    }
    const results = await endpoints.assess(facts.profile, facts.onboarding)
    sessionStorage.setItem('hfas.matches', JSON.stringify(results))
    await router.push('/application')
  }

  if (matches) return null // navigation in flight

  return (
    <>
      <Head><title>{t('wizard.title')} — {t('app.name')}</title></Head>
      <main className="container" style={{ maxWidth: 560, paddingTop: 40 }}>
        <p className="muted" style={{ fontSize: 13 }}>
          {t('wizard.step', { current: step, total: QUESTIONS.length })}
        </p>
        <div style={{ display: 'flex', gap: 8, margin: '12px 0 24px' }} role="progressbar"
             aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label={t('wizard.title')}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? 'var(--color-primary-600)' : 'var(--color-gray-200)' }} />
          ))}
        </div>

        <h2 style={{ fontSize: 24, marginBottom: 20 }}>{t(q.i18n)}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((optKey) => {
            const selected = answers[q.key] === optKey
            return (
              <button
                key={optKey}
                onClick={() => choose(optKey)}
                aria-pressed={selected}
                className="card"
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: 16,
                  borderColor: selected ? 'var(--color-primary-600)' : 'var(--border-subtle)',
                  background: selected ? 'var(--color-primary-50)' : '#fff',
                  color: 'var(--text-primary)',
                }}
              >
                {t(optKey)}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button className="btn btn-secondary" disabled={step === 1}
                  onClick={() => router.push(`/wizard/${step - 1}`)}>
            {t('wizard.back')}
          </button>
          <button className="btn btn-primary" disabled={!answers[q.key]} onClick={() => void next()}>
            {step === 3 ? t('wizard.seeResults') : t('wizard.next')}
          </button>
        </div>
      </main>
    </>
  )
}
