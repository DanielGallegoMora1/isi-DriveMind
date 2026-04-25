import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/utils'
import { LoginPage } from './login-page'

describe('LoginPage', () => {
  it('renders the login screen in English', () => {
    renderWithProviders(<LoginPage />, { isAuthenticated: false, accessToken: null, user: null }, { language: 'en' })

    expect(screen.getByRole('heading', { name: 'Your path to a driving licence starts here' })).toBeInTheDocument()
    expect(screen.getByText('Sign in with your current credentials to continue in DriveMind.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('placeholder', 'email@example.com')
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('renders the login screen in Spanish by default', () => {
    renderWithProviders(<LoginPage />, { isAuthenticated: false, accessToken: null, user: null })

    expect(screen.getByRole('heading', { name: 'Tu camino hacia el carné de conducir empieza aquí' })).toBeInTheDocument()
    expect(screen.getByText('Inicia sesión con tus credenciales actuales para continuar en DriveMind.')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('shows the fallback submit error in the active language', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockRejectedValue(new Error('network error'))

    renderWithProviders(<LoginPage />, { login, isAuthenticated: false, accessToken: null, user: null }, { language: 'en' })

    await user.type(screen.getByLabelText('Email'), 'student@drivemind.test')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Could not sign in with auth-service.')).toBeInTheDocument()
  })
})
