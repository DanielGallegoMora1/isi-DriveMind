import { screen } from '@testing-library/react'
import { PrivacyPolicyPage } from './privacy-policy-page'
import { renderWithProviders } from '../test/utils'

describe('PrivacyPolicyPage', () => {
  it('renderiza el documento legal con índice, secciones y navegación de vuelta', () => {
    renderWithProviders(<PrivacyPolicyPage />)

    expect(screen.getByRole('heading', { name: 'Política de privacidad' })).toBeInTheDocument()
    expect(screen.getByText('Información sobre el tratamiento de tus datos')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Índice de la política de privacidad' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /1\. información general/i })).toHaveAttribute('href', '#informacion-general')
    expect(screen.getByText('No compartimos tus datos personales con terceros, salvo:')).toBeInTheDocument()
    expect(screen.getByText(/Última actualización:/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver a ajustes/i })).toHaveAttribute('href', '/settings')
  })
})
