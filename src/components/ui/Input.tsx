import { useId } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import { HelpTip } from './HelpTip'

type InputProps = {
  label: string
  error?: string | null
  hint?: string
  sensitive?: boolean
  accepted?: boolean
  helpKey?: string   // i18n key for in-page micro-help tooltip
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>

/** Text input with label, error state, optional sensitive/accepted markers and micro-help. */
export function Input({
  label,
  error = null,
  hint,
  sensitive = false,
  accepted = false,
  helpKey,
  className = '',
  id,
  ...rest
}: InputProps) {
  const reactId = useId()
  const inputId = id ?? reactId
  const { t } = useI18n()

  return (
    <div className={`w-full ${className}`}>
      <label
        htmlFor={inputId}
        className="mb-1.5 flex items-center text-[13px] font-medium text-[var(--text-secondary)]"
      >
        {label}
        {sensitive && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-[var(--color-warning-50)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-warning-600)]">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4 7V5a4 4 0 1 1 8 0v2h.5A1.5 1.5 0 0 1 14 8.5v5A1.5 1.5 0 0 1 12.5 15h-9A1.5 1.5 0 0 1 2 13.5v-5A1.5 1.5 0 0 1 3.5 7H4Zm2 0h4V5a2 2 0 1 0-4 0v2Z" />
            </svg>
            REQUIRES LEGAL REVIEW
          </span>
        )}
        {accepted && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-[var(--color-success-50)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-success-600)]">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.5 10.6 3.9 8l-1.1 1.1 3.7 3.7 7.3-7.3L12.7 4.4 6.5 10.6Z" />
            </svg>
            {t('details.acceptedField')}
          </span>
        )}
        {helpKey && <HelpTip text={t(helpKey as never)} />}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`h-11 w-full rounded-[var(--radius-md)] border bg-white px-3.5 text-[var(--text-body-size)] text-[var(--text-primary)] transition-shadow duration-150 placeholder:text-[var(--color-gray-400)] focus:outline-none focus:ring-2 ${
          error
            ? 'border-[var(--color-error-500)] focus:ring-[var(--color-error-100)]'
            : 'border-[var(--border-strong)] focus:border-[var(--color-primary-600)] focus:ring-[var(--color-primary-100)]'
        }`}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-[13px] font-medium text-[var(--color-error-600)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[13px] text-[var(--text-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
