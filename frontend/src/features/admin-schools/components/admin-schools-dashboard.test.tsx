import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { AdminSchoolsDashboard } from './admin-schools-dashboard'
import { renderWithProviders } from '../../../test/utils'
import { resetSchoolsMockState } from '../../../test/msw/handlers'
import { server } from '../../../test/msw/server'

describe('AdminSchoolsDashboard', () => {
  beforeEach(() => {
    resetSchoolsMockState()
  })

  it('lists and filters schools for system admins', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminSchoolsDashboard accessToken="admin-token" />, undefined, { language: 'en' })

    expect(await screen.findByRole('heading', { name: 'Driving schools' })).toBeInTheDocument()
    expect(await screen.findByText('Autoescuela Centro')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Search by name'), 'Norte')
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    expect(await screen.findByText('Autoescuela Norte')).toBeInTheDocument()
    expect(screen.queryByText('Autoescuela Centro')).not.toBeInTheDocument()
  })

  it('creates a school and refreshes the list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminSchoolsDashboard accessToken="admin-token" />, undefined, { language: 'en' })

    await user.type(await screen.findByLabelText('School name'), 'Autoescuela Sur')
    await user.type(screen.getByLabelText('Admin email'), 'sur@school.test')
    await user.type(screen.getByLabelText('Admin password'), 'Sur12345')
    await user.click(screen.getByRole('button', { name: 'Create school' }))

    expect(await screen.findByText('Autoescuela Sur')).toBeInTheDocument()
  })

  it('shows a create error without clearing the dashboard when the admin email is duplicated', async () => {
    const user = userEvent.setup()
    server.use(http.post('/api/v1/auth/schools', () => HttpResponse.json({ detail: 'email_already_exists' }, { status: 409 })))
    renderWithProviders(<AdminSchoolsDashboard accessToken="admin-token" />, undefined, { language: 'en' })

    await user.type(await screen.findByLabelText('School name'), 'Autoescuela Centro Duplicada')
    await user.type(screen.getByLabelText('Admin email'), 'centro@school.test')
    await user.type(screen.getByLabelText('Admin password'), 'Centro12345')
    await user.click(screen.getByRole('button', { name: 'Create school' }))

    expect(await screen.findByText('Could not create the driving school.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Autoescuela Centro Duplicada')).toBeInTheDocument()
    expect(screen.getByText('Autoescuela Centro')).toBeInTheDocument()
  })

  it('deletes a school after confirmation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminSchoolsDashboard accessToken="admin-token" />, undefined, { language: 'en' })

    const schoolName = await screen.findByText('Autoescuela Centro')
    const schoolRow = schoolName.closest('tr')
    expect(schoolRow).not.toBeNull()
    await user.click(within(schoolRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }))

    await waitFor(() => expect(screen.queryByText('Autoescuela Centro')).not.toBeInTheDocument())
  })

  it('shows an actionable list error state', async () => {
    server.use(http.get('/api/v1/auth/schools', () => HttpResponse.json({ detail: 'service_down' }, { status: 500 })))

    renderWithProviders(<AdminSchoolsDashboard accessToken="admin-token" />, undefined, { language: 'en' })

    expect(await screen.findByText('Could not load driving schools.')).toBeInTheDocument()
  })
})
