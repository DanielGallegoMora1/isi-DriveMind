import type { JSX, ReactNode } from 'react'
import { clsx } from 'clsx'

type CardProps = {
  children: ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={clsx(
        'rounded-[24px] border border-[#d7e0ea] bg-white p-6 shadow-[0_20px_45px_-28px_rgba(30,58,95,0.35)]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
