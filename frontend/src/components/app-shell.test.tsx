import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './app-shell'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { I18nProvider, type Language } from '../features/i18n'

function createAuthValue(): AuthContextValue {
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
  }
}

function renderAppShell(language: Language) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <I18nProvider initialLanguage={language}>
        <AuthContext.Provider value={createAuthValue()}>
          <Routes>
            <Route element={<AppShell />}>
              <Route element={<div>Outlet content</div>} path="/" />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('renders the shell navigation in English', () => {
    renderAppShell('en')

    expect(screen.getByRole('heading', { name: 'Student dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'DriveMind AI Assistant' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Tests' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Statistics' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
  })

  it('renders the shell navigation in Spanish by default', () => {
    renderAppShell('es')

    expect(screen.getByRole('heading', { name: 'Panel del alumno' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Asistente IA de DriveMind' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mis Tests' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Estadísticas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ajustes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })
})
