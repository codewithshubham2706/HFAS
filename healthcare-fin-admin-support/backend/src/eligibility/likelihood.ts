/**
 * Approval-likelihood scorer (rule-based; ML upgrade path in ROADMAP).
 * Returns 0–100 with human-readable factors so the UI can advise
 * "strengthen your application" instead of a bare number.
 */
export type LikelihoodInput = {
  eligibilityScore: number          // 0–100 from the rule engine
  parsedDocCount: number
  requiredDocCount: number
  hasConsent: boolean
  incomeWithinSchemeLimit?: boolean // optional refined signal
}

export type LikelihoodResult = {
  likelihood: number
  factors: { label: string; positive: boolean }[]
}

export function scoreLikelihood(input: LikelihoodInput): LikelihoodResult {
  const factors: LikelihoodResult['factors'] = []
  let score = 0

  const docRatio = input.requiredDocCount > 0
    ? Math.min(1, input.parsedDocCount / input.requiredDocCount)
    : 0

  score += Math.round(input.eligibilityScore * 0.5)          // up to 50
  factors.push({
    label: input.eligibilityScore >= 100 ? 'Meets all scheme criteria' : `Matches ${input.eligibilityScore}% of scheme criteria`,
    positive: input.eligibilityScore >= 100,
  })

  score += Math.round(docRatio * 30)                          // up to 30
  factors.push({
    label: docRatio >= 1 ? 'All required documents verified' : `${input.parsedDocCount}/${input.requiredDocCount} required documents verified`,
    positive: docRatio >= 1,
  })

  if (input.hasConsent) { score += 10; factors.push({ label: 'Consent recorded', positive: true }) }
  else factors.push({ label: 'Consent pending', positive: false })

  if (input.incomeWithinSchemeLimit === true) { score += 10; factors.push({ label: 'Income within scheme limit', positive: true }) }
  else if (input.incomeWithinSchemeLimit === false) factors.push({ label: 'Income above scheme limit', positive: false })

  return { likelihood: Math.max(0, Math.min(100, score)), factors }
}
