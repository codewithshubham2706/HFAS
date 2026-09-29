import { useI18n } from '../i18n/I18nContext'
import { AppShell, TopHeader } from '../components/layout/AppShell'
import { tokensJson } from '../handoff/tokens'
import { cssVars } from '../handoff/cssVars'
import { apiPlaceholders, lottiePlaceholders, licenses, componentMap, a11yChecklist } from '../handoff/handoffData'

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <section className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white shadow-[var(--shadow-1)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--color-gray-50)] px-4 py-2.5">
        <h2 className="u-h4 u-mono">{title}</h2>
        <button
          type="button"
          className="rounded-[var(--radius-sm)] px-2 py-1 text-[12px] font-semibold text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)]"
          onClick={() => navigator.clipboard?.writeText(code)}
        >
          Copy
        </button>
      </div>
      <pre className="max-h-[420px] overflow-auto p-4 text-[12.5px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
        <code>{code}</code>
      </pre>
    </section>
  )
}

/** Handoff page — tokens, css vars, API + Lottie placeholders, licenses, a11y checklist, runbook. */
export function Handoff() {
  const { t } = useI18n()

  return (
    <AppShell active="/handoff">
      <TopHeader />
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <h1 className="u-h1">{t('handoff.title')}</h1>
        <p className="u-body u-muted mt-1">{t('handoff.subtitle')}</p>

        <CodeBlock title="tokens.json" code={tokensJson} />
        <CodeBlock title="css-vars.css" code={cssVars} />

        <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)]">
          <h2 className="u-h3">API placeholders</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {apiPlaceholders.map((api) => (
              <li key={api.path} className="rounded-[var(--radius-md)] bg-[var(--color-gray-50)] px-3 py-2.5">
                <p className="u-body">
                  <span className="u-mono rounded-[var(--radius-sm)] bg-[var(--color-primary-50)] px-1.5 py-0.5 font-semibold text-[var(--color-primary-700)]">{api.method}</span>{' '}
                  <span className="u-mono">{api.path}</span>
                </p>
                <p className="u-caption mt-1">{api.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)]">
          <h2 className="u-h3">Lottie placeholders</h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            {lottiePlaceholders.map((l) => (
              <li key={l.file} className="u-body">
                <span className="u-mono text-[var(--color-primary-700)]">{l.file}</span> — {l.use}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)]">
          <h2 className="u-h3">ASSET_LICENSES.md</h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            {licenses.map((l) => (
              <li key={l.asset} className="u-body">
                <span className="u-mono font-semibold">{l.asset}</span> — {l.license}
                {l.needsLegalReview && (
                  <span className="ml-2 rounded-[var(--radius-full)] bg-[var(--color-warning-50)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-warning-600)]">
                    REQUIRES LEGAL REVIEW
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)]">
          <h2 className="u-h3">Component mapping</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border-strong)]">
                  <th className="u-caption py-2 pr-4">Figma component</th>
                  <th className="u-caption py-2">Export name</th>
                </tr>
              </thead>
              <tbody>
                {componentMap.map((c) => (
                  <tr key={c.figma} className="border-b border-[var(--border-subtle)]">
                    <td className="u-body py-2 pr-4">{c.figma}</td>
                    <td className="u-body py-2 u-mono">{c.exportName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-1)]">
          <h2 className="u-h3">Accessibility checklist</h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            {a11yChecklist.map((item) => (
              <li key={item} className="u-body flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-success-500)]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </AppShell>
  )
}
