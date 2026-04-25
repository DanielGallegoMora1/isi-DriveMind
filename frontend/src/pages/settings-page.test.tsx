import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { SettingsPage } from './settings-page'
import { HelpCenterPage } from './help-center-page'
import { PrivacyPolicyPage } from './privacy-policy-page'
import { TermsAndConditionsPage } from './terms-and-conditions-page'
import { renderWithProviders } from '../test/utils'

describe('SettingsPage', () => {
  it('renderiza la vista de ajustes del alumno con fallbacks y usa el logout real del contexto', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()

    renderWithProviders(<SettingsPage />, {
      logout,
      user: {
        id: 'user-2',
        email: 'alumna@drivemind.test',
        full_name: 'Lucía Pérez',
        role: 'student',
        school_id: null,
        is_active: true,
        created_at: null,
        updated_at: null,
      },
    })

    expect(screen.getByRole('heading', { name: 'Ajustes' })).toBeInTheDocument()
    expect(screen.getByText('Lucía Pérez')).toBeInTheDocument()
    expect(screen.getByText('alumna@drivemind.test')).toBeInTheDocument()
    expect(screen.getByText('Centro pendiente de asignación')).toBeInTheDocument()
    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    expect(screen.getByText('Apariencia')).toBeInTheDocument()
    expect(screen.getByText('Seguridad y privacidad')).toBeInTheDocument()
    expect(screen.getByText('Ayuda y soporte')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('muestra un fallback elegante cuando no hay datos completos de auth', () => {
    renderWithProviders(<SettingsPage />, { user: null })

    expect(screen.getByText('Estudiante DriveMind')).toBeInTheDocument()
    expect(screen.getByText('Sin email disponible')).toBeInTheDocument()
    expect(screen.getByText('Sin teléfono añadido aún')).toBeInTheDocument()
  })

  it('navega a la política de privacidad desde seguridad y privacidad', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const authValue: AuthContextValue = {
      accessToken: 'demo-token',
      changePassword: async () => undefined,
      isAuthenticated: true,
      isLoading: false,
      login: async () => undefined,
      logout: vi.fn(),
      user: {
        id: 'user-2',
        email: 'alumna@drivemind.test',
        full_name: 'Lucía Pérez',
        role: 'student',
        school_id: null,
        is_active: true,
        created_at: null,
        updated_at: null,
      },
    }

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={authValue}>
            <Routes>
              <Route element={<SettingsPage />} path="/settings" />
              <Route element={<PrivacyPolicyPage />} path="/settings/privacy-policy" />
            </Routes>
          </AuthContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /política de privacidad/i }))

    expect(screen.getByRole('heading', { name: 'Política de privacidad' })).toBeInTheDocument()
    expect(screen.getByText('Información sobre el tratamiento de tus datos')).toBeInTheDocument()
  })

  it('navega al centro de ayuda desde ayuda y soporte', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const authValue: AuthContextValue = {
      accessToken: 'demo-token',
      changePassword: async () => undefined,
      isAuthenticated: true,
      isLoading: false,
      login: async () => undefined,
      logout: vi.fn(),
      user: {
        id: 'user-2',
        email: 'alumna@drivemind.test',
        full_name: 'Lucía Pérez',
        role: 'student',
        school_id: null,
        is_active: true,
        created_at: null,
        updated_at: null,
      },
    }

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={authValue}>
            <Routes>
              <Route element={<SettingsPage />} path="/settings" />
              <Route element={<HelpCenterPage />} path="/settings/help-center" />
            </Routes>
          </AuthContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /centro de ayuda/i }))

    expect(screen.getByRole('heading', { name: 'Centro de ayuda' })).toBeInTheDocument()
    expect(screen.getAllByText('Cuenta y perfil')).toHaveLength(2)
  })

  it('navega a términos y condiciones desde seguridad y privacidad', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const authValue: AuthContextValue = {
      accessToken: 'demo-token',
      changePassword: async () => undefined,
      isAuthenticated: true,
      isLoading: false,
      login: async () => undefined,
      logout: vi.fn(),
      user: {
        id: 'user-2',
        email: 'alumna@drivemind.test',
        full_name: 'Lucía Pérez',
        role: 'student',
        school_id: null,
        is_active: true,
        created_at: null,
        updated_at: null,
      },
    }

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={authValue}>
            <Routes>
              <Route element={<SettingsPage />} path="/settings" />
              <Route element={<TermsAndConditionsPage />} path="/settings/terms-and-conditions" />
            </Routes>
          </AuthContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /términos y condiciones/i }))

    expect(screen.getByRole('heading', { name: 'Términos y condiciones' })).toBeInTheDocument()
    expect(screen.getByText('Normas de uso de la plataforma')).toBeInTheDocument()
  })

  it('abre el modal de cambiar contraseña, valida inline y ejecuta el cambio exitoso', async () => {
    const user = userEvent.setup()
    const changePassword = vi.fn().mockResolvedValue(undefined)

    renderWithProviders(<SettingsPage />, { changePassword })

    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }))

    const modal = screen.getByRole('dialog', { name: /cambiar contraseña/i })
    const modalQueries = within(modal)

    await user.click(modalQueries.getByRole('button', { name: /guardar cambios/i }))

    expect(modalQueries.getByText('Ingresá tu contraseña actual.')).toBeInTheDocument()
    expect(modalQueries.getByText('Ingresá una nueva contraseña.')).toBeInTheDocument()
    expect(modalQueries.getByText('Confirmá la nueva contraseña.')).toBeInTheDocument()

    await user.type(modalQueries.getByLabelText(/^Contraseña actual$/i), 'ClaveActual123')
    await user.type(modalQueries.getByLabelText(/^Nueva contraseña$/i), 'NuevaClave123')
    await user.type(modalQueries.getByLabelText(/^Confirmar nueva contraseña$/i), 'NuevaClave123')

    await user.click(modalQueries.getByRole('button', { name: /guardar cambios/i }))

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'ClaveActual123',
      newPassword: 'NuevaClave123',
    })
    expect(modalQueries.getByText('Contraseña actualizada correctamente.')).toBeInTheDocument()

    await waitFor(
      () => {
        expect(screen.queryByRole('dialog', { name: /cambiar contraseña/i })).not.toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('muestra feedback si el backend rechaza la contraseña actual', async () => {
    const user = userEvent.setup()
    const changePassword = vi.fn().mockRejectedValue(new Error('La contraseña actual no es correcta.'))

    renderWithProviders(<SettingsPage />, { changePassword })

    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }))

    const modal = screen.getByRole('dialog', { name: /cambiar contraseña/i })
    const modalQueries = within(modal)

    await user.type(modalQueries.getByLabelText(/^Contraseña actual$/i), 'ClaveActual123')
    await user.type(modalQueries.getByLabelText(/^Nueva contraseña$/i), 'NuevaClave123')
    await user.type(modalQueries.getByLabelText(/^Confirmar nueva contraseña$/i), 'NuevaClave123')
    await user.click(modalQueries.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeInTheDocument()
  })
})
