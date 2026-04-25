import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { I18nProvider, type Language } from '../features/i18n'
import { submitFeedback } from '../lib/send-feedback'
import { SendFeedbackPage } from './send-feedback-page'
import { SettingsPage } from './settings-page'

vi.mock('../lib/send-feedback', () => ({
  feedbackTypeOptions: ['Sugerencia de mejora', 'Reportar un error', 'Nueva funcionalidad', 'Experiencia de usuario'],
  submitFeedback: vi.fn(),
}))

const mockedSubmitFeedback = vi.mocked(submitFeedback)

function renderSendFeedbackPage(language: Language = 'es', authOverrides?: Partial<AuthContextValue>) {
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
    <MemoryRouter initialEntries={['/settings/send-feedback']}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLanguage={language}>
          <AuthContext.Provider value={authValue}>
            <Routes>
              <Route element={<SendFeedbackPage />} path="/settings/send-feedback" />
              <Route element={<SettingsPage />} path="/settings" />
            </Routes>
          </AuthContext.Provider>
        </I18nProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('SendFeedbackPage', () => {
  beforeEach(() => {
    mockedSubmitFeedback.mockReset()
    mockedSubmitFeedback.mockResolvedValue({ ok: true })
  })

  it('renders the page, form, and side cards in English', () => {
    renderSendFeedbackPage('en')

    expect(screen.getByRole('heading', { name: 'Send feedback' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to settings' })).toHaveAttribute('href', '/settings')
    expect(screen.getByText('Your opinion matters')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('placeholder', 'Summarize your feedback in one sentence')
    expect(screen.getByLabelText('Description')).toHaveAttribute('placeholder', 'Tell us in detail about your idea, suggestion, or the issue you found...')
    expect(screen.getByText('Why does your feedback matter?')).toBeInTheDocument()
    expect(screen.getByText('Useful tips')).toBeInTheDocument()
    expect(screen.getByText('Implemented feedback')).toBeInTheDocument()
    expect(screen.getByText('0 / 1500')).toBeInTheDocument()
  })

  it('allows selecting the feedback type in English labels', async () => {
    const user = userEvent.setup()
    renderSendFeedbackPage('en')

    const option = screen.getByLabelText('New feature')
    expect(option).not.toBeChecked()

    await user.click(option)

    expect(option).toBeChecked()
  })

  it('validates required fields before sending', async () => {
    const user = userEvent.setup()
    renderSendFeedbackPage('en')

    await user.click(screen.getByRole('button', { name: 'Send feedback' }))

    expect(mockedSubmitFeedback).not.toHaveBeenCalled()
    expect(screen.getByText('Select the feedback type.')).toBeInTheDocument()
    expect(screen.getByText('Write a short title for your feedback.')).toBeInTheDocument()
    expect(screen.getByText('Tell us the details of your feedback.')).toBeInTheDocument()
  })

  it('supports star rating interaction', async () => {
    const user = userEvent.setup()
    renderSendFeedbackPage('en')

    const thirdStar = screen.getByRole('button', { name: 'Rate 3 stars' })
    thirdStar.focus()
    await user.keyboard('{Enter}')

    expect(thirdStar).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('3 out of 5 stars selected.')).toBeInTheDocument()
  })

  it('submits feedback, shows success, and clears the form', async () => {
    const user = userEvent.setup()
    renderSendFeedbackPage('en')

    await user.click(screen.getByLabelText('Report a bug'))
    await user.type(screen.getByLabelText('Title'), 'Statistics loading error')
    await user.type(screen.getByLabelText('Description'), 'When I open the progress section, the main card sometimes takes too long and stays empty.')
    await user.click(screen.getByRole('button', { name: 'Rate 4 stars' }))
    await user.click(screen.getByRole('button', { name: 'Send feedback' }))

    await waitFor(() => {
      expect(mockedSubmitFeedback).toHaveBeenCalledWith({
        feedbackType: 'Reportar un error',
        title: 'Statistics loading error',
        description: 'When I open the progress section, the main card sometimes takes too long and stays empty.',
        rating: 4,
        userEmail: 'lucia@drivemind.test',
        userName: 'Lucía Pérez',
      })
    })

    expect(screen.getByText('Thanks for sharing your feedback. We received your message successfully.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('')
    expect(screen.getByLabelText('Description')).toHaveValue('')
    expect(screen.getByText('Optional, but it helps us understand your experience better.')).toBeInTheDocument()
  })

  it('allows navigating back to settings from the header', async () => {
    const user = userEvent.setup()
    renderSendFeedbackPage('en')

    await user.click(screen.getByRole('link', { name: 'Back to settings' }))

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })
})
