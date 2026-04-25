import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { I18nProvider, type Language } from '../features/i18n'
import { renderWithProviders } from '../test/utils'
import { ContactSupportPage } from './contact-support-page'
import { HelpCenterPage } from './help-center-page'
import { PrivacyPolicyPage } from './privacy-policy-page'
import { SendFeedbackPage } from './send-feedback-page'
import { SettingsPage } from './settings-page'
import { TermsAndConditionsPage } from './terms-and-conditions-page'

function createAuthValue(overrides?: Partial<AuthContextValue>): AuthContextValue {
  return {
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
    ...overrides,
  }
}

function renderSettingsRoutes(language: Language = 'es', authOverrides?: Partial<AuthContextValue>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLanguage={language}>
          <AuthContext.Provider value={createAuthValue(authOverrides)}>
            <Routes>
              <Route element={<SettingsPage />} path="/settings" />
              <Route element={<HelpCenterPage />} path="/settings/help-center" />
              <Route element={<ContactSupportPage />} path="/settings/contact-support" />
              <Route element={<SendFeedbackPage />} path="/settings/send-feedback" />
              <Route element={<PrivacyPolicyPage />} path="/settings/privacy-policy" />
              <Route element={<TermsAndConditionsPage />} path="/settings/terms-and-conditions" />
            </Routes>
          </AuthContext.Provider>
        </I18nProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('SettingsPage', () => {
  it('renders the student settings view and executes logout from context', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()

    renderWithProviders(
      <SettingsPage />,
      {
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
      },
      { language: 'en' },
    )

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Lucía Pérez')).toBeInTheDocument()
    expect(screen.getByText('alumna@drivemind.test')).toBeInTheDocument()
    expect(screen.getByText('School pending assignment')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Security and privacy')).toBeInTheDocument()
    expect(screen.getByText('Help and support')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('shows elegant fallbacks when auth data is incomplete', () => {
    renderWithProviders(<SettingsPage />, { user: null })

    expect(screen.getByText('Estudiante DriveMind')).toBeInTheDocument()
    expect(screen.getByText('Sin email disponible')).toBeInTheDocument()
    expect(screen.getByText('Sin teléfono añadido aún')).toBeInTheDocument()
  })

  it('switches language from settings and persists the selected option in visible UI', async () => {
    const user = userEvent.setup()

    renderWithProviders(<SettingsPage />)

    expect(screen.getByRole('heading', { name: 'Ajustes' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Choose the language used across the visible interface.')).toBeInTheDocument()
    expect(window.localStorage.getItem('drivemind.language')).toBe('en')
  })

  it('navigates to privacy policy from security and privacy', async () => {
    const user = userEvent.setup()

    renderSettingsRoutes('en')

    await user.click(screen.getByRole('button', { name: /privacy policy/i }))

    expect(screen.getByRole('heading', { name: 'Privacy policy' })).toBeInTheDocument()
    expect(screen.getByText('Information about how your data is processed')).toBeInTheDocument()
  })

  it('navigates to help center from help and support', async () => {
    const user = userEvent.setup()

    renderSettingsRoutes('en')

    await user.click(screen.getByRole('button', { name: /help center/i }))

    expect(screen.getByRole('heading', { name: 'Help center' })).toBeInTheDocument()
    expect(screen.getAllByText('Account and profile')).toHaveLength(2)
  })

  it('navigates to contact support from help and support', async () => {
    const user = userEvent.setup()

    renderSettingsRoutes('en')

    await user.click(screen.getByRole('button', { name: /contact support/i }))

    expect(screen.getByRole('heading', { name: 'Contact support' })).toBeInTheDocument()
    expect(screen.getByText('Contact form')).toBeInTheDocument()
  })

  it('navigates to send feedback from help and support', async () => {
    const user = userEvent.setup()

    renderSettingsRoutes('en')

    await user.click(screen.getByRole('button', { name: /send feedback/i }))

    expect(screen.getByRole('heading', { name: 'Send feedback' })).toBeInTheDocument()
    expect(screen.getByText('Your opinion matters')).toBeInTheDocument()
  })

  it('navigates to terms and conditions from security and privacy', async () => {
    const user = userEvent.setup()

    renderSettingsRoutes('en')

    await user.click(screen.getByRole('button', { name: /terms and conditions/i }))

    expect(screen.getByRole('heading', { name: 'Terms and conditions' })).toBeInTheDocument()
    expect(screen.getByText('Rules for using the platform')).toBeInTheDocument()
  })

  it('opens the change password modal, validates inline, and completes successfully', async () => {
    const user = userEvent.setup()
    const changePassword = vi.fn().mockResolvedValue(undefined)

    renderWithProviders(<SettingsPage />, { changePassword }, { language: 'en' })

    await user.click(screen.getByRole('button', { name: /change password/i }))

    const modal = screen.getByRole('dialog', { name: /change password/i })
    const modalQueries = within(modal)

    await user.click(modalQueries.getByRole('button', { name: /save changes/i }))

    expect(modalQueries.getByText('Enter your current password.')).toBeInTheDocument()
    expect(modalQueries.getByText('Enter a new password.')).toBeInTheDocument()
    expect(modalQueries.getByText('Confirm the new password.')).toBeInTheDocument()

    await user.type(modalQueries.getByLabelText(/^Current password$/i), 'CurrentKey123')
    await user.type(modalQueries.getByLabelText(/^New password$/i), 'NewPassword123')
    await user.type(modalQueries.getByLabelText(/^Confirm new password$/i), 'NewPassword123')
    await user.click(modalQueries.getByRole('button', { name: /save changes/i }))

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'CurrentKey123',
      newPassword: 'NewPassword123',
    })
    expect(modalQueries.getByText('Password updated successfully.')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /change password/i })).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('shows backend feedback when the current password is rejected', async () => {
    const user = userEvent.setup()
    const changePassword = vi.fn().mockRejectedValue(new Error('The current password is incorrect.'))

    renderWithProviders(<SettingsPage />, { changePassword }, { language: 'en' })

    await user.click(screen.getByRole('button', { name: /change password/i }))

    const modal = screen.getByRole('dialog', { name: /change password/i })
    const modalQueries = within(modal)

    await user.type(modalQueries.getByLabelText(/^Current password$/i), 'CurrentKey123')
    await user.type(modalQueries.getByLabelText(/^New password$/i), 'NewPassword123')
    await user.type(modalQueries.getByLabelText(/^Confirm new password$/i), 'NewPassword123')
    await user.click(modalQueries.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('The current password is incorrect.')).toBeInTheDocument()
  })
})
