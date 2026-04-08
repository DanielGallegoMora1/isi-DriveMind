import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

type BadgeProps = {
  label: string
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[rgba(141,177,229,0.15)] text-[#9fb2cc]',
  success: 'bg-[rgba(74,222,128,0.15)] text-[#4ade80]',
  warning: 'bg-[rgba(251,191,36,0.15)] text-[#fbbf24]',
  danger:  'bg-[rgba(248,113,113,0.15)] text-[#f87171]',
  info:    'bg-[rgba(123,208,255,0.15)] text-[#7bd0ff]',
}

export function Badge({ label, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        className,
      )}
    >
      {label}
    </span>
  )
}
