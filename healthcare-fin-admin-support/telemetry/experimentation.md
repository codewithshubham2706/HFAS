# Experimentation & causal framework — HFAS

## 1. Assignment (deterministic, sticky, PII-free)

```ts
// lib/experiment.ts — frontend + backend share the same hash
export function assignVariant(
  unitId: string,            // user_id ?? anonymousId (stable)
  experimentKey: string,
  variants: string[] = ['control', 'treatment'],
  salt = 'hfas-salt-v1',
): string {
  // FNV-1a 32-bit — fast, stable, evenly distributed
  let h = 2166136261
  const input = `${experimentKey}:${salt}:${unitId}`
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const bucket = (h >>> 0) % 100
  const per = Math.floor(100 / variants.length)
  return variants[Math.min(Math.floor(bucket / per), variants.length - 1)]
}
```

Rules: assignment is **pure** (same unit → same variant forever, even
offline). SRM checks in CI compare exposure counts to expected split.

## 2. Exposure instrumentation

Fire `experiment.assigned` **once per unit per experiment** on first render
of the variant surface (not on assignment alone):

```ts
const variant = assignVariant(unitId, 'ocr_verify_gate')
const seen = sessionStorage.getItem(`exp:ocr_verify_gate`)
if (!seen) {
  sessionStorage.setItem(`exp:ocr_verify_gate`, variant)
  tracker.track('experiment.assigned', {
    experimentKey: 'ocr_verify_gate', variant, assignedAt: new Date().toISOString(),
  })
}
```

## 3. Power / sample-size calculator

```sql
-- min sessions per arm for detecting relative uplift δ at α=0.05, power=0.8
-- p0 = baseline rate, δ = relative MDE
WITH params AS (
  SELECT 0.62 AS p0,          -- baseline submit rate (from funnel panel)
         0.05  AS rel_mde,    -- detect ≥5% relative change
         0.05  AS alpha,
         0.80  AS power
)
SELECT ceil(
  16 * p0 * (1 - p0) / power(p0 * rel_mde, 2)
) AS n_per_arm
FROM params;
-- Example: p0=0.62, δ=5% → ≈ 4,270 sessions per arm.
```

```ts
// Interactive version for planners
export function sampleSizePerArm(p0: number, relMde: number, alpha = 0.05, power = 0.8): number {
  const p1 = p0 * (1 + relMde)
  const za = 1.959964, zb = normInv(power) // ≈0.8416
  return Math.ceil(
    (za * Math.sqrt(p0 * (1 - p0)) + zb * Math.sqrt(p1 * (1 - p1))) ** 2 / (p1 - p0) ** 2
  )
}
function normInv(p: number): number {
  // Beasley-Springer-Moro approximation, adequate for planning
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239]
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425
  let q: number, r: number
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1) }
  if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1) }
  q = p - 0.5; r = q * q
  return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
}
```

## 4. Auto-analysis SQL (uplift + p-values)

```sql
-- experiment_analysis.sql — run per experimentKey after runtime ends.
-- Two-proportion z-test on submit rate per arm.
WITH arms AS (
  SELECT
    props->>'variant' AS variant,
    count(DISTINCT session_id) AS n,
    count(DISTINCT session_id) FILTER (
      WHERE session_id IN (
        SELECT session_id FROM telemetry_events
        WHERE event_name = 'action.submit_application' AND props->>'outcome' = 'submitted'
      )
    ) AS conversions
  FROM telemetry_events
  WHERE event_name = 'experiment.assigned'
    AND props->>'experimentKey' = :experiment_key
  GROUP BY 1
),
stats AS (
  SELECT
    variant, n, conversions,
    conversions::float / n AS rate,
    max(conversions) OVER ()::float / max(n) OVER () AS pooled
  FROM arms
)
SELECT
  variant, n, conversions, rate,
  round(100.0 * rate / max(rate) OVER () - 100, 1) AS uplift_pct,
  round(
    (rate - pooled) /
    sqrt(pooled * (1 - pooled) * (1.0/n + 1.0/max(n) OVER ()))
  , 3) AS z_stat,
  -- two-sided p-value from z (normal approx)
  round(2 * (1 - normal_cdf(abs(
    (rate - pooled) / sqrt(pooled * (1 - pooled) * (1.0/n + 1.0/max(n) OVER ()))
  ))), 4) AS p_value
FROM stats;

-- Guardrail check: experience_score delta per arm (must not regress > 10pts)
SELECT props->>'variant' AS variant,
       avg(m.experience_score) AS avg_experience
FROM telemetry_events e
JOIN session_metrics m USING (session_id)
WHERE e.event_name = 'experiment.assigned'
  AND e.props->>'experimentKey' = :experiment_key
GROUP BY 1;
```

*(Postgres: create `normal_cdf` via `CREATE FUNCTION ... AS 'erf'` wrapper, or
run analysis in the warehouse where `NORMAL_CDF` is native.)*

## 5. Reporting template

```markdown
### Experiment: {key} — {decision date}
**Arm split / SRM**: control N=? treatment N=? (χ² p=?) → OK/FLAGGED
**Primary metric**: submit_rate control=?% treatment=?% (+Δpp, p=?)
**Guardrails**: uploads_failed Δ?, experience_score Δ?, support_requests Δ?
**Decision**: SHIP / ITERATE / STOP — because {evidence sentence}
**Follow-ups**: {next experiment or rollback flag}
```

## 6. Interaction with the LLM agent
Completed experiment summaries (aggregates only) feed Prompt 2 to propose the
next round. Never feed per-user assignment tables to the model.
