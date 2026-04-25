import { screen } from '@testing-library/react'
import { StatsPage } from './stats-page'
import { renderWithProviders } from '../test/utils'

describe('StatsPage', () => {
  it('renderiza el dashboard analítico de estadísticas', async () => {
    renderWithProviders(<StatsPage />)

    expect(await screen.findByRole('heading', { name: 'Estadísticas' })).toBeInTheDocument()
    expect(screen.getByText('Evolución del rendimiento')).toBeInTheDocument()
    expect(screen.getByText('Distribución de tests')).toBeInTheDocument()
    expect(screen.getByText('Rendimiento por tema')).toBeInTheDocument()
    expect(screen.getByText('Actividad semanal')).toBeInTheDocument()
    expect(screen.getByText('Punto fuerte')).toBeInTheDocument()
    expect(screen.getByText('Área de mejora')).toBeInTheDocument()
    expect(screen.getByText('Tendencia')).toBeInTheDocument()
  })

  it('renders the analytics dashboard in English', async () => {
    renderWithProviders(<StatsPage />, undefined, { language: 'en' })

    expect(await screen.findByRole('heading', { name: 'Statistics' })).toBeInTheDocument()
    expect(screen.getByText('Performance evolution')).toBeInTheDocument()
    expect(screen.getByText('Test distribution')).toBeInTheDocument()
    expect(screen.getByText('Performance by topic')).toBeInTheDocument()
    expect(screen.getByText('Weekly activity')).toBeInTheDocument()
    expect(screen.getByText('Strong point')).toBeInTheDocument()
    expect(screen.getByText('Improvement area')).toBeInTheDocument()
    expect(screen.getByText('Trend')).toBeInTheDocument()
  })
})
