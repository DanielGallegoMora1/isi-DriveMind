import { SectionPage } from '../components/section-page'
import { useAuth } from '../features/auth'
import { TestsWorkspace } from '../features/tests'

export function TestsPage() {
  const { accessToken } = useAuth()

  return (
    <div className="grid gap-6">
      <SectionPage
        eyebrow="Tests"
        title="Exámenes de conducir"
        description="Generá tests por licencia, tema, random o preguntas falladas usando el core-service real."
        highlights={[
          { label: 'Formato', value: '30 preguntas' },
          { label: 'Fuente', value: 'core-service' },
          { label: 'Corrección', value: 'Automática' },
        ]}
      />

      <TestsWorkspace accessToken={accessToken} />
    </div>
  )
}
