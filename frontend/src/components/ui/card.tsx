import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { clsx } from 'clsx'

type CardProps<T extends ElementType = 'div'> = {
  children: ReactNode
  className?: string
  as?: T
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Card<T extends ElementType = 'div'>({ children, className, as, ...props }: CardProps<T>) {
  const Tag = (as ?? 'div') as ElementType

  return (
    <Tag
      className={clsx(
        'rounded-[24px] border border-[#d7e0ea] bg-white p-6 shadow-[0_20px_45px_-28px_rgba(30,58,95,0.35)]',
        className,
      )}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Tag>
  )
}
