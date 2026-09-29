import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'

/**
 * Accessibility mode — larger base font, stronger contrast, thicker focus
 * rings. Persisted in localStorage; applied via [data-a11y] on <html>.
 * Styles: see global.css. (ROADMAP § Accessibility Mode.)
 */
export function AccessibilityToggle() {
  const { t } = useI18n()
  const [on, setOn] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('hfas.a11y') === '1'
    setOn(saved)
    document.documentElement.dataset.a11y = saved ? 'on' : 'off'
  }, [])

  function toggle() {
    const next = !on
    setOn(next)
    localStorage.setItem('hfas.a11y', next ? '1' : '0')
    document.documentElement.dataset.a11y = next ? 'on' : 'off'
  }

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={on}
      title={t('a11y.toggle')}
      className={`inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-full)] border px-3 text-[12px] font-semibold transition-colors ${
        on
          ? 'border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white'
          : 'border-[var(--border-strong)] bg-white text-[var(--text-secondary)] hover:border-[var(--color-primary-400)]'
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="5" r="2" />
        <path d="M4 9h16M12 9v6m0 0-3 6m3-6 3 6" />
      </svg>
      {on ? t('a11y.on') : t('a11y.toggle')}
    </button>
  )
}
