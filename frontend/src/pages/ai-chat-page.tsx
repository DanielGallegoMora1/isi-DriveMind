import { SectionPage } from '../components/section-page'

export function AiChatPage() {
  return (
    <SectionPage
      eyebrow="Asistente IA"
      title="Asistente de DriveMind"
      description="Consulta dudas sobre el reglamento, pide explicaciones y practica conversando con el asistente basado en IA."
      highlights={[
        { label: 'Modelo', value: 'HuggingFace API' },
        { label: 'Conversaciones', value: 'Múltiples y persistentes' },
        { label: 'Estado', value: 'Próximamente' },
      ]}
    />
  )
}
