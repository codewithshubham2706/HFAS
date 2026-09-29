import { scoreLikelihood } from './likelihood'

describe('scoreLikelihood', () => {
  it('perfect application scores 100 with all-positive factors', () => {
    const r = scoreLikelihood({
      eligibilityScore: 100, parsedDocCount: 4, requiredDocCount: 4,
      hasConsent: true, incomeWithinSchemeLimit: true,
    })
    expect(r.likelihood).toBe(100)
    expect(r.factors.every((f) => f.positive)).toBe(true)
  })

  it('partial docs reduce score proportionally', () => {
    const r = scoreLikelihood({
      eligibilityScore: 100, parsedDocCount: 2, requiredDocCount: 4,
      hasConsent: true, incomeWithinSchemeLimit: true,
    })
    // 50 + 15 + 10 + 10 = 85
    expect(r.likelihood).toBe(85)
    expect(r.factors.find((f) => f.label.includes('2/4'))!.positive).toBe(false)
  })

  it('missing consent and income signal', () => {
    const r = scoreLikelihood({
      eligibilityScore: 50, parsedDocCount: 0, requiredDocCount: 4, hasConsent: false,
    })
    expect(r.likelihood).toBe(25) // 25 + 0 only
  })

  it('clamps to 0–100', () => {
    const r = scoreLikelihood({
      eligibilityScore: 100, parsedDocCount: 10, requiredDocCount: 2,
      hasConsent: true, incomeWithinSchemeLimit: true,
    })
    expect(r.likelihood).toBeLessThanOrEqual(100)
  })
})
