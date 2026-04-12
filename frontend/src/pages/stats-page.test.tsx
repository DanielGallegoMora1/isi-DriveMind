import { screen } from '@testing-library/react'
import { StatsPage } from './stats-page'
import { renderWithProviders } from '../test/utils'

describe('StatsPage', () => {
  it('muestra summary real y empty states honestos para secciones vacías', async () => {
    renderWithProviders(<StatsPage />)

    expect(await screen.findByText('10')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('80.5%')).toBeInTheDocument()
    expect(screen.getByText(/backend devuelve esta sección vacía/i)).toBeInTheDocument()
    expect(screen.getByText(/no hay puntos de tendencia/i)).toBeInTheDocument()
    expect(screen.getByText(/no hay distribución de fallos disponible/i)).toBeInTheDocument()
  })
})
