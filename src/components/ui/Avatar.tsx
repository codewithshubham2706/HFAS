type AvatarProps = {
  name: string
  size?: 40 | 56
}

/** Avatar with initials — Avatar/40 and Avatar/56. */
export function Avatar({ name, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-full bg-[var(--color-primary-100)] font-semibold text-[var(--color-primary-700)] ${
        size === 40 ? 'h-10 w-10 text-[14px]' : 'h-14 w-14 text-[18px]'
      }`}
    >
      {initials}
    </span>
  )
}
