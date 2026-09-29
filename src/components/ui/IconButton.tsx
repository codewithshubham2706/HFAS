type IconButtonProps = {
  label: string
  onClick?: () => void
  children?: React.ReactNode
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

/** 40px square icon button. */
export function IconButton({ label, onClick, children, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--color-gray-100)] hover:text-[var(--text-primary)] ${className}`}
      {...rest}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
      {children}
    </button>
  )
}
