/**
 * eligibility/engine.ts — JSON rule DSL interpreter.
 *
 * A scheme's `eligibility_rules` column holds an array of rule trees:
 *   type Rule  = All | Any | Not | Compare
 *   All        = { all: Rule[] }
 *   Any        = { any: Rule[] }
 *   Not        = { not: Rule }
 *   Compare    = { field: string, op: Op, value?: unknown }
 *   Op         = 'eq'|'neq'|'gt'|'gte'|'lt'|'lte'|'in'|'nin'|'exists'
 *
 * Field paths resolve against the assessment facts object:
 *   profile.annual_income_inr, profile.household_size,
 *   onboarding.condition, onboarding.facility_type,
 *   profile.has_insurer_policy, …
 *
 * Scoring: each top-level rule contributes equally; score = matched/total.
 * Each rule also returns a human-readable "why" for UI display.
 */

export type Op = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'exists'

export type Compare = { field: string; op: Op; value?: unknown }
export type All = { all: Rule[] }
export type Any = { any: Rule[] }
export type Not = { not: Rule }
export type Rule = All | Any | Not | Compare

export type RuleResult = { met: boolean; field?: string; describe: string }
export type Assessment = {
  eligible: boolean
  score: number            // 0..100, share of top-level rules met
  reasons: RuleResult[]    // per top-level rule
}

export function resolve(facts: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, facts)
}

function compare(rule: Compare): boolean {
  const actual = resolveFacts(rule.field)
  switch (rule.op) {
    case 'eq':     return actual === rule.value
    case 'neq':    return actual !== rule.value
    case 'gt':     return num(actual) > num(rule.value)
    case 'gte':    return num(actual) >= num(rule.value)
    case 'lt':     return num(actual) < num(rule.value)
    case 'lte':    return num(actual) <= num(rule.value)
    case 'in':     return Array.isArray(rule.value) && (rule.value as unknown[]).includes(actual as never)
    case 'nin':    return Array.isArray(rule.value) && !(rule.value as unknown[]).includes(actual as never)
    case 'exists': return actual !== undefined && actual !== null
    default:       return false
  }
}

// Indirection kept so tests can stub fact resolution via the facts param.
let currentFacts: Record<string, unknown> = {}
function resolveFacts(path: string): unknown {
  return resolve(currentFacts, path)
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number.NaN)

export function evaluate(rule: Rule, facts: Record<string, unknown>): RuleResult {
  currentFacts = facts

  if ('all' in rule) {
    const results = rule.all.map((r) => evaluate(r, facts))
    return {
      met: results.every((r) => r.met),
      describe: `all of: ${results.map((r) => r.describe).join(' AND ')}`,
    }
  }
  if ('any' in rule) {
    const results = rule.any.map((r) => evaluate(r, facts))
    return {
      met: results.some((r) => r.met),
      describe: `any of: ${results.map((r) => r.describe).join(' OR ')}`,
    }
  }
  if ('not' in rule) {
    const inner = evaluate(rule.not, facts)
    return { met: !inner.met, describe: `not (${inner.describe})` }
  }

  const met = compare(rule)
  const human: Record<Op, string> = {
    eq: 'equals', neq: 'does not equal', gt: 'is greater than', gte: 'is at least',
    lt: 'is less than', lte: 'is at most', in: 'is one of', nin: 'is not one of',
    exists: 'is provided',
  }
  return {
    met,
    field: rule.field,
    describe: `${rule.field} ${human[rule.op]} ${JSON.stringify(rule.value ?? null)}`,
  }
}

/** Evaluate a scheme's top-level rules; produce score + per-rule reasons. */
export function assessScheme(rules: Rule[], facts: Record<string, unknown>): Assessment {
  const reasons = rules.map((r) => evaluate(r, facts))
  const metCount = reasons.filter((r) => r.met).length
  const score = rules.length === 0 ? 0 : Math.round((metCount / rules.length) * 100)
  return { eligible: rules.length > 0 && metCount === rules.length, score, reasons }
}
