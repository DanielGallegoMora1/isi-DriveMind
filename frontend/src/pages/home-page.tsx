import { SectionPage } from '../components/section-page'
import { useAuth } from '../features/auth/auth-context'

export function HomePage() {
  const { user } = useAuth()

  return (
    <SectionPage
      description={`Vista base para orientar el flujo inicial de ${user?.full_name ?? 'la app'} dentro del ecosistema DriveMind.`}
      highlights={[
        { label: 'Rol activo', value: user?.role ?? 'guest' },
        { label: 'Auth source', value: 'auth-service' },
        { label: 'Sprint focus', value: 'frontend foundation' },
      ]}
      title="Dashboard / Home"
    />
  )
}
