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

  it('renders the legal document in English', () => {
    renderWithProviders(<TermsAndConditionsPage />, undefined, { language: 'en' })

    expect(screen.getByRole('heading', { name: 'Terms and conditions' })).toBeInTheDocument()
    expect(screen.getByText('Rules for using the platform')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Terms and Conditions of Use' })).toBeInTheDocument()
    expect(screen.getByText('The user agrees to:')).toBeInTheDocument()
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to settings/i })).toHaveAttribute('href', '/settings')
  })
})
