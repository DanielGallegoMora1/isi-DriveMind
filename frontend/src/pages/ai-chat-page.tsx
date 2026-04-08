import { SectionPage } from '../components/section-page'

export function AiChatPage() {
  return (
    <SectionPage
      eyebrow="Asistente IA"
      title="DriveMind Assistant"
      description="Consultá dudas sobre el reglamento, pedí explicaciones y practicá conversando con el asistente basado en IA."
      highlights={[
        { label: 'Modelo', value: 'HuggingFace API' },
        { label: 'Conversaciones', value: 'Múltiples y persistentes' },
        { label: 'Estado', value: 'Próximamente' },
      ]}
    />
  )
}
