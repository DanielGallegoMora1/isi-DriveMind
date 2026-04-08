import { SectionPage } from '../components/section-page'

export function AiChatPage() {
  return (
    <SectionPage
      description="Entrada inicial para el asistente conversacional. El layout ya contempla la seccion aunque la integracion llegue mas adelante."
      highlights={[
        { label: 'Conversaciones', value: 'multiples' },
        { label: 'Persistencia', value: 'prevista en ai-service' },
        { label: 'Estado', value: 'base lista para expandir' },
      ]}
      title="AI Chat"
    />
  )
}
