import { screen } from '@testing-library/react'
import { TermsAndConditionsPage } from './terms-and-conditions-page'
import { renderWithProviders } from '../test/utils'

describe('TermsAndConditionsPage', () => {
  it('renderiza el documento legal con sus secciones y navegación de vuelta', () => {
    renderWithProviders(<TermsAndConditionsPage />)

    expect(screen.getByRole('heading', { name: 'Términos y condiciones' })).toBeInTheDocument()
    expect(screen.getByText('Normas de uso de la plataforma')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Términos y Condiciones de Uso' })).toBeInTheDocument()
    expect(screen.getByText('El usuario se compromete a:')).toBeInTheDocument()
    expect(screen.getByText(/Última actualización:/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver a ajustes/i })).toHaveAttribute('href', '/settings')
  })
})
