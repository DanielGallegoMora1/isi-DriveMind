import { SectionPage } from '../components/section-page'

export function TestsPage() {
  return (
    <SectionPage
      eyebrow="Tests"
      title="Exámenes de conducir"
      description="Genera tests por licencia, tema o de forma aleatoria. 30 preguntas por examen, corrección automática."
      highlights={[
        { label: 'Formato', value: '30 preguntas' },
        { label: 'Modos', value: 'Licencia · Tema · Random' },
        { label: 'Umbral de fallo', value: 'Más de 3 errores' },
      ]}
    />
  )
}
