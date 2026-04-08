type Highlight = {
  label: string
  value: string
}

type SectionPageProps = {
  title: string
  description: string
  highlights: Highlight[]
}

export function SectionPage({ description, highlights, title }: SectionPageProps) {
  return (
    <section className="page-section">
      <header className="page-header">
        <p className="eyebrow">Sprint 1</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>

      <div className="card-grid">
        {highlights.map((highlight) => (
          <article className="info-card" key={highlight.label}>
            <span>{highlight.label}</span>
            <strong>{highlight.value}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}
