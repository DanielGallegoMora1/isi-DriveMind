type Highlight = {
  label: string
  value: string
}

type SectionPageProps = {
  title: string
  description: string
  highlights: Highlight[]
  eyebrow?: string
}

export function SectionPage({ description, highlights, title, eyebrow = 'DriveMind' }: SectionPageProps) {
  return (
    <section className="grid gap-7">
      <header className="rounded-3xl border border-[rgba(141,177,229,0.12)] bg-[rgba(10,20,35,0.7)] p-7">
        <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-[#7bd0ff]">
          {eyebrow}
        </p>
        <h2 className="mt-3 mb-2 text-[clamp(2rem,4vw,2.8rem)] leading-none text-[#f5f7fb]">
          {title}
        </h2>
        <p className="m-0 text-[#9fb2cc]">{description}</p>
      </header>

      <div className="grid grid-cols-3 gap-[18px] max-[960px]:grid-cols-1">
        {highlights.map((highlight) => (
          <article
            key={highlight.label}
            className="rounded-[20px] border border-[rgba(141,177,229,0.12)] bg-[rgba(10,20,35,0.7)] p-6"
          >
            <span className="text-sm text-[#9fb2cc]">{highlight.label}</span>
            <strong className="mt-1 block text-white">{highlight.value}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}
