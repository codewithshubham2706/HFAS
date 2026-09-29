import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { useAppState } from '../state/AppStateContext'
import { Button } from '../components/ui/Button'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.9, 0.35, 1] as const } },
}

/** Page 1 — landing-desktop: marketing hero, value props, testimonial, footer. */
export function Landing() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { openOverlay } = useAppState()
  const reducedMotion = useReducedMotion()
  const { scrollY } = useScroll()
  // Subtle parallax: background moves 6px slower
  const heroY = useTransform(scrollY, [0, 400], [0, reducedMotion ? 0 : 24])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4 md:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-600)] text-[13px] font-extrabold text-white">HF</span>
          <span className="text-[17px] font-bold tracking-tight">HFAS</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/auth-signup" className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            {t('landing.loginLink')}
          </Link>
          <Button size="sm" onClick={() => navigate('/auth-signup')}>
            {t('landing.ctaPrimary')}
          </Button>
        </nav>
      </header>

      {/* Hero with parallax band */}
      <motion.section style={{ y: heroY }} className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--color-primary-50)] via-white to-white"
        />
        <motion.div
          variants={reducedMotion ? undefined : container}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-[820px] flex-col items-center gap-5 px-4 pb-16 pt-16 text-center md:pb-24 md:pt-24"
        >
          <motion.h1 variants={reducedMotion ? undefined : item} className="u-h1 max-w-[760px]">
            {t('landing.title')}
          </motion.h1>
          <motion.p variants={reducedMotion ? undefined : item} className="u-body-lg u-muted max-w-[640px]">
            {t('landing.subtitle')}
          </motion.p>
          <motion.div variants={reducedMotion ? undefined : item} className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth-signup')}>
              {t('landing.ctaPrimary')}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/eligibility-results')}>
              {t('landing.ctaSecondary')}
            </Button>
          </motion.div>
          <motion.p variants={reducedMotion ? undefined : item} className="u-caption mt-2">
            {t('landing.testimonial')} <span className="font-medium">{t('landing.testimonialAuthor')}</span>
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Value props */}
      <section className="mx-auto grid w-full max-w-[1200px] gap-4 px-4 pb-16 md:grid-cols-3 md:px-5">
        {[
          { title: t('landing.value1Title'), body: t('landing.value1Body'), icon: 'M12 21s-7-4.6-9.5-9C.7 8.6 2.6 5 6 5c2 0 3.2 1 4 2.2C10.8 6 12 5 14 5c3.4 0 5.3 3.6 3.5 7-2.5 4.4-9.5 9-9.5 9Z' },
          { title: t('landing.value2Title'), body: t('landing.value2Body'), icon: 'M4 7h16M4 12h16M4 17h10' },
          { title: t('landing.value3Title'), body: t('landing.value3Body'), icon: 'M3 12h4l3-7 4 14 3-7h4' },
        ].map((v) => (
          <motion.article
            key={v.title}
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, ease: [0.22, 0.9, 0.35, 1] }}
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-1)]"
          >
            <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)] text-[var(--color-primary-600)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={v.icon} />
              </svg>
            </span>
            <h2 className="u-h3 mb-1.5">{v.title}</h2>
            <p className="u-body u-muted">{v.body}</p>
          </motion.article>
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--color-gray-50)]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-5">
          <p className="u-caption">{t('landing.footerTagline')}</p>
          <nav className="flex gap-4" aria-label="Footer">
            <a href="#privacy" className="u-caption">{t('landing.footerPrivacy')}</a>
            <a href="#terms" className="u-caption">{t('landing.footerTerms')}</a>
            <a href="#a11y" className="u-caption">{t('landing.footerAccessibility')}</a>
            <button type="button" className="u-caption font-semibold" onClick={() => openOverlay('supportChat')}>
              {t('nav.support')}
            </button>
          </nav>
        </div>
      </footer>
    </div>
  )
}
