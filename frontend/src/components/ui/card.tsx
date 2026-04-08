import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type CardProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}

export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={clsx(
        'rounded-[20px] border border-[rgba(141,177,229,0.12)] bg-[rgba(10,20,35,0.7)] p-6',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
