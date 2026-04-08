import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'brand'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blue-500 text-white font-bold hover:bg-blue-600 disabled:opacity-70 disabled:cursor-progress transition-colors duration-200',
  secondary:
    'bg-[rgba(141,177,229,0.12)] text-[#d8e1f0] hover:bg-[rgba(141,177,229,0.2)] transition-colors duration-200',
  ghost:
    'bg-transparent text-blue-400 font-semibold hover:text-blue-300 transition-colors duration-200',
  brand:
    'bg-[#10b981] text-white font-bold hover:bg-[#059669] transition-colors duration-200',
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'min-h-12 rounded-full px-5 py-3 border-0',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
