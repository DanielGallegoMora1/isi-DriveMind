import { SectionPage } from '../components/section-page'

export function TestsPage() {
  return (
    <SectionPage
      description="Pantalla placeholder para el motor de tests del sprint siguiente. La navegacion y la estructura ya quedan preparadas."
      highlights={[
        { label: 'Modos previstos', value: 'license, topic, random, failed' },
        { label: 'Cantidad objetivo', value: '30 preguntas' },
        { label: 'Integracion futura', value: 'core-service' },
      ]}
      title="Tests"
    />
  )
}
