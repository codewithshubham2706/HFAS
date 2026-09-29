import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Button } from '../ui/Button'

/** Granular cookie banner (bottom) with analytics/marketing toggles. */
export function CookieBanner() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-[150] border-t border-[var(--border-subtle)] bg-white shadow-[var(--shadow-3)]"
          initial={{ y: 96 }}
          animate={{ y: 0 }}
          exit={{ y: 96 }}
          transition={{ duration: 0.32, ease: [0.22, 0.9, 0.35, 1] }}
          role="region"
          aria-label={t('cookie.title')}
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
            <div className="min-w-0">
              <p className="u-h4">{t('cookie.title')}</p>
              <p className="u-caption mt-0.5 max-w-2xl">{t('cookie.body')}</p>
              <button
                type="button"
                className="mt-1 text-[13px] font-semibold text-[var(--color-primary-600)]"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                {expanded ? '−' : '+'} {t('cookie.analytics')} / {t('cookie.marketing')}
              </button>
              {expanded && (
                <div className="mt-2 flex flex-col gap-1.5">
                  <label className="u-caption flex items-center gap-2">
                    <input type="checkbox" checked disabled className="accent-[var(--color-primary-600)]" />
                    {t('cookie.essential')}
                  </label>
                  <label className="u-caption flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="accent-[var(--color-primary-600)]"
                    />
                    {t('cookie.analytics')}
                  </label>
                  <label className="u-caption flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                      className="accent-[var(--color-primary-600)]"
                    />
                    {t('cookie.marketing')}
                  </label>
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAnalytics(false)
                  setMarketing(false)
                  setVisible(false)
                }}
              >
                {t('cookie.savePrefs')}
              </Button>
              <Button size="sm" onClick={() => setVisible(false)}>
                {t('cookie.acceptAll')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
