import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n, type Lang } from '../../i18n/I18nContext'
import { useAppState } from '../../state/AppStateContext'

function LanguageToggle() {
  const { lang, setLang } = useI18n()
  const langs: { id: Lang; label: string }[] = [
    { id: 'en', label: 'EN' },
    { id: 'es', label: 'ES' },
  ]
  return (
    <div
      className="flex items-center rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-white p-0.5"
      role="group"
      aria-label="Language"
    >
      {langs.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          className={`rounded-[var(--radius-full)] px-2.5 py-1 text-[12px] font-semibold transition-colors ${
            lang === l.id
              ? 'bg-[var(--color-primary-600)] text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

type HeaderProps = {
  hideOnLanding?: boolean
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const items = [
    { label: t('nav.dashboard'), to: '/dashboard' },
    { label: t('nav.applications'), to: '/application-overview' },
    { label: t('nav.documents'), to: '/application-documents' },
    { label: t('nav.support'), to: '/status-timeline' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute left-0 right-0 top-full z-50 border-b border-[var(--border-subtle)] bg-white p-4 shadow-[var(--shadow-2)] md:hidden"
    >
      <nav className="flex flex-col gap-1">
        {items.map((i) => (
          <button
            key={i.to}
            type="button"
            className="rounded-[var(--radius-md)] px-3 py-2.5 text-left text-[15px] font-medium hover:bg-[var(--color-gray-50)]"
            onClick={() => {
              navigate(i.to)
              onClose()
            }}
          >
            {i.label}
          </button>
        ))}
      </nav>
    </motion.div>
  )
}

/** App header with nav rail links (desktop), language toggle, notifications and support chat trigger. */
export function Header({ hideOnLanding = false }: HeaderProps) {
  const { t } = useI18n()
  const { openOverlay } = useAppState()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  if (hideOnLanding) {
    return (
      <div className="absolute right-4 top-4 z-[var(--z-header)]">
        <LanguageToggle />
      </div>
    )
  }

  const isActive = (to: string) => location.pathname.startsWith(to)

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-[var(--border-subtle)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-[var(--radius-md)] px-1"
            onClick={() => navigate('/dashboard')}
            aria-label={t('app.longName')}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-600)] text-[13px] font-extrabold text-white">
              HF
            </span>
            <span className="text-[16px] font-bold tracking-tight">HFAS</span>
          </button>
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
            {[
              { label: t('nav.dashboard'), to: '/dashboard' },
              { label: t('nav.applications'), to: '/application-overview' },
              { label: t('nav.documents'), to: '/application-documents' },
            ].map((i) => (
              <Link
                key={i.to}
                to={i.to}
                className={`rounded-[var(--radius-md)] px-3 py-2 text-[14px] font-medium transition-colors ${
                  isActive(i.to)
                    ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--color-gray-50)] hover:text-[var(--text-primary)]'
                }`}
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            className="hidden h-10 items-center gap-2 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-[var(--color-gray-50)] px-3.5 text-[14px] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] md:flex"
            onClick={() => navigate('/eligibility-results')}
            aria-label={t('common.search')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            {t('common.search')}
          </button>
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-gray-100)]"
            aria-label={t('common.notifications')}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-error-500)]" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-[13px] font-bold text-[var(--color-primary-700)]"
            aria-label={t('nav.profile')}
            title="Sunita Devi"
          >
            SD
          </button>
          <button
            type="button"
            className="md:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      <AnimatePresence>{menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}</AnimatePresence>
    </header>
  )
}

export { LanguageToggle }
