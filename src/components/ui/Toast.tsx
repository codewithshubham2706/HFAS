import { motion } from 'framer-motion'

type ToastProps = {
  message: string
  kind?: 'success' | 'error'
}

/** Bottom-center toast, auto-dismissed by AppStateContext. */
export function Toast({ message, kind = 'success' }: ToastProps) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[var(--z-toast)] -translate-x-1/2"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.26, ease: [0.22, 0.9, 0.35, 1] }}
    >
      <div
        className={`flex items-center gap-2.5 rounded-[var(--radius-full)] px-4 py-2.5 shadow-[var(--shadow-3)] ${
          kind === 'success'
            ? 'bg-[var(--color-gray-900)] text-white'
            : 'bg-[var(--color-error-600)] text-white'
        }`}
      >
        {kind === 'success' ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="text-[var(--color-success-100)]">
            <path d="M6.5 10.6 3.9 8l-1.1 1.1 3.7 3.7 7.3-7.3L12.7 4.4 6.5 10.6Z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.9 10.5H7.1V9.7h1.8v1.8Zm0-2.7H7.1V4.5h1.8v4.3Z" />
          </svg>
        )}
        <span className="text-[14px] font-medium">{message}</span>
      </div>
    </motion.div>
  )
}
