import { scoreTriage } from './triage.service'

describe('scoreTriage', () => {
  it('treatment-critical condition dominates (40) and sets urgency', () => {
    const r = scoreTriage({ condition: 'cancer' })
    expect(r.priorityScore).toBe(40)
    expect(r.urgency).toBe('treatment_critical')
  })

  it('financial hardship adds 25 and sets urgency when not critical', () => {
    const r = scoreTriage({ annualIncomeInr: 80000 })
    expect(r.priorityScore).toBe(25)
    expect(r.urgency).toBe('financial_hardship')
  })

  it('combines signals up to the cap', () => {
    const r = scoreTriage({
      condition: 'dialysis',
      annualIncomeInr: 90000,
      schemeMaxAmountInr: 200000,
      submittedAt: new Date(Date.now() - 5 * 86_400_000),
      parsedDocCount: 3,
    })
    expect(r.priorityScore).toBe(100) // 40+25+15+10+10
    expect(r.urgency).toBe('treatment_critical')
  })

  it('SLA pressure alone → deadline urgency', () => {
    const r = scoreTriage({ submittedAt: new Date(Date.now() - 4 * 86_400_000) })
    expect(r.urgency).toBe('deadline')
    expect(r.priorityScore).toBe(10)
  })

  it('benign case stays normal at 0', () => {
    const r = scoreTriage({ condition: 'maternity', annualIncomeInr: 500000 })
    expect(r.urgency).toBe('normal')
    expect(r.priorityScore).toBe(0)
  })

  it('caps at 100 and never negative', () => {
    expect(scoreTriage({ condition: 'cancer', annualIncomeInr: 1 }).priorityScore).toBeLessThanOrEqual(100)
    expect(scoreTriage({}).priorityScore).toBe(0)
  })
})
