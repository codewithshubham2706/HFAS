import { useI18n } from '../lib/i18n'
import type { Match } from '../lib/api'

/** Card/scheme — match score, coverage amount, "why" reasons, apply CTA. */
export function EligibilityCard({ match, onApply }: { match: Match; onApply: (slug: string) => void }) {
  const { t } = useI18n()
  const amount = match.maxAmountInr ? `₹${Number(match.maxAmountInr).toLocaleString('en-IN')}` : '—'

  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="chip chip-success">{t('results.match', { score: match.assessment.score })}</span>
        <span className="muted" style={{ fontSize: 12 }}>
          {match.providerType === 'govt' ? 'Government' : match.providerType === 'insurer' ? 'Insurer' : 'Trust / NGO'}
        </span>
      </div>

      <h3 style={{ fontSize: 18 }}>{match.name}</h3>
      <p className="muted" style={{ fontSize: 13 }}>{amount ? t('results.covers', { amount }) : ''}</p>

      <details>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-primary-600)' }}>
          {t('results.why')}
        </summary>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
          {match.assessment.reasons.map((r, i) => (
            <li key={i} style={{ color: r.met ? 'var(--color-success-600)' : 'var(--color-error-600)' }}>
              {r.met ? '✓' : '✗'} {r.describe}
            </li>
          ))}
        </ul>
      </details>

      <div style={{ marginTop: 'auto' }}>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onApply(match.slug)}>
          {t('results.apply')}
        </button>
      </div>
    </article>
  )
}
