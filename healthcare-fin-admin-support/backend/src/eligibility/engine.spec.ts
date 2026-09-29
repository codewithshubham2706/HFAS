import { assessScheme, evaluate, resolve } from './engine'

const facts = {
  profile: { annual_income_inr: 240000, household_size: 4, has_insurer_policy: false },
  onboarding: { condition: 'cardiac', facility_type: 'private' },
}

describe('resolve()', () => {
  it('walks dot paths', () => {
    expect(resolve(facts, 'profile.annual_income_inr')).toBe(240000)
    expect(resolve(facts, 'onboarding.condition')).toBe('cardiac')
  })

  it('returns undefined for missing paths', () => {
    expect(resolve(facts, 'profile.nope')).toBeUndefined()
    expect(resolve(facts, 'a.b.c')).toBeUndefined()
  })
})

describe('evaluate()', () => {
  it('eq / lte / in comparisons', () => {
    expect(evaluate({ field: 'profile.annual_income_inr', op: 'lte', value: 300000 }, facts).met).toBe(true)
    expect(evaluate({ field: 'onboarding.condition', op: 'in', value: ['cardiac', 'cancer'] }, facts).met).toBe(true)
    expect(evaluate({ field: 'onboarding.facility_type', op: 'eq', value: 'govt' }, facts).met).toBe(false)
  })

  it('any / all / not combinators', () => {
    const anyRule = { any: [
      { field: 'onboarding.condition', op: 'eq' as const, value: 'cancer' },
      { field: 'onboarding.condition', op: 'eq' as const, value: 'cardiac' },
    ]}
    expect(evaluate(anyRule, facts).met).toBe(true)

    const notRule = { not: { field: 'profile.has_insurer_policy', op: 'eq' as const, value: true } }
    expect(evaluate(notRule, facts).met).toBe(true)
  })

  it('exists treats null and undefined as absent', () => {
    expect(evaluate({ field: 'profile.nope', op: 'exists' }, facts).met).toBe(false)
    expect(evaluate({ field: 'profile.household_size', op: 'exists' }, facts).met).toBe(true)
  })
})

describe('assessScheme()', () => {
  const rules = [
    { all: [
      { field: 'profile.annual_income_inr', op: 'lte' as const, value: 300000 },
      { field: 'onboarding.condition', op: 'in' as const, value: ['cardiac', 'cancer'] },
    ]},
  ]

  it('fully matched rules → eligible, score 100', () => {
    const a = assessScheme(rules, facts)
    expect(a.eligible).toBe(true)
    expect(a.score).toBe(100)
    expect(a.reasons).toHaveLength(1)
    expect(a.reasons[0].met).toBe(true)
  })

  it('partial match → not eligible, proportional score with reasons', () => {
    const a = assessScheme(rules, {
      profile: { annual_income_inr: 900000 },
      onboarding: { condition: 'cardiac' },
    })
    expect(a.eligible).toBe(false)
    expect(a.score).toBe(0)
  })

  it('empty rules never eligible', () => {
    const a = assessScheme([], facts)
    expect(a.eligible).toBe(false)
    expect(a.score).toBe(0)
  })
})
