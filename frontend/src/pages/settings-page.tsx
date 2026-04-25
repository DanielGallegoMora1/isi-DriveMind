import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Lock,
  LogOut,
  LoaderCircle,
  Mail,
  Palette,
  Phone,
  Shield,
  Sparkles,
  UserRound,
  Volume2,
  X,
} from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { useAuth } from '../features/auth'
import { ApiError } from '../lib/http'

const MIN_PASSWORD_LENGTH = 8

type PasswordFormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type PasswordFormErrors = Partial<Record<keyof PasswordFormValues, string>>

type ToggleRowProps = {
  title: string
  description: string
  checked: boolean
  onToggle: () => void
  accent?: 'green' | 'purple' | 'orange' | 'blue'
}

type ActionRowProps = {
  icon: ReactNode
  title: string
  description?: string
  accent?: string
  value?: string
  onClick?: () => void
}

type DetailItemProps = {
  icon: ReactNode
  label: string
  value: string
}

const accentStyles = {
  blue: {
    badge: 'bg-[#e9f2ff] text-[#2453d0]',
    icon: 'bg-[#edf4ff] text-[#2453d0]',
    toggle: 'bg-[#2453d0]',
  },
  green: {
    badge: 'bg-[#ebf8f2] text-[#2e7d5b]',
    icon: 'bg-[#ecf8f2] text-[#2e7d5b]',
    toggle: 'bg-[#2e7d5b]',
  },
  purple: {
    badge: 'bg-[#f1ebff] text-[#7c3aed]',
    icon: 'bg-[#f3eeff] text-[#7c3aed]',
    toggle: 'bg-[#7c3aed]',
  },
  orange: {
    badge: 'bg-[#fff2e5] text-[#dd8a17]',
    icon: 'bg-[#fff4ea] text-[#dd8a17]',
    toggle: 'bg-[#dd8a17]',
  },
  gray: {
    badge: 'bg-[#eef2f6] text-[#5f7287]',
    icon: 'bg-[#f3f6f9] text-[#5f7287]',
    toggle: 'bg-[#8aa0b8]',
  },
} as const

export function SettingsPage() {
  const { changePassword, logout, user } = useAuth()
  const navigate = useNavigate()
  const [pushNotifications, setPushNotifications] = useState(true)
  const [dailyReminders, setDailyReminders] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordValues, setPasswordValues] = useState<PasswordFormValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({})
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(null)
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null)
  const [passwordVisibility, setPasswordVisibility] = useState<Record<keyof PasswordFormValues, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })

  const profile = useMemo(() => {
    const fullName = user?.full_name?.trim() || 'Estudiante DriveMind'
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('')

    return {
      fullName,
      initials: initials || 'DM',
      role: formatRole(user?.role),
      membership: user?.is_active ? 'Membresía activa' : 'Cuenta pendiente',
      email: user?.email || 'Sin email disponible',
      phone: 'Sin teléfono añadido aún',
      school: user?.school_id ? `Centro vinculado · ${user.school_id}` : 'Centro pendiente de asignación',
    }
  }, [user])

  useEffect(() => {
    if (!isPasswordModalOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmittingPassword) {
        closePasswordModal()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isPasswordModalOpen, isSubmittingPassword])

  function openPasswordModal() {
    setPasswordSubmitError(null)
    setPasswordSuccessMessage(null)
    setPasswordErrors({})
    setPasswordValues({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setPasswordVisibility({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    })
    setIsPasswordModalOpen(true)
  }

  function closePasswordModal() {
    setIsPasswordModalOpen(false)
    setIsSubmittingPassword(false)
    setPasswordSubmitError(null)
    setPasswordSuccessMessage(null)
    setPasswordErrors({})
  }

  function updatePasswordField(field: keyof PasswordFormValues, value: string) {
    setPasswordValues((currentValues) => ({ ...currentValues, [field]: value }))
    setPasswordErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    setPasswordSubmitError(null)
  }

  function validatePasswordForm(values: PasswordFormValues) {
    const errors: PasswordFormErrors = {}

    if (!values.currentPassword.trim()) {
      errors.currentPassword = 'Ingresá tu contraseña actual.'
    }

    if (!values.newPassword) {
      errors.newPassword = 'Ingresá una nueva contraseña.'
    } else if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    } else if (values.newPassword === values.currentPassword) {
      errors.newPassword = 'La nueva contraseña debe ser distinta de la actual.'
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = 'Confirmá la nueva contraseña.'
    } else if (values.confirmPassword !== values.newPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.'
    }

    return errors
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validatePasswordForm(passwordValues)
    setPasswordErrors(nextErrors)
    setPasswordSubmitError(null)
    setPasswordSuccessMessage(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmittingPassword(true)

    try {
      await changePassword({
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
      })

      setPasswordSuccessMessage('Contraseña actualizada correctamente.')

      window.setTimeout(() => {
        closePasswordModal()
      }, 900)
    } catch (error) {
      setPasswordSubmitError(resolvePasswordChangeErrorMessage(error))
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  function togglePasswordVisibility(field: keyof PasswordFormValues) {
    setPasswordVisibility((currentVisibility) => ({
      ...currentVisibility,
      [field]: !currentVisibility[field],
    }))
  }

  return (
    <>
      <section aria-hidden={isPasswordModalOpen} className="grid gap-6 text-[#1E3A5F]">
      <header className="flex flex-col gap-4 rounded-[30px] border border-[#dce5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,252,0.96))] p-6 shadow-[0_20px_45px_-30px_rgba(30,58,95,0.22)] md:flex-row md:items-start md:justify-between md:p-8">
        <div className="grid gap-2">
          <p className="m-0 text-sm font-semibold tracking-[0.16em] uppercase text-[#2C5F8A]">Configuración personal</p>
          <h1 className="m-0 text-[clamp(2rem,4vw,3rem)] leading-none">Ajustes</h1>
          <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
            Personaliza tu experiencia de estudio, revisa tus preferencias y encuentra accesos rápidos de soporte.
          </p>
        </div>

        <button
          aria-label="Abrir centro de notificaciones"
          className="inline-flex size-12 items-center justify-center rounded-full border border-[#dbe4ee] bg-white text-[#7c3aed] shadow-[0_16px_30px_-24px_rgba(124,58,237,0.4)] transition-transform duration-200 hover:-translate-y-0.5"
          type="button"
        >
          <Bell className="size-5" strokeWidth={1.9} />
        </button>
      </header>

      <Card as="section" className="grid gap-6 p-6 md:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)] md:p-7">
        <div className="grid gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex size-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2453d0,#5b7cff)] text-2xl font-semibold text-white shadow-[0_18px_36px_-24px_rgba(36,83,208,0.6)]">
                  {profile.initials}
                </div>
                <button
                  aria-label="Editar avatar"
                  className="absolute -right-1 -bottom-1 inline-flex size-8 items-center justify-center rounded-full border-4 border-white bg-[#1E3A5F] text-white shadow-[0_16px_24px_-16px_rgba(30,58,95,0.6)]"
                  type="button"
                >
                  <Camera className="size-4" strokeWidth={2} />
                </button>
              </div>

              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-2xl">{profile.fullName}</h2>
                  <Badge className="bg-[#eef4ff] text-[#2453d0]" label={profile.role} variant="default" />
                </div>
                <p className="m-0 text-sm text-[#5f7287]">{profile.membership}</p>
              </div>
            </div>

            <Button className="sm:w-auto" type="button" variant="secondary">
              Editar perfil
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <DetailItem icon={<Mail className="size-4" strokeWidth={1.9} />} label="Email" value={profile.email} />
            <DetailItem icon={<Phone className="size-4" strokeWidth={1.9} />} label="Teléfono" value={profile.phone} />
            <DetailItem icon={<UserRound className="size-4" strokeWidth={1.9} />} label="Autoescuela" value={profile.school} />
          </div>
        </div>

        <div className="grid gap-4 rounded-[24px] border border-[#e6edf4] bg-[#f8fbfe] p-5">
          <div className="flex items-center gap-3">
            <SoftIcon accent="blue">
              <Sparkles className="size-5" strokeWidth={1.9} />
            </SoftIcon>
            <div>
              <h3 className="m-0 text-lg">Tu espacio de estudio</h3>
              <p className="m-0 text-sm text-[#5f7287]">Hemos reunido en una sola vista los ajustes que más utilizas.</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-[22px] border border-white bg-white p-4 shadow-[0_16px_30px_-26px_rgba(30,58,95,0.35)]">
            <InlineStat label="Perfil" value="Listo para personalizar" />
            <InlineStat label="Preferencias" value="Vista previa activa" />
            <InlineStat label="Seguridad" value="Accesos rápidos disponibles" />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsCard
          accent="purple"
          description="Configura cómo quieres recibir información sobre tu actividad diaria sin tocar aún la lógica real."
          icon={<Bell className="size-5" strokeWidth={1.9} />}
          title="Notificaciones"
        >
          <div className="-mt-2 grid gap-3">
            <ToggleRow
              accent="purple"
              checked={pushNotifications}
              description="Avisos visuales sobre novedades, resultados y recordatorios importantes."
              onToggle={() => setPushNotifications((value) => !value)}
              title="Notificaciones push"
            />
            <ToggleRow
              accent="purple"
              checked={dailyReminders}
              description="Pequeño empujón diario para mantener la racha de estudio activa."
              onToggle={() => setDailyReminders((value) => !value)}
              title="Recordatorios diarios"
            />
          </div>
        </SettingsCard>
        <SettingsCard
          accent="orange"
          description="Detalles visuales generales para adaptar la interfaz a tu contexto de uso."
          icon={<Palette className="size-5" strokeWidth={1.9} />}
          title="Apariencia"
        >
          <ToggleRow
            accent="orange"
            checked={darkMode}
            description="Preview de un futuro modo oscuro. Por ahora el diseño sigue en tema claro."
            onToggle={() => setDarkMode((value) => !value)}
            title="Modo oscuro"
          />

          <ActionRow
            accent="#dd8a17"
            description="Valor actual de la interfaz"
            icon={<Globe className="size-5" strokeWidth={1.9} />}
            title="Idioma"
            value="Español"
          />
        </SettingsCard>

        <SettingsCard
          accent="blue"
          description="Accesos rápidos a opciones sensibles y documentación clave de la cuenta."
          icon={<Shield className="size-5" strokeWidth={1.9} />}
          title="Seguridad y privacidad"
        >
          <ActionRow
            accent="#2453d0"
            description="Actualiza tu acceso cuando la opción esté habilitada"
            icon={<Lock className="size-5" strokeWidth={1.9} />}
            onClick={openPasswordModal}
            title="Cambiar contraseña"
          />
          <ActionRow
            accent="#2453d0"
            description="Cómo tratamos y protegemos tus datos"
            icon={<Shield className="size-5" strokeWidth={1.9} />}
            onClick={() => navigate('/settings/privacy-policy')}
            title="Política de privacidad"
          />
          <ActionRow
            accent="#2453d0"
            description="Condiciones generales del uso de la plataforma"
            icon={<Mail className="size-5" strokeWidth={1.9} />}
            onClick={() => navigate('/settings/terms-and-conditions')}
            title="Términos y condiciones"
          />
        </SettingsCard>

        <SettingsCard
          accent="gray"
          description="Vías rápidas para resolver dudas y enviar sugerencias sobre la experiencia."
          icon={<HelpCircle className="size-5" strokeWidth={1.9} />}
          title="Ayuda y soporte"
        >
          <ActionRow
            accent="#5f7287"
            description="Guías y respuestas frecuentes para estudiar mejor"
            icon={<HelpCircle className="size-5" strokeWidth={1.9} />}
            onClick={() => navigate('/settings/help-center')}
            title="Centro de ayuda"
          />
          <ActionRow
            accent="#5f7287"
            description="Canal directo para incidencias o consultas"
            icon={<Mail className="size-5" strokeWidth={1.9} />}
            title="Contactar soporte"
          />
          <ActionRow
            accent="#5f7287"
            description="Compartí ideas para mejorar futuras versiones"
            icon={<Volume2 className="size-5" strokeWidth={1.9} />}
            title="Enviar feedback"
          />
        </SettingsCard>
      </div>

      <Card as="section" className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-7">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5f7287]">Versión de la app</span>
            <Badge className="bg-[#eef2f6] text-[#5f7287]" label="v0.0.0" variant="default" />
          </div>
          <p className="m-0 text-sm text-[#5f7287]">La sesión se cierra con el flujo real actual de autenticación.</p>
        </div>

        <Button
          className="w-full bg-[#c94b59] text-white hover:bg-[#b53c4a] md:w-auto"
          onClick={logout}
          type="button"
          variant="primary"
        >
          <span className="inline-flex items-center gap-2">
            <LogOut className="size-4" strokeWidth={2} />
            Cerrar sesión
          </span>
        </Button>
      </Card>
      </section>

      {isPasswordModalOpen ? (
        <div
          aria-labelledby="change-password-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.55)] px-4 py-6 backdrop-blur-[2px]"
          onClick={() => {
            if (!isSubmittingPassword) {
              closePasswordModal()
            }
          }}
          role="dialog"
        >
          <div
            className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_-24px_rgba(15,23,42,0.45)] md:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-[#edf4ff] text-[#2453d0] shadow-[0_12px_30px_-18px_rgba(36,83,208,0.55)]">
                  <Lock className="size-6" strokeWidth={1.9} />
                </span>
                <div>
                  <h2 className="m-0 text-2xl" id="change-password-modal-title">Cambiar contraseña</h2>
                  <p className="mt-1 mb-0 text-sm text-[#5f7287]">Actualizá tu contraseña real con validación segura en frontend y backend.</p>
                </div>
              </div>

              <button
                aria-label="Cerrar modal"
                className="inline-flex size-10 items-center justify-center rounded-full border border-[#dbe4ee] bg-white text-[#5f7287] transition-colors hover:bg-[#f5f8fb]"
                disabled={isSubmittingPassword}
                onClick={closePasswordModal}
                type="button"
              >
                <X className="size-4" strokeWidth={2.2} />
              </button>
            </div>

            <form className="grid gap-5" onSubmit={handlePasswordSubmit}>
              <PasswordField
                autoComplete="current-password"
                error={passwordErrors.currentPassword}
                id="currentPassword"
                label="Contraseña actual"
                onChange={(value) => updatePasswordField('currentPassword', value)}
                onToggleVisibility={() => togglePasswordVisibility('currentPassword')}
                value={passwordValues.currentPassword}
                visible={passwordVisibility.currentPassword}
              />

              <PasswordField
                autoComplete="new-password"
                error={passwordErrors.newPassword}
                hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
                id="newPassword"
                label="Nueva contraseña"
                onChange={(value) => updatePasswordField('newPassword', value)}
                onToggleVisibility={() => togglePasswordVisibility('newPassword')}
                value={passwordValues.newPassword}
                visible={passwordVisibility.newPassword}
              />

              <PasswordField
                autoComplete="new-password"
                error={passwordErrors.confirmPassword}
                id="confirmPassword"
                label="Confirmar nueva contraseña"
                onChange={(value) => updatePasswordField('confirmPassword', value)}
                onToggleVisibility={() => togglePasswordVisibility('confirmPassword')}
                value={passwordValues.confirmPassword}
                visible={passwordVisibility.confirmPassword}
              />

              {passwordSubmitError ? (
                <p className="m-0 rounded-2xl border border-[#f3d0d5] bg-[#fff5f6] px-4 py-3 text-sm text-[#b53c4a]">{passwordSubmitError}</p>
              ) : null}

              {passwordSuccessMessage ? (
                <p className="m-0 rounded-2xl border border-[#cde9db] bg-[#f3fbf6] px-4 py-3 text-sm text-[#2e7d5b]">{passwordSuccessMessage}</p>
              ) : null}

              <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button disabled={isSubmittingPassword} onClick={closePasswordModal} type="button" variant="secondary">
                  Cancelar
                </Button>
                <Button className="min-w-40" disabled={isSubmittingPassword} type="submit" variant="primary">
                  <span className="inline-flex items-center justify-center gap-2">
                    {isSubmittingPassword ? <LoaderCircle className="size-4 animate-spin" strokeWidth={2} /> : null}
                    {isSubmittingPassword ? 'Guardando...' : 'Guardar cambios'}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

function PasswordField({
  id,
  label,
  value,
  error,
  hint,
  visible,
  autoComplete,
  onChange,
  onToggleVisibility,
}: {
  id: string
  label: string
  value: string
  error?: string
  hint?: string
  visible: boolean
  autoComplete: string
  onChange: (value: string) => void
  onToggleVisibility: () => void
}) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-sm font-semibold text-[#1E3A5F]">{label}</span>
      <span
        className={clsx(
          'flex items-center rounded-[20px] border bg-[#fbfdff] px-4 py-3 transition-colors',
          error ? 'border-[#e7a1ac]' : 'border-[#dce5ef] focus-within:border-[#2453d0]',
        )}
      >
        <input
          aria-label={label}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className="w-full border-0 bg-transparent text-sm text-[#1E3A5F] outline-none"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          type={visible ? 'text' : 'password'}
          value={value}
        />
        <button
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="ml-3 inline-flex size-9 items-center justify-center rounded-full text-[#5f7287] transition-colors hover:bg-[#eef4ff] hover:text-[#2453d0]"
          onClick={onToggleVisibility}
          type="button"
        >
          {visible ? <EyeOff className="size-4" strokeWidth={1.9} /> : <Eye className="size-4" strokeWidth={1.9} />}
        </button>
      </span>
      {error ? <span className="text-sm text-[#b53c4a]">{error}</span> : hint ? <span className="text-sm text-[#5f7287]">{hint}</span> : null}
    </label>
  )
}

function SettingsCard({
  accent,
  title,
  description,
  icon,
  children,
}: {
  accent: keyof typeof accentStyles
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Card as="section" className="grid gap-5 p-6 md:p-7">
      <div className="flex items-start gap-4">
        <SoftIcon accent={accent}>{icon}</SoftIcon>
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-xl">{title}</h2>
            <span className={clsx('rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em]', accentStyles[accent].badge)}>
              Vista previa
            </span>
          </div>
          <p className="m-0 text-sm text-[#5f7287]">{description}</p>
        </div>
      </div>

      <div className="grid gap-3">{children}</div>
    </Card>
  )
}

function SoftIcon({ accent, children }: { accent: keyof typeof accentStyles; children: ReactNode }) {
  return <span className={clsx('inline-flex size-11 items-center justify-center rounded-2xl', accentStyles[accent].icon)}>{children}</span>
}

function ToggleRow({ title, description, checked, onToggle, accent = 'blue' }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-[#e7edf4] bg-[#fbfdff] p-4">
      <div className="grid gap-1">
        <h3 className="m-0 text-base">{title}</h3>
        <p className="m-0 text-sm text-[#5f7287]">{description}</p>
      </div>

      <button
        aria-checked={checked}
        aria-label={title}
        className={clsx(
          'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-transparent p-1 transition-colors duration-200',
          checked ? accentStyles[accent].toggle : 'bg-[#dce4ed]',
        )}
        onClick={onToggle}
        role="switch"
        type="button"
      >
        <span
          className={clsx(
            'inline-flex size-6 rounded-full bg-white shadow-[0_10px_18px_-12px_rgba(15,23,42,0.45)] transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}

function ActionRow({ icon, title, description, accent = '#2453d0', value, onClick }: ActionRowProps) {
  return (
    <button
      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[22px] border border-[#e7edf4] bg-[#fbfdff] p-4 text-left transition-colors duration-200 hover:bg-white"
      onClick={onClick}
      type="button"
    >
      <span className="inline-flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}14`, color: accent }}>
        {icon}
      </span>

      <span className="grid gap-1">
        <span className="font-semibold text-[#1E3A5F]">{title}</span>
        {description ? <span className="text-sm text-[#5f7287]">{description}</span> : null}
      </span>

      <span className="flex items-center gap-2 text-sm font-medium text-[#5f7287]">
        {value ? <span>{value}</span> : null}
        <ChevronRight className="size-4" strokeWidth={2} />
      </span>
    </button>
  )
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <div className="rounded-[22px] border border-[#e7edf4] bg-[#fbfdff] p-4">
      <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#2453d0]">{icon}</div>
      <p className="m-0 text-sm text-[#5f7287]">{label}</p>
      <p className="mt-1 mb-0 text-sm font-medium text-[#1E3A5F]">{value}</p>
    </div>
  )
}

function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-3">
      <span className="text-sm text-[#5f7287]">{label}</span>
      <span className="text-sm font-semibold text-[#1E3A5F]">{value}</span>
    </div>
  )
}

function formatRole(role?: string | null) {
  switch (role) {
    case 'student':
      return 'Alumno'
    case 'school_admin':
      return 'Administrador'
    case 'system_admin':
      return 'Admin sistema'
    default:
      return 'Estudiante'
  }
}

function resolvePasswordChangeErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.message) {
      case 'invalid_current_password':
        return 'La contraseña actual no es correcta.'
      case 'password_too_short':
        return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
      case 'password_must_be_different':
        return 'La nueva contraseña debe ser distinta de la actual.'
      case 'user_not_found':
        return 'No pudimos encontrar tu usuario autenticado.'
      default:
        return error.message || 'No pudimos cambiar la contraseña.'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'No pudimos cambiar la contraseña.'
}
