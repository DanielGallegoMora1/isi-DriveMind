import { SectionPage } from '../components/section-page'

export function SettingsPage() {
  return (
    <SectionPage
      eyebrow="Ajustes"
      title="Preferencias del alumno"
      description="Espacio reservado para personalización del perfil, notificaciones y opciones de estudio. Por ahora dejamos una ruta segura y consistente con la navegación."
      highlights={[
        { label: 'Perfil', value: 'Próximamente' },
        { label: 'Notificaciones', value: 'Próximamente' },
        { label: 'Preferencias', value: 'Próximamente' },
      ]}
    />
  )
}
