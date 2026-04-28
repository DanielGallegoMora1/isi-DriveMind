import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginOnlyOutlet, ProtectedLayout, RoleProtectedLayout } from './app-route-gates'
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

function renderWithAuth(route: string, language: Language, authOverrides?: Partial<AuthContextValue>) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <I18nProvider initialLanguage={language}>
        <AuthContext.Provider value={createAuthValue(authOverrides)}>
          <Routes>
            <Route element={<ProtectedLayout />}>
              <Route element={<div>Protected content</div>} path="/" />
            </Route>
            <Route element={<RoleProtectedLayout allowedRoles={["system_admin"]} fallbackPath="/" />}>
              <Route element={<div>Admin content</div>} path="/admin" />
            </Route>
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
    renderWithAuth('/', 'en', { isAuthenticated: false, isLoading: true, accessToken: null, user: null })

    expect(screen.getByRole('heading', { name: 'Restoring session' })).toBeInTheDocument()
    expect(screen.getByText('DriveMind')).toBeInTheDocument()
  })

  it('renders the login loading gate in Spanish', () => {
    renderWithAuth('/login', 'es', { isAuthenticated: false, isLoading: true, accessToken: null, user: null })

    expect(screen.getByRole('heading', { name: 'Cargando acceso' })).toBeInTheDocument()
    expect(screen.getByText('DriveMind')).toBeInTheDocument()
  })

  it('renders /admin for system admins', () => {
    renderWithAuth('/admin', 'en', {
      user: {
        id: 'admin-1',
        email: 'system.admin@example.com',
        full_name: 'System Admin',
        role: 'system_admin',
        school_id: null,
        is_active: true,
        created_at: null,
        updated_at: null,
      },
    })

    expect(screen.getByText('Admin content')).toBeInTheDocument()
  })

  it('blocks /admin for non-admin authenticated users', () => {
    renderWithAuth('/admin', 'en')

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects /admin guests to login', () => {
    renderWithAuth('/admin', 'en', { isAuthenticated: false, accessToken: null, user: null })

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    expect(screen.getByText('Login content')).toBeInTheDocument()
  })
})
