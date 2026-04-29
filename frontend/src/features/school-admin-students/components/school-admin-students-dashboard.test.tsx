import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { SchoolAdminStudentsDashboard } from './school-admin-students-dashboard'
import { renderWithProviders } from '../../../test/utils'
import { resetStudentsMockState } from '../../../test/msw/handlers'
import { server } from '../../../test/msw/server'

const schoolAdminUser = {
  id: 'school-admin-1',
  email: 'admin@drivemind.test',
  full_name: 'Marta Ruiz',
  role: 'school_admin' as const,
  school_id: 'school-centro',
  school_name: 'Autoescuela Centro',
  is_active: true,
  created_at: null,
  updated_at: null,
}

describe('SchoolAdminStudentsDashboard', () => {
  beforeEach(() => {
    resetStudentsMockState()
  })

  it('renders KPI cards and student rows from the auth students endpoint', async () => {
    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect(await screen.findByRole('heading', { name: 'Gestión de alumnos' })).toBeInTheDocument()
    expect((await screen.findAllByText('Lucía Pérez')).length).toBeGreaterThan(0)
    expect(screen.getByText('Alumnos totales')).toBeInTheDocument()
    expect(screen.getAllByText(/^6$/)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/^5$/)[0]).toBeInTheDocument()
    expect(screen.getAllByText('80%')[0]).toBeInTheDocument()
    expect(screen.getAllByText(/^218$/)[0]).toBeInTheDocument()
    expect(screen.getAllByText('lucia@drivemind.test')[0]).toBeInTheDocument()
  })

  it('filters students locally by name or email', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect((await screen.findAllByText('Lucía Pérez')).length).toBeGreaterThan(0)
    await user.type(screen.getByLabelText('Buscar alumnos'), 'sofia')

    expect((await screen.findAllByText('Sofía Navarro')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Lucía Pérez')).not.toBeInTheDocument()
  })

  it('applies server-backed license filters from the filters panel', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect((await screen.findAllByText('Lucía Pérez')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.click(screen.getByRole('button', { name: 'A1' }))

    expect((await screen.findAllByText('Sofía Navarro')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Lucía Pérez')).not.toBeInTheDocument()
  })

  it('shows an actionable error state', async () => {
    server.use(http.get('/api/v1/auth/students', () => HttpResponse.json({ detail: 'service_down' }, { status: 500 })))

    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect(await screen.findByText('No se pudieron cargar los alumnos.')).toBeInTheDocument()
  })

  it('shows an empty state when no students exist', async () => {
    server.use(http.get('/api/v1/auth/students', () => HttpResponse.json({ items: [], total: 0, limit: 100, offset: 0 })))

    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect(await screen.findByText('Aún no tenés alumnos cargados.')).toBeInTheDocument()
  })

  it('shows a search empty state without losing the dashboard shell', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect((await screen.findAllByText('Lucía Pérez')).length).toBeGreaterThan(0)
    await user.type(screen.getByLabelText('Buscar alumnos'), 'nadie')

    await waitFor(() => {
      expect(screen.getByText('No encontramos alumnos con esa búsqueda.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Nuevo alumno' })).toBeInTheDocument()
  })

  it('opens the new student modal and closes it from the close button and backdrop', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect((await screen.findAllByText('Lucía Pérez')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Nuevo alumno' }))

    expect(screen.getByRole('dialog', { name: 'Nuevo alumno' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar modal de nuevo alumno' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Nuevo alumno' })).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Nuevo alumno' }))
    expect(screen.getByRole('dialog', { name: 'Nuevo alumno' })).toBeInTheDocument()

    await user.click(screen.getByTestId('new-student-backdrop'))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Nuevo alumno' })).not.toBeInTheDocument()
    })
  })

  it('opens the student overview modal from the eye action and closes it with the close button and backdrop', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect((await screen.findAllByText('Lucía Pérez')).length).toBeGreaterThan(0)

    await user.click(screen.getAllByRole('button', { name: 'Ver alumno Lucía Pérez' })[0])

    expect(screen.getByRole('dialog', { name: 'Lucía Pérez' })).toBeInTheDocument()
    expect(screen.getByText('Progreso del alumno')).toBeInTheDocument()
    expect(screen.getByText('Información del alumno')).toBeInTheDocument()
    expect(screen.getByText('Fecha de matriculación')).toBeInTheDocument()
    expect(screen.getByText('Tiempo medio')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar detalle de Lucía Pérez' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Lucía Pérez' })).not.toBeInTheDocument()
    })

    await user.click(screen.getAllByRole('button', { name: 'Ver alumno Lucía Pérez' })[0])
    expect(screen.getByRole('dialog', { name: 'Lucía Pérez' })).toBeInTheDocument()

    await user.click(screen.getByTestId('student-overview-backdrop'))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Lucía Pérez' })).not.toBeInTheDocument()
    })
  })

  it('validates email and phone in real time before submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect((await screen.findAllByText('Lucía Pérez')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Nuevo alumno' }))

    const emailInput = screen.getByLabelText('Email')
    const phoneInput = screen.getByLabelText('Teléfono')
    await user.type(screen.getByLabelText('Nombre completo'), 'Alumno Demo')

    await user.type(emailInput, 'correo-invalido')
    await user.type(phoneInput, 'abc')

    expect(screen.getByText('Ingresá un email válido.')).toBeInTheDocument()
    expect(screen.getByText('Ingresá un teléfono válido.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear alumno' })).toBeDisabled()

    await user.clear(emailInput)
    await user.type(emailInput, 'nuevo@drivemind.test')
    await user.clear(phoneInput)
    await user.type(phoneInput, '+34 611 222 333')

    await waitFor(() => {
      expect(screen.queryByText('Ingresá un email válido.')).not.toBeInTheDocument()
      expect(screen.queryByText('Ingresá un teléfono válido.')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Crear alumno' })).toBeEnabled()
  })

  it('submits the form, shows loading, success feedback and refreshes the list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchoolAdminStudentsDashboard accessToken="school-token" />, { user: schoolAdminUser })

    expect((await screen.findAllByText('Lucía Pérez')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Nuevo alumno' }))

    await user.type(screen.getByLabelText('Nombre completo'), 'Bruno Díaz')
    await user.type(screen.getByLabelText('Email'), 'bruno@drivemind.test')
    await user.type(screen.getByLabelText('Teléfono'), '+34 699 888 777')
    await user.selectOptions(screen.getByLabelText('Permiso'), 'A1')
    await user.type(screen.getByLabelText('Fecha de alta'), '2026-04-29')

    await user.click(screen.getByRole('button', { name: 'Crear alumno' }))

    expect(screen.getByRole('button', { name: 'Creando alumno...' })).toBeDisabled()
    expect(await screen.findByText('Alumno creado con éxito.')).toBeInTheDocument()
    expect(screen.getByText('Bruno Díaz ya puede ingresar con las credenciales automáticas enviadas a bruno@drivemind.test.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar modal de nuevo alumno' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Nuevo alumno' })).not.toBeInTheDocument()
    })

    expect(await screen.findAllByText('Bruno Díaz')).not.toHaveLength(0)
  })
})
