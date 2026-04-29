import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './app-shell'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { I18nProvider, type Language } from '../features/i18n'
import type { AuthUser } from '../features/auth/types'

const studentUser: AuthUser = {
  id: 'user-1',
  email: 'student@drivemind.test',
  full_name: 'Lucia Perez',
  licenses: ['B'],
  role: 'student',
  school_id: null,
  is_active: true,
  created_at: null,
  updated_at: null,
}

function createAuthValue(user: AuthUser = studentUser): AuthContextValue {
  return {
    accessToken: 'demo-token',
    changePassword: async () => undefined,
    isAuthenticated: true,
    isLoading: false,
    login: async () => undefined,
    logout: vi.fn(),
    user,
  }
}

function renderAppShell(language: Language, user?: AuthUser, initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <I18nProvider initialLanguage={language}>
        <AuthContext.Provider value={createAuthValue(user)}>
          <Routes>
            <Route element={<AppShell />}>
              <Route element={<div>Outlet content</div>} path="/" />
              <Route element={<div>Admin outlet</div>} path="/admin" />
              <Route element={<div>School admin outlet</div>} path="/school-admin" />
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
    expect(screen.getByText('Alumno · Permiso B')).toBeInTheDocument()
  })

  it('renders system-admin shell without student links', () => {
    renderAppShell('en', {
      id: 'admin-1',
      email: 'system.admin@example.com',
      full_name: 'System Admin',
      role: 'system_admin',
      school_id: null,
      is_active: true,
      created_at: null,
      updated_at: null,
    }, '/admin')

    expect(screen.getByRole('heading', { name: 'System admin dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Driving schools' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Tests' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Statistics' })).not.toBeInTheDocument()
    expect(screen.getByText('System admin')).toBeInTheDocument()
  })

  it('renders school-admin shell with dedicated students navigation', () => {
    renderAppShell('es', {
      id: 'school-admin-1',
      email: 'admin@school.test',
      full_name: 'Marta Ruiz',
      role: 'school_admin',
      school_id: 'school-centro',
      school_name: 'Autoescuela Centro',
      is_active: true,
      created_at: null,
      updated_at: null,
    }, '/school-admin')

    expect(screen.getByRole('heading', { name: 'DriveMind' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Gestión de alumnos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ajustes' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Mis Tests' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Estadísticas' })).not.toBeInTheDocument()
    expect(screen.getByText('Autoescuela Centro')).toBeInTheDocument()
  })
})
