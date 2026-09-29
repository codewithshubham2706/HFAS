import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-6 text-[15px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const reducedMotion = useReducedMotion()

  const base =
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClass: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] active:bg-[var(--color-primary-800)] shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]',
    secondary:
      'bg-[var(--color-gray-100)] text-[var(--text-primary)] hover:bg-[var(--color-gray-200)] border border-[var(--border-subtle)]',
    ghost:
      'bg-transparent text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)]',
  }

  return (
    <motion.button
      whileHover={reducedMotion || disabled ? undefined : { y: -2 }}
      whileTap={reducedMotion || disabled ? undefined : { y: 0, scale: 0.98 }}
      transition={{ duration: 0.14, ease: [0.22, 0.9, 0.35, 1] }}
      className={`${base} ${sizes[size]} ${variantClass[variant]} ${className}`}
      disabled={disabled || loading}
      {...(rest as any)}
    >
      {loading && <span className="u-spinner" aria-hidden="true" />}
      <span className={loading ? 'opacity-70' : ''}>{children}</span>
    </motion.button>
  )
}
