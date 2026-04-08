import { clsx } from 'clsx'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'size-4 border-2',
  md: 'size-7 border-2',
  lg: 'size-12 border-[3px]',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={clsx(
        'rounded-full border-[rgba(123,208,255,0.2)] border-t-[#7bd0ff] animate-spin',
        sizeClasses[size],
        className,
      )}
    />
  )
}
