import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { I18nProvider, type Language } from '../features/i18n'
import { submitSupportContact } from '../lib/support-contact'
import { ContactSupportPage } from './contact-support-page'
import { SettingsPage } from './settings-page'

vi.mock('../lib/support-contact', () => ({ submitSupportContact: vi.fn() }))

const mockedSubmitSupportContact = vi.mocked(submitSupportContact)

function renderContactSupportPage(language: Language = 'es', authOverrides?: Partial<AuthContextValue>) {
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
      email: 'lucia@drivemind.test',
      full_name: 'Lucía Pérez',
      role: 'student',
      school_id: null,
      is_active: true,
      created_at: null,
      updated_at: null,
    },
    ...authOverrides,
  }

  return render(
    <MemoryRouter initialEntries={['/settings/contact-support']}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLanguage={language}>
          <AuthContext.Provider value={authValue}>
            <Routes>
              <Route element={<ContactSupportPage />} path="/settings/contact-support" />
              <Route element={<SettingsPage />} path="/settings" />
            </Routes>
          </AuthContext.Provider>
        </I18nProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('ContactSupportPage', () => {
  beforeEach(() => {
    mockedSubmitSupportContact.mockReset()
    mockedSubmitSupportContact.mockResolvedValue({ ok: true })
  })

  it('renders the page in English, prefills the user data, and shows support channels', () => {
    renderContactSupportPage('en')

    expect(screen.getByRole('heading', { name: 'Contact support' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to settings' })).toHaveAttribute('href', '/settings')
    expect(screen.getByLabelText('Full name')).toHaveValue('Lucía Pérez')
    expect(screen.getByLabelText('Email')).toHaveValue('lucia@drivemind.test')
    expect(screen.getByText('Support hours')).toBeInTheDocument()
    expect(screen.getByText('Monday - Friday')).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
    expect(screen.getByText('If you prefer to write to us directly:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'support@drivemind.app' })).toHaveAttribute('href', 'mailto:support@drivemind.app')
    expect(screen.getByText('Call us Monday through Friday')).toBeInTheDocument()
    expect(screen.getByText('Response time')).toBeInTheDocument()
    expect(screen.getByText('0 / 1200')).toBeInTheDocument()
  })

  it('validates required fields and email format before sending', async () => {
    const user = userEvent.setup()
    renderContactSupportPage('en')

    await user.clear(screen.getByLabelText('Full name'))
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'invalid-email')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    expect(mockedSubmitSupportContact).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your full name.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email.')).toBeInTheDocument()
    expect(screen.getByText('Select the inquiry type.')).toBeInTheDocument()
    expect(screen.getByText('Write a descriptive subject.')).toBeInTheDocument()
    expect(screen.getByText('Tell us the details of your issue or question.')).toBeInTheDocument()
  })

  it('submits the form, shows success feedback, and clears editable fields', async () => {
    const user = userEvent.setup()
    renderContactSupportPage('en')

    await user.selectOptions(screen.getByRole('combobox', { name: /inquiry type/i }), 'tecnico')
    await user.type(screen.getByLabelText(/subject/i), 'I cannot access the history')
    await user.type(screen.getByLabelText(/message/i), 'The page turns blank when I try to review my results.')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => {
      expect(mockedSubmitSupportContact).toHaveBeenCalledWith({
        fullName: 'Lucía Pérez',
        email: 'lucia@drivemind.test',
        inquiryType: 'tecnico',
        subject: 'I cannot access the history',
        message: 'The page turns blank when I try to review my results.',
      })
    })

    expect(screen.getByText('Your message was sent successfully. The support team will reply by email.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /inquiry type/i })).toHaveValue('')
    expect(screen.getByLabelText(/subject/i)).toHaveValue('')
    expect(screen.getByLabelText(/message/i)).toHaveValue('')
  })

  it('allows navigating back to settings from the header', async () => {
    const user = userEvent.setup()
    renderContactSupportPage('en')

    await user.click(screen.getByRole('link', { name: 'Back to settings' }))

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })
})
