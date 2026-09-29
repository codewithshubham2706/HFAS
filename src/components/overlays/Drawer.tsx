import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  width?: number
  side?: 'right' | 'bottom'
  children: ReactNode
}

/** Slide-in drawer (right on desktop, bottom-sheet on mobile) with focus trap and 320ms entrance. */
export function Drawer({ open, onClose, title, subtitle, width = 480, side = 'right', children }: DrawerProps) {
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const focusables = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusables[0]?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab' && focusables.length > 0) {
        const firstEl = focusables[0]
        const lastEl = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const isBottom = side === 'bottom'

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[var(--z-overlay)] bg-black/45 ${
            isBottom ? 'flex items-end justify-center' : 'flex justify-end'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            ref={panelRef}
            className={`flex max-h-full w-full flex-col bg-white shadow-[var(--shadow-overlay)] ${
              isBottom
                ? 'max-w-[560px] rounded-t-[var(--radius-xl)]'
                : 'h-full rounded-l-[var(--radius-xl)]'
            }`}
            style={isBottom ? undefined : { maxWidth: width }}
            initial={isBottom ? { y: '100%' } : { x: '100%' }}
            animate={isBottom ? { y: 0 } : { x: 0 }}
            exit={isBottom ? { y: '100%' } : { x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 0.9, 0.35, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-6 py-4">
              <div>
                <h2 className="u-h3">{title}</h2>
                {subtitle && <p className="u-caption mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                aria-label={t('common.close')}
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--color-gray-100)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
