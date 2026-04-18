import { EmptyStateIcon } from '../icons'

type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border border-[#d7e0ea] bg-white px-8 py-16 text-center shadow-[0_20px_45px_-28px_rgba(30,58,95,0.35)]">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#edf3f8]">
        <EmptyStateIcon className="size-7 text-[#2C5F8A]" />
      </div>
      <div>
        <p className="font-semibold text-[#1E3A5F]">{title}</p>
        {description && <p className="mt-1 text-sm text-[#5f7287]">{description}</p>}
      </div>
      {action}
    </div>
  )
}
