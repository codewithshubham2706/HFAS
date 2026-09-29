import { motion } from 'framer-motion'

type StepperProps = {
  steps: string[]
  current: number
}

/** Horizontal progress stepper; indicator slides via framer-motion layout animation. */
export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex w-full items-center gap-2" aria-label="Progress">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo'
        return (
          <li key={label} className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <motion.span
                layout
                transition={{ duration: 0.32, ease: [0.22, 0.9, 0.35, 1] }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                  state === 'todo'
                    ? 'border border-[var(--border-strong)] bg-white text-[var(--text-muted)]'
                    : 'bg-[var(--color-primary-600)] text-white'
                }`}
              >
                {state === 'done' ? (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M6.5 10.6 3.9 8l-1.1 1.1 3.7 3.7 7.3-7.3L12.7 4.4 6.5 10.6Z" />
                  </svg>
                ) : (
                  i + 1
                )}
              </motion.span>
              <span
                className={`text-[13px] font-medium ${
                  state === 'todo' ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                }`}
              >
                {label}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-gray-100)]">
              <motion.div
                className="h-full rounded-full bg-[var(--color-primary-600)]"
                initial={false}
                animate={{ width: state === 'todo' ? '0%' : '100%' }}
                transition={{ duration: 0.32, ease: [0.22, 0.9, 0.35, 1] }}
              />
            </div>
          </li>
        )
      })}
      <li className="hidden" aria-hidden="true">
        {current} / {steps.length} steps
      </li>
    </ol>
  )
}
