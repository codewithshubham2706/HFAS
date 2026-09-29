// Shared logged-in shell: left rail + top header (used by pages 4–12 & handoff)
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { useAppState } from '../../state/AppStateContext'
import { AccessibilityToggle } from './AccessibilityToggle'

export function AppShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const { t } = useI18n()
  const { openOverlay } = useAppState()

  const nav = [
    { label: t('nav.dashboard'), to: '/dashboard', icon: 'M3 12l9-8 9 8M5 10v10h14V10' },
    { label: t('nav.applications'), to: '/application-overview', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
    { label: t('nav.documents'), to: '/application-documents', icon: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6' },
    { label: t('nav.support'), to: '/status-timeline', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z' },
  ]

  return (
    <div className="flex min-h-screen bg-[var(--bg-canvas)]">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-white px-3 py-5 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-600)] text-[13px] font-extrabold text-white">HF</span>
          <span className="text-[16px] font-bold tracking-tight">HFAS</span>
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              aria-current={active === n.to ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-[14px] font-medium transition-colors duration-150 ${
                active === n.to
                  ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--color-gray-50)] hover:text-[var(--text-primary)]'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={n.icon} />
              </svg>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <button
            type="button"
            onClick={() => openOverlay('supportChat')}
            className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--color-gray-50)] hover:text-[var(--text-primary)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 6v6m0 4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
            </svg>
            {t('nav.support')}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

export function TopHeader() {
  const { t } = useI18n()
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex h-10 w-full max-w-sm items-center gap-2 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-[var(--color-gray-50)] px-3.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder={t('common.search')}
            aria-label={t('common.search')}
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--color-gray-400)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <AccessibilityToggle />
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--color-gray-100)]"
            aria-label={t('common.notifications')}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-error-500)]" aria-hidden="true" />
          </button>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-[13px] font-bold text-[var(--color-primary-700)]"
            title="Sunita Devi"
          >
            SD
          </span>
        </div>
      </div>
    </header>
  )
}

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="u-h3">{title}</h2>
      {action}
    </div>
  )
}
