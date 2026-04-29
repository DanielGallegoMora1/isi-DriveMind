import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { BadgeCheck, KeyRound, UserPlus2, X } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../../../components/ui/button'
import { useCreateSchoolAdminStudent } from '../hooks/use-school-admin-students'
import type { SchoolAdminStudent } from '../types'

type CreateStudentModalProps = {
  accessToken: string | null
  onClose: () => void
  onStudentCreated: (student: SchoolAdminStudent) => void
}

type CreateStudentFormState = {
  full_name: string
  email: string
  phone: string
  permit: string
  enrollment_date: string
}

const initialFormState: CreateStudentFormState = {
  full_name: '',
  email: '',
  phone: '',
  permit: 'B',
  enrollment_date: '',
}

export function CreateStudentModal({ accessToken, onClose, onStudentCreated }: CreateStudentModalProps) {
  const [form, setForm] = useState<CreateStudentFormState>(initialFormState)
  const [showSuccessState, setShowSuccessState] = useState(false)
  const createStudentMutation = useCreateSchoolAdminStudent(accessToken)

  const emailError = getEmailError(form.email)
  const phoneError = getPhoneError(form.phone)
  const isFormValid = form.full_name.trim().length > 0 && form.email.trim().length > 0 && !emailError && !phoneError

  const successDescription = useMemo(() => {
    if (!showSuccessState) {
      return null
    }

    return `${form.full_name.trim()} ya puede ingresar con las credenciales automáticas enviadas a ${form.email.trim()}.`
  }, [form.email, form.full_name, showSuccessState])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isFormValid) {
      return
    }

    try {
      const response = await createStudentMutation.mutateAsync({
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        licenses: [form.permit],
        password: generateTemporaryPassword(),
      })

      onStudentCreated({
        ...response.student,
        created_at: response.student.created_at ?? toEnrollmentTimestamp(form.enrollment_date),
        licenses: response.student.licenses ?? [form.permit],
        phone: form.phone.trim() || null,
      })
      setShowSuccessState(true)
    } catch {
      // Error state is rendered in the modal while preserving form values.
    }
  }

  const isPending = createStudentMutation.isPending

  return (
    <div
      aria-labelledby="create-student-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.58)] px-4 py-6 backdrop-blur-[3px] transition-opacity duration-300"
      data-testid="new-student-backdrop"
      onClick={() => {
        if (!isPending) {
          onClose()
        }
      }}
      role="dialog"
    >
      <div
        className="w-full max-w-2xl rounded-[30px] border border-white/70 bg-white p-6 shadow-[0_32px_90px_-30px_rgba(15,23,42,0.48)] transition-all duration-300 md:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2453D0] shadow-[0_16px_30px_-18px_rgba(36,83,208,0.55)]">
              <UserPlus2 className="size-6" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="m-0 text-2xl font-semibold text-[#16324F]" id="create-student-modal-title">Nuevo alumno</h2>
              <p className="mt-1 mb-0 text-sm leading-6 text-[#64748B]">
                Creá un alta rápida y dejá listas las credenciales iniciales para que el alumno empiece a practicar.
              </p>
            </div>
          </div>

          <button
            aria-label="Cerrar modal de nuevo alumno"
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#DBE4EE] bg-white text-[#5F7287] transition-colors hover:bg-[#F5F8FB] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            onClick={onClose}
            type="button"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mb-6 rounded-[24px] border border-[#D7E7FF] bg-[linear-gradient(135deg,#F7FAFF_0%,#EEF4FF_100%)] p-4 text-[#21466F]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2453D0] shadow-[0_12px_24px_-18px_rgba(36,83,208,0.6)]">
              <KeyRound className="size-4.5" strokeWidth={1.9} />
            </span>
            <div>
              <p className="m-0 text-sm font-semibold">Credenciales automáticas</p>
              <p className="mt-1 mb-0 text-sm leading-6 text-[#4E6A88]">
                DriveMind genera la clave temporal automáticamente. En este flujo frontend, teléfono y fecha de alta se usan solo para visibilidad.
              </p>
            </div>
          </div>
        </div>

        {showSuccessState ? (
          <div className="grid gap-4 rounded-[26px] border border-[#D8F0E3] bg-[#F3FBF7] p-5 text-[#1F5E44]">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-white text-[#2E7D5B] shadow-[0_14px_26px_-18px_rgba(46,125,91,0.55)]">
                <BadgeCheck className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="m-0 text-lg font-semibold">Alumno creado con éxito.</p>
                <p className="mt-1 mb-0 text-sm leading-6 text-[#47705D]">{successDescription}</p>
              </div>
            </div>

            <dl className="grid gap-3 rounded-[22px] border border-[#DCEFE5] bg-white/80 p-4 text-sm md:grid-cols-3">
              <SummaryItem label="Permiso asignado" value={form.permit} />
              <SummaryItem label="Teléfono" value={form.phone.trim() || 'Sin informar'} />
              <SummaryItem label="Fecha de alta" value={formatEnrollmentDate(form.enrollment_date)} />
            </dl>
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Nombre completo">
                <input
                  aria-label="Nombre completo"
                  required
                  className="min-h-12 rounded-2xl border border-[#D7E0EA] px-4 text-sm text-[#16324F] outline-none transition-all duration-200 focus:border-[#2C5F8A] focus:shadow-[0_0_0_4px_rgba(36,83,208,0.08)]"
                  onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                  value={form.full_name}
                />
              </Field>

              <Field error={emailError} label="Email">
                <input
                  aria-label="Email"
                  required
                  className={getInputClassName(Boolean(emailError))}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  type="email"
                  value={form.email}
                />
              </Field>

              <Field error={phoneError} label="Teléfono" optionalLabel="Opcional">
                <input
                  aria-label="Teléfono"
                  className={getInputClassName(Boolean(phoneError))}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="+34 600 123 123"
                  value={form.phone}
                />
              </Field>

              <Field label="Permiso">
                <select
                  aria-label="Permiso"
                  className="min-h-12 rounded-2xl border border-[#D7E0EA] px-4 text-sm text-[#16324F] outline-none transition-all duration-200 focus:border-[#2C5F8A] focus:shadow-[0_0_0_4px_rgba(36,83,208,0.08)]"
                  onChange={(event) => setForm((current) => ({ ...current, permit: event.target.value }))}
                  value={form.permit}
                >
                  {['B', 'A1', 'A2', 'AM', 'C', 'D'].map((permit) => (
                    <option key={permit} value={permit}>{permit}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Fecha de alta">
              <input
                aria-label="Fecha de alta"
                className="min-h-12 rounded-2xl border border-[#D7E0EA] px-4 text-sm text-[#16324F] outline-none transition-all duration-200 focus:border-[#2C5F8A] focus:shadow-[0_0_0_4px_rgba(36,83,208,0.08)]"
                onChange={(event) => setForm((current) => ({ ...current, enrollment_date: event.target.value }))}
                type="date"
                value={form.enrollment_date}
              />
            </Field>

            {createStudentMutation.isError ? (
              <p className="m-0 text-sm font-semibold text-[#C94B59]">
                No se pudo crear el alumno. Revisá los datos e intentá de nuevo.
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button disabled={isPending} onClick={onClose} type="button" variant="secondary">
                Cancelar
              </Button>
              <Button disabled={!isFormValid || isPending} type="submit">
                {isPending ? 'Creando alumno...' : 'Crear alumno'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({
  children,
  error,
  label,
  optionalLabel,
}: {
  children: ReactNode
  error?: string | null
  label: string
  optionalLabel?: string
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#16324F]">
      <span className="inline-flex items-center gap-2">
        {label}
        {optionalLabel ? <span className="text-xs font-medium text-[#7A8CA4]">{optionalLabel}</span> : null}
      </span>
      {children}
      {error ? <span className="text-sm font-medium text-[#C94B59]">{error}</span> : null}
    </label>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-[0.1em] uppercase text-[#6C8A78]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#214E39]">{value}</dd>
    </div>
  )
}

function getInputClassName(hasError: boolean) {
  return clsx(
    'min-h-12 rounded-2xl border px-4 text-sm text-[#16324F] outline-none transition-all duration-200 focus:shadow-[0_0_0_4px_rgba(36,83,208,0.08)]',
    hasError
      ? 'border-[#E29AA4] bg-[#FFF7F8] focus:border-[#C94B59]'
      : 'border-[#D7E0EA] focus:border-[#2C5F8A]',
  )
}

function getEmailError(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue) ? null : 'Ingresá un email válido.'
}

function getPhoneError(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  return /^[+]?[(]?[0-9\s-]{7,20}$/.test(trimmedValue) ? null : 'Ingresá un teléfono válido.'
}

function generateTemporaryPassword() {
  return `DriveMind!${Math.random().toString(36).slice(2, 10)}A1`
}

function toEnrollmentTimestamp(value: string) {
  if (!value) {
    return new Date().toISOString()
  }

  return new Date(`${value}T09:00:00Z`).toISOString()
}

function formatEnrollmentDate(value: string) {
  if (!value) {
    return 'Hoy'
  }

  const date = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha pendiente'
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
