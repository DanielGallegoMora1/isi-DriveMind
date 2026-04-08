import { SectionPage } from '../components/section-page'
import { useAuth } from '../features/auth/auth-context'

export function HomePage() {
  const { user } = useAuth()

  return (
    <SectionPage
      eyebrow="Inicio"
      title="Dashboard"
      description={`Bienvenido, ${user?.full_name ?? 'estudiante'}. Desde aquí accedés al resumen de tu actividad en DriveMind.`}
      highlights={[
        { label: 'Rol activo', value: user?.role ?? 'guest' },
        { label: 'Auth source', value: 'auth-service' },
        { label: 'Estado', value: 'Conectado' },
      ]}
    />
  )
}
