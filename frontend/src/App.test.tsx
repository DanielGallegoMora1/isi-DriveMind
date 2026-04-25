import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedLayout, LoginOnlyOutlet } from './app-route-gates'
import { AuthContext, type AuthContextValue } from './features/auth/auth-context'
import { I18nProvider, type Language } from './features/i18n'

function createAuthValue(overrides?: Partial<AuthContextValue>): AuthContextValue {
  return {
    accessToken: 'demo-token',
    changePassword: async () => undefined,
    isAuthenticated: true,
    isLoading: false,
    login: async () => undefined,
    logout: vi.fn(),
    user: {
      id: 'user-1',
      email: 'student@drivemind.test',
      full_name: 'Lucia Perez',
      role: 'student',
      school_id: null,
      is_active: true,
      created_at: null,
      updated_at: null,
    },
    ...overrides,
  }
}

function renderProtectedLayout(language: Language, authOverrides?: Partial<AuthContextValue>) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <I18nProvider initialLanguage={language}>
        <AuthContext.Provider value={createAuthValue(authOverrides)}>
          <Routes>
            <Route element={<ProtectedLayout />}>
              <Route element={<div>Protected content</div>} path="/" />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </I18nProvider>
    </MemoryRouter>,
  )
}

function renderLoginOnlyOutlet(language: Language, authOverrides?: Partial<AuthContextValue>) {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <I18nProvider initialLanguage={language}>
        <AuthContext.Provider value={createAuthValue(authOverrides)}>
          <Routes>
            <Route element={<LoginOnlyOutlet />}>
              <Route element={<div>Login content</div>} path="/login" />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('App loading gates', () => {
  it('renders the protected loading gate in English', () => {
    renderProtectedLayout('en', { isAuthenticated: false, isLoading: true, accessToken: null, user: null })

    expect(screen.getByRole('heading', { name: 'Restoring session' })).toBeInTheDocument()
    expect(screen.getByText('DriveMind')).toBeInTheDocument()
  })

  it('renders the login loading gate in Spanish', () => {
    renderLoginOnlyOutlet('es', { isAuthenticated: false, isLoading: true, accessToken: null, user: null })

    expect(screen.getByRole('heading', { name: 'Cargando acceso' })).toBeInTheDocument()
    expect(screen.getByText('DriveMind')).toBeInTheDocument()
  })
})
