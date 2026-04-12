import { screen } from '@testing-library/react'
import { StatsPage } from './stats-page'
import { renderWithProviders } from '../test/utils'

describe('StatsPage', () => {
  it('muestra el placeholder de próximamente', () => {
    renderWithProviders(<StatsPage />)

    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })
})
