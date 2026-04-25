import type { ComponentPropsWithoutRef, JSX, ReactNode } from 'react'
import { clsx } from 'clsx'

type CardProps<T extends keyof JSX.IntrinsicElements = 'div'> = {
  children: ReactNode
  className?: string
  as?: T
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Card<T extends keyof JSX.IntrinsicElements = 'div'>({ children, className, as: Tag = 'div' as T, ...props }: CardProps<T>) {
  return (
    <Tag
      className={clsx(
        'rounded-[24px] border border-[#d7e0ea] bg-white p-6 shadow-[0_20px_45px_-28px_rgba(30,58,95,0.35)]',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
