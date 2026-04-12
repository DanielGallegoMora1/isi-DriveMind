import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'brand'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#1E3A5F] text-white font-semibold hover:bg-[#16304f] disabled:opacity-70 disabled:cursor-progress transition-colors duration-200',
  secondary:
    'bg-[#e8eef5] text-[#1E3A5F] hover:bg-[#dce7f2] transition-colors duration-200',
  ghost:
    'bg-transparent text-[#2C5F8A] font-semibold hover:text-[#1E3A5F] transition-colors duration-200',
  brand:
    'bg-[#2E7D5B] text-white font-semibold hover:bg-[#25684b] transition-colors duration-200',
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'min-h-12 rounded-full px-5 py-3 border-0 shadow-[0_14px_24px_-18px_rgba(30,58,95,0.5)]',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
