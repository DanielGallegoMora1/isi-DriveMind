import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import {
  BadgePlus,
  BookOpenCheck,
  Eye,
  Filter,
  Mail,
  Phone,
  Search,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import { CreateStudentModal } from './create-student-modal'
import { StudentOverviewModal } from './student-overview-modal'
import { useSchoolAdminStudents } from '../hooks/use-school-admin-students'
import type { SchoolAdminStudent } from '../types'
import {
  formatAverageScore,
  formatJoinedDate,
  formatLastActivity,
  formatTestsCompleted,
  getStudentInitials,
  getStudentLicenseCodes,
} from './student-overview-utils'

type SchoolAdminStudentsDashboardProps = {
  accessToken: string | null
}

type ServerFilterState = 'all' | 'active' | 'inactive'

type KpiCard = {
  title: string
  value: string
  detail: string
  icon: typeof Users
}

const KPI_STYLES = [
  {
    accent: 'text-[#2453D0]',
    background: 'bg-[#EEF4FF]',
    ring: 'ring-[#D6E4FF]',
  },
  {
    accent: 'text-[#2E7D5B]',
    background: 'bg-[#ECF8F2]',
    ring: 'ring-[#D7F0E4]',
  },
  {
    accent: 'text-[#7C3AED]',
    background: 'bg-[#F3EEFF]',
    ring: 'ring-[#E6DAFF]',
  },
  {
    accent: 'text-[#DD8A17]',
    background: 'bg-[#FFF4E7]',
    ring: 'ring-[#FFE5BF]',
  },
] as const

export function SchoolAdminStudentsDashboard({ accessToken }: SchoolAdminStudentsDashboardProps) {
  const [searchValue, setSearchValue] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isCreateStudentModalOpen, setIsCreateStudentModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<SchoolAdminStudent | null>(null)
  const [activeFilter, setActiveFilter] = useState<ServerFilterState>('all')
  const [licenseFilter, setLicenseFilter] = useState<string>('all')
  const [frontendCreatedStudents, setFrontendCreatedStudents] = useState<SchoolAdminStudent[]>([])
  const filters = useMemo(
    () => ({
      active: activeFilter === 'all' ? undefined : activeFilter === 'active',
      license: licenseFilter === 'all' ? undefined : licenseFilter,
      limit: 100,
      offset: 0,
    }),
    [activeFilter, licenseFilter],
  )
  const studentsQuery = useSchoolAdminStudents(accessToken, filters)

  const students = useMemo(() => {
    const mergedStudents = new Map<string, SchoolAdminStudent>()

    ;(studentsQuery.data?.items ?? []).forEach((student) => {
      mergedStudents.set(student.id, student)
    })

    frontendCreatedStudents.forEach((student) => {
      const existingStudent = mergedStudents.get(student.id)
      mergedStudents.set(student.id, existingStudent ? { ...existingStudent, ...student } : student)
    })

    return Array.from(mergedStudents.values())
  }, [frontendCreatedStudents, studentsQuery.data?.items])
  const normalizedSearch = searchValue.trim().toLowerCase()
  const visibleStudents = useMemo(() => {
    if (!normalizedSearch) {
      return students
    }

    return students.filter((student) => {
      const searchableText = `${student.full_name} ${student.email}`.toLowerCase()
      return searchableText.includes(normalizedSearch)
    })
  }, [normalizedSearch, students])

  const availableLicenses = useMemo(() => {
    const licenseSet = new Set<string>()

    students.forEach((student) => {
      getStudentLicenseCodes(student).forEach((license) => licenseSet.add(license))
    })

    return Array.from(licenseSet).sort((left, right) => left.localeCompare(right))
  }, [students])

  const summaryCards = useMemo<KpiCard[]>(() => {
    const totalStudents = studentsQuery.data?.total ?? students.length
    const activeStudents = students.filter((student) => student.active).length
    const studentsWithPassRate = students.filter((student) => typeof student.pass_rate_pct === 'number')
    const averagePassRate = studentsWithPassRate.length > 0
      ? Math.round(
          studentsWithPassRate.reduce((total, student) => total + Number(student.pass_rate_pct ?? 0), 0) /
            studentsWithPassRate.length,
        )
      : totalStudents > 0
        ? Math.round((activeStudents / totalStudents) * 100)
        : 0
    const testsThisWeek = students.reduce(
      (total, student) => total + Number(student.tests_this_week ?? 0),
      0,
    )

    return [
      {
        title: 'Alumnos totales',
        value: String(totalStudents),
        detail: 'Base actual de estudiantes vinculados a tu autoescuela.',
        icon: Users,
      },
      {
        title: 'Alumnos activos',
        value: String(activeStudents),
        detail: 'Cuentas listas para practicar y seguir avanzando hoy.',
        icon: UserCheck,
      },
      {
        title: 'Tasa promedio aprobados',
        value: `${averagePassRate}%`,
        detail: studentsWithPassRate.length > 0
          ? 'Promedio calculado con las métricas disponibles del alumnado.'
          : 'Estimación temporal mientras llegan métricas más completas del backend.',
        icon: Sparkles,
      },
      {
        title: 'Tests esta semana',
        value: String(testsThisWeek),
        detail: testsThisWeek > 0
          ? 'Actividad semanal agregada a partir de los datos recibidos.'
          : 'Sin agregado semanal disponible todavía en el servicio de autenticación.',
        icon: BookOpenCheck,
      },
    ]
  }, [students, studentsQuery.data?.total])

  return (
    <section className="grid gap-6 lg:gap-8">
      <header className="grid gap-2">
        <h1 className="m-0 text-3xl font-semibold tracking-[-0.03em] text-[#16324F] md:text-[2.35rem]">
          Gestión de alumnos
        </h1>
        <p className="m-0 max-w-3xl text-sm leading-7 text-[#64748B] md:text-base">
          Administra y supervisa el progreso de tus estudiantes
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-4">
        {summaryCards.map((card, index) => {
          const style = KPI_STYLES[index]
          const Icon = card.icon

          return (
            <Card className="relative overflow-hidden p-5" key={card.title}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-white via-white to-transparent" />
              <div className="flex items-start justify-between gap-4">
                <div className={clsx('flex size-12 items-center justify-center rounded-full ring-1', style.background, style.accent, style.ring)}>
                  <Icon className="size-5" strokeWidth={1.9} />
                </div>
                <span className={clsx('rounded-full px-2.5 py-1 text-[0.7rem] font-semibold tracking-[0.12em] uppercase', style.background, style.accent)}>
                  {card.title}
                </span>
              </div>
              <p className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-[#16324F]">{card.value}</p>
              <p className="m-0 text-sm leading-6 text-[#64748B]">{card.detail}</p>
            </Card>
          )
        })}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[#E2E8F0] px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative block xl:max-w-[34rem] xl:flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#7A8CA4]" strokeWidth={1.9} />
              <input
                aria-label="Buscar alumnos"
                className="min-h-[52px] w-full rounded-2xl border border-[#D7E0EA] bg-[#F8FAFC] pl-12 pr-4 text-sm text-[#16324F] outline-none transition-all duration-200 placeholder:text-[#8CA0B6] focus:border-[#2C5F8A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(36,83,208,0.08)]"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Buscar por nombre o email..."
                value={searchValue}
              />
            </label>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                className="min-h-12 rounded-2xl border border-[#D7E0EA] bg-white px-4 text-[#1E3A5F] shadow-none hover:border-[#C4D2E0] hover:bg-[#F8FAFC]"
                onClick={() => setIsFiltersOpen((current) => !current)}
                type="button"
                variant="secondary"
              >
                <span className="inline-flex items-center gap-2">
                  <Filter className="size-4" strokeWidth={1.9} />
                  Filtros
                </span>
              </Button>
              <Button className="min-h-12 rounded-2xl px-4" onClick={() => setIsCreateStudentModalOpen(true)} type="button">
                <span className="inline-flex items-center gap-2">
                  <BadgePlus className="size-4" strokeWidth={1.9} />
                  Nuevo alumno
                </span>
              </Button>
            </div>
          </div>

          {isFiltersOpen && (
            <div className="mt-4 grid gap-4 rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:grid-cols-2">
              <div className="grid gap-2">
                <p className="m-0 text-xs font-semibold tracking-[0.14em] uppercase text-[#64748B]">Estado</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Solo activos' },
                    { value: 'inactive', label: 'Solo inactivos' },
                  ].map((option) => (
                    <FilterChip
                      isActive={activeFilter === option.value}
                      key={option.value}
                      label={option.label}
                      onClick={() => setActiveFilter(option.value as ServerFilterState)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <p className="m-0 text-xs font-semibold tracking-[0.14em] uppercase text-[#64748B]">Permiso</p>
                <div className="flex flex-wrap gap-2">
                  <FilterChip isActive={licenseFilter === 'all'} label="Todos" onClick={() => setLicenseFilter('all')} />
                  {availableLicenses.map((license) => (
                    <FilterChip
                      isActive={licenseFilter === license}
                      key={license}
                      label={license}
                      onClick={() => setLicenseFilter(license)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-5 md:px-6 md:py-6">
          {studentsQuery.isLoading && (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner />
            </div>
          )}

          {studentsQuery.isError && (
            <EmptyState
              action={<Button onClick={() => void studentsQuery.refetch()} type="button">Reintentar</Button>}
              description="No pudimos sincronizar el listado con auth-service. Probá de nuevo en unos segundos."
              title="No se pudieron cargar los alumnos."
            />
          )}

          {studentsQuery.isSuccess && students.length === 0 && (
            <EmptyState
              description="Todavía no hay alumnos registrados en esta autoescuela. Cuando existan, aparecerán aquí con su progreso."
              title="Aún no tenés alumnos cargados."
            />
          )}

          {studentsQuery.isSuccess && students.length > 0 && visibleStudents.length === 0 && (
            <EmptyState
              description="Probá con otro nombre, email o quitá algunos filtros para volver a ver resultados."
              title="No encontramos alumnos con esa búsqueda."
            />
          )}

          {studentsQuery.isSuccess && visibleStudents.length > 0 && (
            <>
              <div className="hidden overflow-hidden rounded-[24px] border border-[#E2E8F0] lg:block">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-[#F8FAFC] text-xs font-semibold tracking-[0.12em] uppercase text-[#64748B]">
                    <tr>
                      <th className="px-5 py-4">Alumno</th>
                      <th className="px-5 py-4">Contacto</th>
                      <th className="px-5 py-4">Permiso</th>
                      <th className="px-5 py-4">Tests realizados</th>
                      <th className="px-5 py-4">Tasa aprobados</th>
                      <th className="px-5 py-4">Nota media</th>
                      <th className="px-5 py-4">Última actividad</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-[#EAF0F5] bg-white">
                      {visibleStudents.map((student) => (
                        <StudentTableRow key={student.id} onPreview={setSelectedStudent} student={student} />
                      ))}
                    </tbody>
                  </table>
                </div>

              <div className="grid gap-4 lg:hidden">
                {visibleStudents.map((student) => (
                  <StudentMobileCard key={student.id} onPreview={setSelectedStudent} student={student} />
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      {isCreateStudentModalOpen ? (
        <CreateStudentModal
          accessToken={accessToken}
          onClose={() => setIsCreateStudentModalOpen(false)}
          onStudentCreated={(student) => {
            setFrontendCreatedStudents((current) => [student, ...current.filter((item) => item.id !== student.id)])
          }}
        />
      ) : null}

      {selectedStudent ? <StudentOverviewModal onClose={() => setSelectedStudent(null)} student={selectedStudent} /> : null}
    </section>
  )
}

function FilterChip({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      className={clsx(
        'rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'border-[#2453D0] bg-[#EEF4FF] text-[#2453D0] shadow-[0_10px_25px_-20px_rgba(36,83,208,0.7)]'
          : 'border-[#D7E0EA] bg-white text-[#516579] hover:border-[#C7D5E2] hover:bg-[#F8FAFC]',
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function StudentTableRow({ student, onPreview }: { student: SchoolAdminStudent; onPreview: (student: SchoolAdminStudent) => void }) {
  return (
    <tr className="transition-colors duration-200 hover:bg-[#F8FAFC]">
      <td className="px-5 py-4">
        <StudentIdentity student={student} />
      </td>
      <td className="px-5 py-4">
        <StudentContact student={student} />
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {getStudentLicenseCodes(student).map((license) => (
            <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2453D0]" key={license}>
              {license}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-4 font-medium text-[#16324F]">{formatTestsCompleted(student.tests_completed)}</td>
      <td className="px-5 py-4">
        <StudentPassRate student={student} />
      </td>
      <td className="px-5 py-4 font-medium text-[#16324F]">{formatAverageScore(student.average_score)}</td>
      <td className="px-5 py-4 text-[#516579]">{formatLastActivity(student)}</td>
      <td className="px-5 py-4 text-right">
        <PreviewStudentButton onClick={() => onPreview(student)} studentName={student.full_name} />
      </td>
    </tr>
  )
}

function StudentMobileCard({ student, onPreview }: { student: SchoolAdminStudent; onPreview: (student: SchoolAdminStudent) => void }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <StudentIdentity student={student} />
        <PreviewStudentButton onClick={() => onPreview(student)} studentName={student.full_name} />
      </div>

      <StudentContact student={student} />

      <div className="flex flex-wrap gap-2">
        {getStudentLicenseCodes(student).map((license) => (
          <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2453D0]" key={license}>
            {license}
          </span>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MobileMetric label="Tests realizados" value={formatTestsCompleted(student.tests_completed)} />
        <MobileMetric label="Nota media" value={formatAverageScore(student.average_score)} />
        <MobileMetric label="Última actividad" value={formatLastActivity(student)} />
      </div>

      <StudentPassRate student={student} />
    </Card>
  )
}

function PreviewStudentButton({ studentName, onClick }: { studentName: string; onClick: () => void }) {
  return (
    <button
      aria-label={`Ver alumno ${studentName}`}
      className="group inline-flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-[#CFE0F3] bg-[#F3F8FF] text-[#2453D0] shadow-[0_10px_24px_-18px_rgba(36,83,208,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2453D0] hover:bg-[#EAF2FF] hover:shadow-[0_18px_32px_-18px_rgba(36,83,208,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D9E7FF] active:translate-y-0 active:scale-[0.98]"
      onClick={onClick}
      title={`Ver detalle de ${studentName}`}
      type="button"
    >
      <Eye className="size-[1.05rem] transition-transform duration-200 group-hover:scale-110" strokeWidth={2.1} />
    </button>
  )
}

function StudentIdentity({ student }: { student: SchoolAdminStudent }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#16324F] text-sm font-semibold text-white">
        {getStudentInitials(student.full_name)}
      </div>
      <div>
        <p className="m-0 font-semibold text-[#16324F]">{student.full_name}</p>
        <p className="m-0 text-xs text-[#7A8CA4]">Desde {formatJoinedDate(student.created_at)}</p>
      </div>
    </div>
  )
}

function StudentContact({ student }: { student: SchoolAdminStudent }) {
  return (
    <div className="grid gap-2 text-sm text-[#516579]">
      <div className="inline-flex items-center gap-2">
        <Mail className="size-4 text-[#7A8CA4]" strokeWidth={1.8} />
        <span>{student.email}</span>
      </div>
      <div className="inline-flex items-center gap-2">
        <Phone className="size-4 text-[#7A8CA4]" strokeWidth={1.8} />
        <span>{student.phone?.trim() || 'Sin teléfono registrado'}</span>
      </div>
    </div>
  )
}

function StudentPassRate({ student }: { student: SchoolAdminStudent }) {
  const value = Math.max(0, Math.min(100, Math.round(Number(student.pass_rate_pct ?? 0))))

  return (
    <div className="grid gap-2">
      <div className="h-2.5 overflow-hidden rounded-full bg-[#EAF3EE]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2E7D5B] to-[#4BB17B] transition-[width] duration-700 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-medium text-[#2E7D5B]">{value}%</span>
    </div>
  )
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-3">
      <p className="m-0 text-xs font-semibold tracking-[0.08em] uppercase text-[#7A8CA4]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#16324F]">{value}</p>
    </div>
  )
}
