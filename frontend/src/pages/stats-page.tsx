import { SectionPage } from '../components/section-page'

export function StatsPage() {
  return (
    <SectionPage
      eyebrow="Estadísticas"
      title="Tu progreso"
      description="Analizá tu rendimiento por tema, seguí tu evolución temporal y detectá tus puntos débiles."
      highlights={[
        { label: 'Tests completados', value: '—' },
        { label: 'Precisión global', value: '—' },
        { label: 'Tema más fallado', value: '—' },
      ]}
    />
  )
}
