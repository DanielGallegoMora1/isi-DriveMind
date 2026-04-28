import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import { useI18n } from '../../i18n'
import { useCreateSchool, useDeleteSchool, useSchools } from '../hooks/use-admin-schools'
import type { CreateSchoolInput, School } from '../types'

type AdminSchoolsDashboardProps = {
  accessToken: string | null
}

const initialForm: CreateSchoolInput = {
  name: '',
  email: '',
  password: '',
  tax_id: '',
  address: '',
  phone: '',
}

export function AdminSchoolsDashboard({ accessToken }: AdminSchoolsDashboardProps) {
  const { language } = useI18n()
  const copy = getCopy(language)
  const [nameInput, setNameInput] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [form, setForm] = useState<CreateSchoolInput>(initialForm)
  const [schoolPendingDelete, setSchoolPendingDelete] = useState<School | null>(null)
  const filters = useMemo(() => ({ active: true, name: nameFilter || undefined, limit: 20, offset: 0 }), [nameFilter])
  const schoolsQuery = useSchools(accessToken, filters)
  const createSchoolMutation = useCreateSchool(accessToken)
  const deleteSchoolMutation = useDeleteSchool(accessToken)

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNameFilter(nameInput.trim())
  }

  async function submitCreateSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input: CreateSchoolInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      tax_id: form.tax_id?.trim() || undefined,
      address: form.address?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
    }

    try {
      await createSchoolMutation.mutateAsync(input)
      setForm(initialForm)
    } catch {
      // The mutation state renders a user-facing error without clearing the form.
    }
  }

  async function confirmDeleteSchool() {
    if (!schoolPendingDelete) {
      return
    }

    try {
      await deleteSchoolMutation.mutateAsync(schoolPendingDelete.id)
      setSchoolPendingDelete(null)
    } catch {
      // The mutation state renders a user-facing error and keeps the confirmation open.
    }
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-2">
        <p className="m-0 text-[0.78rem] font-bold tracking-[0.18em] uppercase text-[#2C5F8A]">{copy.kicker}</p>
        <h2 className="m-0 text-3xl text-[#1E3A5F] md:text-4xl">{copy.title}</h2>
        <p className="m-0 max-w-3xl text-[#5f7287]">{copy.description}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="grid content-start gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="m-0 text-xl text-[#1E3A5F]">{copy.listTitle}</h3>
              <p className="m-0 mt-1 text-sm text-[#5f7287]">{copy.listDescription}</p>
            </div>
            <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submitFilters}>
              <label className="grid gap-1 text-sm font-semibold text-[#1E3A5F]">
                {copy.searchLabel}
                <input
                  className="min-h-11 rounded-2xl border border-[#d7e0ea] bg-white px-4 text-sm text-[#1E3A5F] outline-none focus:border-[#2C5F8A]"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                />
              </label>
              <Button type="submit" variant="secondary">{copy.applyFilters}</Button>
            </form>
          </div>

          {schoolsQuery.isLoading && (
            <div className="flex min-h-48 items-center justify-center">
              <Spinner />
            </div>
          )}

          {schoolsQuery.isError && (
            <EmptyState
              title={copy.listErrorTitle}
              description={copy.listErrorDescription}
              action={<Button type="button" onClick={() => void schoolsQuery.refetch()}>{copy.retry}</Button>}
            />
          )}

          {schoolsQuery.isSuccess && schoolsQuery.data.items.length === 0 && (
            <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
          )}

          {schoolsQuery.isSuccess && schoolsQuery.data.items.length > 0 && (
            <div className="overflow-hidden rounded-[22px] border border-[#d7e0ea]">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-[#edf3f8] text-xs uppercase tracking-[0.12em] text-[#5f7287]">
                  <tr>
                    <th className="px-4 py-3">{copy.schoolColumn}</th>
                    <th className="px-4 py-3">{copy.emailColumn}</th>
                    <th className="px-4 py-3">{copy.statusColumn}</th>
                    <th className="px-4 py-3 text-right">{copy.actionsColumn}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3ebf2] bg-white">
                  {schoolsQuery.data.items.map((school) => (
                    <tr key={school.id}>
                      <td className="px-4 py-4">
                        <p className="m-0 font-semibold text-[#1E3A5F]">{school.name}</p>
                        {school.address && <p className="m-0 mt-1 text-xs text-[#5f7287]">{school.address}</p>}
                      </td>
                      <td className="px-4 py-4 text-[#5f7287]">{school.email}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[rgba(46,125,91,0.12)] px-3 py-1 text-xs font-semibold text-[#2E7D5B]">
                          {copy.activeStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          className="min-h-10 px-4 py-2"
                          type="button"
                          variant="secondary"
                          onClick={() => setSchoolPendingDelete(school)}
                        >
                          {copy.deleteSchool}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="h-fit">
          <h3 className="m-0 text-xl text-[#1E3A5F]">{copy.createTitle}</h3>
          <p className="m-0 mt-1 text-sm text-[#5f7287]">{copy.createDescription}</p>

          <form className="mt-5 grid gap-4" onSubmit={submitCreateSchool}>
            <label className="grid gap-1 text-sm font-semibold text-[#1E3A5F]">
              {copy.schoolName}
              <input
                required
                className="min-h-11 rounded-2xl border border-[#d7e0ea] px-4 text-sm outline-none focus:border-[#2C5F8A]"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#1E3A5F]">
              {copy.adminEmail}
              <input
                required
                className="min-h-11 rounded-2xl border border-[#d7e0ea] px-4 text-sm outline-none focus:border-[#2C5F8A]"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#1E3A5F]">
              {copy.adminPassword}
              <input
                required
                className="min-h-11 rounded-2xl border border-[#d7e0ea] px-4 text-sm outline-none focus:border-[#2C5F8A]"
                minLength={8}
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>

            {createSchoolMutation.isError && <p className="m-0 text-sm font-semibold text-[#c94b59]">{copy.createError}</p>}

            <Button disabled={createSchoolMutation.isPending} type="submit">
              {createSchoolMutation.isPending ? copy.creating : copy.createButton}
            </Button>
          </form>
        </Card>
      </div>

      {schoolPendingDelete && (
        <div className="rounded-[24px] border border-[#efc5cb] bg-[#fff7f8] p-5 shadow-[0_20px_45px_-28px_rgba(201,75,89,0.4)]" role="alertdialog" aria-modal="true" aria-labelledby="delete-school-title">
          <h3 className="m-0 text-lg text-[#8c2d38]" id="delete-school-title">{copy.confirmTitle}</h3>
          <p className="m-0 mt-2 text-sm text-[#7b4d53]">{copy.confirmDescription(schoolPendingDelete.name)}</p>
          {deleteSchoolMutation.isError && <p className="m-0 mt-3 text-sm font-semibold text-[#c94b59]">{copy.deleteError}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={deleteSchoolMutation.isPending} type="button" onClick={() => void confirmDeleteSchool()}>
              {copy.confirmDelete}
            </Button>
            <Button disabled={deleteSchoolMutation.isPending} type="button" variant="secondary" onClick={() => setSchoolPendingDelete(null)}>
              {copy.cancel}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function getCopy(language: 'es' | 'en') {
  if (language === 'en') {
    return {
      kicker: 'System administration',
      title: 'Driving schools',
      description: 'Create, review, filter, and deactivate the driving schools registered in DriveMind.',
      listTitle: 'Registered schools',
      listDescription: 'Only active schools are shown by default.',
      searchLabel: 'Search by name',
      applyFilters: 'Apply filters',
      listErrorTitle: 'Could not load driving schools.',
      listErrorDescription: 'Please retry or check the authentication service.',
      retry: 'Retry',
      emptyTitle: 'No driving schools found.',
      emptyDescription: 'Adjust the filters or create a new school.',
      schoolColumn: 'School',
      emailColumn: 'Admin email',
      statusColumn: 'Status',
      actionsColumn: 'Actions',
      activeStatus: 'Active',
      deleteSchool: `Delete`,
      createTitle: 'Add driving school',
      createDescription: 'Create the school and its administrator account in one step.',
      schoolName: 'School name',
      adminEmail: 'Admin email',
      adminPassword: 'Admin password',
      createError: 'Could not create the driving school.',
      creating: 'Creating...',
      createButton: 'Create school',
      confirmTitle: 'Deactivate driving school',
      confirmDescription: (name: string) => `This will deactivate ${name} and its non-system users.`,
      confirmDelete: 'Confirm delete',
      cancel: 'Cancel',
      deleteError: 'Could not delete the driving school.',
    }
  }

  return {
    kicker: 'Administración del sistema',
    title: 'Autoescuelas',
    description: 'Crea, revisa, filtra y desactiva las autoescuelas registradas en DriveMind.',
    listTitle: 'Autoescuelas registradas',
    listDescription: 'Por defecto solo se muestran autoescuelas activas.',
    searchLabel: 'Buscar por nombre',
    applyFilters: 'Aplicar filtros',
    listErrorTitle: 'No se pudieron cargar las autoescuelas.',
    listErrorDescription: 'Reinténtalo o comprueba el servicio de autenticación.',
    retry: 'Reintentar',
    emptyTitle: 'No se encontraron autoescuelas.',
    emptyDescription: 'Ajusta los filtros o crea una autoescuela nueva.',
    schoolColumn: 'Autoescuela',
    emailColumn: 'Email admin',
    statusColumn: 'Estado',
    actionsColumn: 'Acciones',
    activeStatus: 'Activa',
    deleteSchool: `Eliminar`,
    createTitle: 'Añadir autoescuela',
    createDescription: 'Crea la autoescuela y su cuenta administradora en un paso.',
    schoolName: 'Nombre de la autoescuela',
    adminEmail: 'Email admin',
    adminPassword: 'Contraseña admin',
    createError: 'No se pudo crear la autoescuela.',
    creating: 'Creando...',
    createButton: 'Crear autoescuela',
    confirmTitle: 'Desactivar autoescuela',
    confirmDescription: (name: string) => `Se desactivará ${name} y sus usuarios no sistémicos.`,
    confirmDelete: 'Confirmar eliminación',
    cancel: 'Cancelar',
    deleteError: 'No se pudo eliminar la autoescuela.',
  }
}
