type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[20px] border border-[rgba(141,177,229,0.12)] bg-[rgba(10,20,35,0.7)] px-8 py-16 text-center">
      <div className="size-14 rounded-full bg-[rgba(123,208,255,0.08)] flex items-center justify-center">
        <svg
          aria-hidden="true"
          className="size-7 text-[#7bd0ff]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-[#f5f7fb]">{title}</p>
        {description && <p className="mt-1 text-sm text-[#9fb2cc]">{description}</p>}
      </div>
      {action}
    </div>
  )
}
