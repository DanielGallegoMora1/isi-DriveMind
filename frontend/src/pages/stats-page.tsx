import { SectionPage } from '../components/section-page'
import { useAuth } from '../features/auth'
import { StatsOverview } from '../features/stats'

export function StatsPage() {
  const { accessToken } = useAuth()

  return (
    <div className="grid gap-6">
      <SectionPage
        eyebrow="Estadísticas"
        title="Tu progreso"
        description="Resumen básico conectado al core-service real, con estados vacíos honestos para las métricas todavía no implementadas en backend."
        highlights={[
          { label: 'Fuente', value: 'core-service' },
          { label: 'Summary', value: 'Disponible' },
          { label: 'Detalle avanzado', value: 'En evolución' },
        ]}
      />

      <StatsOverview accessToken={accessToken} />
    </div>
  )
}
