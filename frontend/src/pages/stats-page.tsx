import { SectionPage } from '../components/section-page'

export function StatsPage() {
  return (
    <SectionPage
      description="Base visual para dashboard de rendimiento y metricas. Queda conectada a la navegacion aunque todavia no consuma core-service."
      highlights={[
        { label: 'Metricas planeadas', value: 'accuracy, history, trend' },
        { label: 'Estado actual', value: 'placeholder navegable' },
        { label: 'Servicio futuro', value: 'core-service /v1/stats' },
      ]}
      title="Stats"
    />
  )
}
