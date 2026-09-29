import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type HelpTipProps = {
  text: string
}

/**
 * In-page micro-help: a small "?" that reveals contextual guidance on
 * hover/focus. (ROADMAP § In-Page Micro-Help.) Keyboard accessible.
 */
export function HelpTip({ text }: HelpTipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="help-tip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={text}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px] font-bold text-[var(--text-muted)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-600)]"
      >
        ?
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            className="help-tip__bubble"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
