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
import { getLanguageLabel, useI18n } from '../features/i18n'
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
  const { language, setLanguage } = useI18n()
  const navigate = useNavigate()
  const [pushNotifications, setPushNotifications] = useState(true)
  const [dailyReminders, setDailyReminders] = useState(false)
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
  const copy = language === 'en'
    ? {
        pageEyebrow: 'Personal settings',
        title: 'Settings',
        description: 'Customize your study experience, review your preferences, and find quick support access.',
        notificationsButton: 'Open notifications center',
        editAvatar: 'Edit avatar',
        editProfile: 'Edit profile',
        studySpaceTitle: 'Your study space',
        studySpaceDescription: 'We gathered the settings you use most in one single view.',
        profileStatLabel: 'Profile',
        profileStatValue: 'Ready to personalize',
        preferencesStatLabel: 'Preferences',
        preferencesStatValue: 'Live preview active',
        securityStatLabel: 'Security',
        securityStatValue: 'Quick access available',
        notificationsTitle: 'Notifications',
        notificationsDescription: 'Set how you want to receive information about your daily activity without enabling the real logic yet.',
        pushNotifications: 'Push notifications',
        pushNotificationsDescription: 'Visual alerts about news, results, and important reminders.',
        dailyReminders: 'Daily reminders',
        dailyRemindersDescription: 'A small daily nudge to keep your study streak active.',
        appearanceTitle: 'Appearance',
        appearanceDescription: 'General visual details to adapt the interface to your current context of use.',
        languageTitle: 'Language',
        languageDescription: 'Choose the language used across the visible interface.',
        languageSelectorLabel: 'Application language',
        securityTitle: 'Security and privacy',
        securityDescription: 'Quick access to sensitive options and key account documentation.',
        changePassword: 'Change password',
        changePasswordDescription: 'Update your access when the option is enabled',
        privacyPolicy: 'Privacy policy',
        privacyPolicyDescription: 'How we handle and protect your data',
        terms: 'Terms and conditions',
        termsDescription: 'General conditions for using the platform',
        helpTitle: 'Help and support',
        helpDescription: 'Fast ways to solve questions and send suggestions about the experience.',
        helpCenter: 'Help center',
        helpCenterDescription: 'Guides and frequent answers to study better',
        contactSupport: 'Contact support',
        contactSupportDescription: 'Direct channel for incidents or questions',
        sendFeedback: 'Send feedback',
        sendFeedbackDescription: 'Share ideas to improve future versions',
        appVersion: 'App version',
        logoutDescription: 'Your session closes using the current real authentication flow.',
        logout: 'Log out',
        modalTitle: 'Change password',
        modalDescription: 'Update your real password with secure validation in frontend and backend.',
        closeModal: 'Close modal',
        currentPassword: 'Current password',
        newPassword: 'New password',
        confirmPassword: 'Confirm new password',
        minimumPassword: `Minimum ${MIN_PASSWORD_LENGTH} characters.`,
        cancel: 'Cancel',
        saving: 'Saving...',
        saveChanges: 'Save changes',
        preview: 'Preview',
        emailLabel: 'Email',
        phoneLabel: 'Phone',
        schoolLabel: 'Driving school',
        emailUnavailable: 'No email available',
        phoneUnavailable: 'No phone added yet',
        schoolPending: 'School pending assignment',
        linkedSchool: 'Linked center',
        activeMembership: 'Active membership',
        pendingAccount: 'Pending account',
        profileFallback: 'DriveMind Student',
      }
    : {
        pageEyebrow: 'Configuración personal',
        title: 'Ajustes',
        description: 'Personaliza tu experiencia de estudio, revisa tus preferencias y encuentra accesos rápidos de soporte.',
        notificationsButton: 'Abrir centro de notificaciones',
        editAvatar: 'Editar avatar',
        editProfile: 'Editar perfil',
        studySpaceTitle: 'Tu espacio de estudio',
        studySpaceDescription: 'Hemos reunido en una sola vista los ajustes que más utilizas.',
        profileStatLabel: 'Perfil',
        profileStatValue: 'Listo para personalizar',
        preferencesStatLabel: 'Preferencias',
        preferencesStatValue: 'Vista previa activa',
        securityStatLabel: 'Seguridad',
        securityStatValue: 'Accesos rápidos disponibles',
        notificationsTitle: 'Notificaciones',
        notificationsDescription: 'Configura cómo quieres recibir información sobre tu actividad diaria sin tocar aún la lógica real.',
        pushNotifications: 'Notificaciones push',
        pushNotificationsDescription: 'Avisos visuales sobre novedades, resultados y recordatorios importantes.',
        dailyReminders: 'Recordatorios diarios',
        dailyRemindersDescription: 'Pequeño empujón diario para mantener la racha de estudio activa.',
        appearanceTitle: 'Apariencia',
        appearanceDescription: 'Detalles visuales generales para adaptar la interfaz a tu contexto de uso.',
        languageTitle: 'Idioma',
        languageDescription: 'Elegí el idioma que se usa en la interfaz visible.',
        languageSelectorLabel: 'Idioma de la aplicación',
        securityTitle: 'Seguridad y privacidad',
        securityDescription: 'Accesos rápidos a opciones sensibles y documentación clave de la cuenta.',
        changePassword: 'Cambiar contraseña',
        changePasswordDescription: 'Actualiza tu acceso cuando la opción esté habilitada',
        privacyPolicy: 'Política de privacidad',
        privacyPolicyDescription: 'Cómo tratamos y protegemos tus datos',
        terms: 'Términos y condiciones',
        termsDescription: 'Condiciones generales del uso de la plataforma',
        helpTitle: 'Ayuda y soporte',
        helpDescription: 'Vías rápidas para resolver dudas y enviar sugerencias sobre la experiencia.',
        helpCenter: 'Centro de ayuda',
        helpCenterDescription: 'Guías y respuestas frecuentes para estudiar mejor',
        contactSupport: 'Contactar soporte',
        contactSupportDescription: 'Canal directo para incidencias o consultas',
        sendFeedback: 'Enviar feedback',
        sendFeedbackDescription: 'Compartí ideas para mejorar futuras versiones',
        appVersion: 'Versión de la app',
        logoutDescription: 'La sesión se cierra con el flujo real actual de autenticación.',
        logout: 'Cerrar sesión',
        modalTitle: 'Cambiar contraseña',
        modalDescription: 'Actualizá tu contraseña real con validación segura en frontend y backend.',
        closeModal: 'Cerrar modal',
        currentPassword: 'Contraseña actual',
        newPassword: 'Nueva contraseña',
        confirmPassword: 'Confirmar nueva contraseña',
        minimumPassword: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
        cancel: 'Cancelar',
        saving: 'Guardando...',
        saveChanges: 'Guardar cambios',
        preview: 'Vista previa',
        emailLabel: 'Email',
        phoneLabel: 'Teléfono',
        schoolLabel: 'Autoescuela',
        emailUnavailable: 'Sin email disponible',
        phoneUnavailable: 'Sin teléfono añadido aún',
        schoolPending: 'Centro pendiente de asignación',
        linkedSchool: 'Centro vinculado',
        activeMembership: 'Membresía activa',
        pendingAccount: 'Cuenta pendiente',
        profileFallback: 'Estudiante DriveMind',
      }

  const profile = useMemo(() => {
    const fullName = user?.full_name?.trim() || copy.profileFallback
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('')

    return {
      fullName,
      initials: initials || 'DM',
      role: formatRole(user?.role, language),
      membership: user?.is_active ? copy.activeMembership : copy.pendingAccount,
      email: user?.email || copy.emailUnavailable,
      phone: copy.phoneUnavailable,
      school: user?.school_id ? `${copy.linkedSchool} · ${user.school_id}` : copy.schoolPending,
    }
  }, [copy.activeMembership, copy.emailUnavailable, copy.linkedSchool, copy.pendingAccount, copy.phoneUnavailable, copy.profileFallback, copy.schoolPending, language, user])

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
      errors.currentPassword = language === 'en' ? 'Enter your current password.' : 'Ingresá tu contraseña actual.'
    }

    if (!values.newPassword) {
      errors.newPassword = language === 'en' ? 'Enter a new password.' : 'Ingresá una nueva contraseña.'
    } else if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = language === 'en'
        ? `The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`
        : `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    } else if (values.newPassword === values.currentPassword) {
      errors.newPassword = language === 'en' ? 'The new password must be different from the current one.' : 'La nueva contraseña debe ser distinta de la actual.'
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = language === 'en' ? 'Confirm the new password.' : 'Confirmá la nueva contraseña.'
    } else if (values.confirmPassword !== values.newPassword) {
      errors.confirmPassword = language === 'en' ? 'Passwords do not match.' : 'Las contraseñas no coinciden.'
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

      setPasswordSuccessMessage(language === 'en' ? 'Password updated successfully.' : 'Contraseña actualizada correctamente.')

      window.setTimeout(() => {
        closePasswordModal()
      }, 900)
    } catch (error) {
      setPasswordSubmitError(resolvePasswordChangeErrorMessage(error, language))
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
          <p className="m-0 text-sm font-semibold tracking-[0.16em] uppercase text-[#2C5F8A]">{copy.pageEyebrow}</p>
          <h1 className="m-0 text-[clamp(2rem,4vw,3rem)] leading-none">{copy.title}</h1>
          <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
            {copy.description}
          </p>
        </div>

        <button
          aria-label={copy.notificationsButton}
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
                  aria-label={copy.editAvatar}
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
              {copy.editProfile}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <DetailItem icon={<Mail className="size-4" strokeWidth={1.9} />} label={copy.emailLabel} value={profile.email} />
            <DetailItem icon={<Phone className="size-4" strokeWidth={1.9} />} label={copy.phoneLabel} value={profile.phone} />
            <DetailItem icon={<UserRound className="size-4" strokeWidth={1.9} />} label={copy.schoolLabel} value={profile.school} />
          </div>
        </div>

        <div className="grid gap-4 rounded-[24px] border border-[#e6edf4] bg-[#f8fbfe] p-5">
          <div className="flex items-center gap-3">
            <SoftIcon accent="blue">
              <Sparkles className="size-5" strokeWidth={1.9} />
            </SoftIcon>
            <div>
              <h3 className="m-0 text-lg">{copy.studySpaceTitle}</h3>
              <p className="m-0 text-sm text-[#5f7287]">{copy.studySpaceDescription}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-[22px] border border-white bg-white p-4 shadow-[0_16px_30px_-26px_rgba(30,58,95,0.35)]">
            <InlineStat label={copy.profileStatLabel} value={copy.profileStatValue} />
            <InlineStat label={copy.preferencesStatLabel} value={copy.preferencesStatValue} />
            <InlineStat label={copy.securityStatLabel} value={copy.securityStatValue} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsCard
          accent="purple"
          description={copy.notificationsDescription}
          icon={<Bell className="size-5" strokeWidth={1.9} />}
          previewLabel={copy.preview}
          title={copy.notificationsTitle}
        >
          <div className="-mt-2 grid gap-3">
            <ToggleRow
              accent="purple"
              checked={pushNotifications}
              description={copy.pushNotificationsDescription}
              onToggle={() => setPushNotifications((value) => !value)}
              title={copy.pushNotifications}
            />
            <ToggleRow
              accent="purple"
              checked={dailyReminders}
              description={copy.dailyRemindersDescription}
              onToggle={() => setDailyReminders((value) => !value)}
              title={copy.dailyReminders}
            />
          </div>
        </SettingsCard>
        <SettingsCard
          accent="orange"
          description={copy.appearanceDescription}
          icon={<Palette className="size-5" strokeWidth={1.9} />}
          previewLabel={copy.preview}
          title={copy.appearanceTitle}
        >
          <div className="rounded-[22px] border border-[#e7edf4] bg-[#fbfdff] p-4">
            <div className="flex items-start gap-4">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#dd8a1714', color: '#dd8a17' }}>
                <Globe className="size-5" strokeWidth={1.9} />
              </span>
              <div className="grid flex-1 gap-3">
                <div className="grid gap-1">
                  <span className="font-semibold text-[#1E3A5F]">{copy.languageTitle}</span>
                  <span className="text-sm text-[#5f7287]">{copy.languageDescription}</span>
                </div>
                <div aria-label={copy.languageSelectorLabel} className="grid gap-2 sm:grid-cols-2" role="group">
                  {(['es', 'en'] as const).map((option) => {
                    const selected = language === option

                    return (
                      <button
                        key={option}
                        aria-pressed={selected}
                        className={clsx(
                          'rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors',
                          selected
                            ? 'border-[#dd8a17] bg-[#fff7ef] text-[#b76806]'
                            : 'border-[#dce5ef] bg-white text-[#5f7287] hover:border-[#dd8a17] hover:text-[#b76806]',
                        )}
                        onClick={() => setLanguage(option)}
                        type="button"
                      >
                        {getLanguageLabel(option)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          accent="blue"
          description={copy.securityDescription}
          icon={<Shield className="size-5" strokeWidth={1.9} />}
          previewLabel={copy.preview}
          title={copy.securityTitle}
        >
          <ActionRow
            accent="#2453d0"
            description={copy.changePasswordDescription}
            icon={<Lock className="size-5" strokeWidth={1.9} />}
            onClick={openPasswordModal}
            title={copy.changePassword}
          />
          <ActionRow
            accent="#2453d0"
            description={copy.privacyPolicyDescription}
            icon={<Shield className="size-5" strokeWidth={1.9} />}
            onClick={() => navigate('/settings/privacy-policy')}
            title={copy.privacyPolicy}
          />
          <ActionRow
            accent="#2453d0"
            description={copy.termsDescription}
            icon={<Mail className="size-5" strokeWidth={1.9} />}
            onClick={() => navigate('/settings/terms-and-conditions')}
            title={copy.terms}
          />
        </SettingsCard>

        <SettingsCard
          accent="gray"
          description={copy.helpDescription}
          icon={<HelpCircle className="size-5" strokeWidth={1.9} />}
          previewLabel={copy.preview}
          title={copy.helpTitle}
        >
          <ActionRow
            accent="#5f7287"
            description={copy.helpCenterDescription}
            icon={<HelpCircle className="size-5" strokeWidth={1.9} />}
            onClick={() => navigate('/settings/help-center')}
            title={copy.helpCenter}
          />
          <ActionRow
            accent="#5f7287"
            description={copy.contactSupportDescription}
            icon={<Mail className="size-5" strokeWidth={1.9} />}
            onClick={() => navigate('/settings/contact-support')}
            title={copy.contactSupport}
          />
          <ActionRow
            accent="#5f7287"
            description={copy.sendFeedbackDescription}
            icon={<Volume2 className="size-5" strokeWidth={1.9} />}
            onClick={() => navigate('/settings/send-feedback')}
            title={copy.sendFeedback}
          />
        </SettingsCard>
      </div>

      <Card as="section" className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-7">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5f7287]">{copy.appVersion}</span>
            <Badge className="bg-[#eef2f6] text-[#5f7287]" label="v0.0.0" variant="default" />
          </div>
          <p className="m-0 text-sm text-[#5f7287]">{copy.logoutDescription}</p>
        </div>

        <Button
          className="w-full bg-[#c94b59] text-white hover:bg-[#b53c4a] md:w-auto"
          onClick={logout}
          type="button"
          variant="primary"
        >
          <span className="inline-flex items-center gap-2">
            <LogOut className="size-4" strokeWidth={2} />
            {copy.logout}
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
                  <h2 className="m-0 text-2xl" id="change-password-modal-title">{copy.modalTitle}</h2>
                  <p className="mt-1 mb-0 text-sm text-[#5f7287]">{copy.modalDescription}</p>
                </div>
              </div>

              <button
                aria-label={copy.closeModal}
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
                label={copy.currentPassword}
                onChange={(value) => updatePasswordField('currentPassword', value)}
                onToggleVisibility={() => togglePasswordVisibility('currentPassword')}
                showLabel={language === 'en' ? 'Show' : 'Mostrar'}
                value={passwordValues.currentPassword}
                visible={passwordVisibility.currentPassword}
                hideLabel={language === 'en' ? 'Hide' : 'Ocultar'}
              />

              <PasswordField
                autoComplete="new-password"
                error={passwordErrors.newPassword}
                hint={copy.minimumPassword}
                id="newPassword"
                label={copy.newPassword}
                onChange={(value) => updatePasswordField('newPassword', value)}
                onToggleVisibility={() => togglePasswordVisibility('newPassword')}
                showLabel={language === 'en' ? 'Show' : 'Mostrar'}
                value={passwordValues.newPassword}
                visible={passwordVisibility.newPassword}
                hideLabel={language === 'en' ? 'Hide' : 'Ocultar'}
              />

              <PasswordField
                autoComplete="new-password"
                error={passwordErrors.confirmPassword}
                id="confirmPassword"
                label={copy.confirmPassword}
                onChange={(value) => updatePasswordField('confirmPassword', value)}
                onToggleVisibility={() => togglePasswordVisibility('confirmPassword')}
                showLabel={language === 'en' ? 'Show' : 'Mostrar'}
                value={passwordValues.confirmPassword}
                visible={passwordVisibility.confirmPassword}
                hideLabel={language === 'en' ? 'Hide' : 'Ocultar'}
              />

              {passwordSubmitError ? (
                <p className="m-0 rounded-2xl border border-[#f3d0d5] bg-[#fff5f6] px-4 py-3 text-sm text-[#b53c4a]">{passwordSubmitError}</p>
              ) : null}

              {passwordSuccessMessage ? (
                <p className="m-0 rounded-2xl border border-[#cde9db] bg-[#f3fbf6] px-4 py-3 text-sm text-[#2e7d5b]">{passwordSuccessMessage}</p>
              ) : null}

              <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button disabled={isSubmittingPassword} onClick={closePasswordModal} type="button" variant="secondary">
                  {copy.cancel}
                </Button>
                <Button className="min-w-40" disabled={isSubmittingPassword} type="submit" variant="primary">
                  <span className="inline-flex items-center justify-center gap-2">
                    {isSubmittingPassword ? <LoaderCircle className="size-4 animate-spin" strokeWidth={2} /> : null}
                    {isSubmittingPassword ? copy.saving : copy.saveChanges}
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
  showLabel,
  hideLabel,
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
  showLabel: string
  hideLabel: string
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
          aria-label={visible ? `${hideLabel} ${label.toLowerCase()}` : `${showLabel} ${label.toLowerCase()}`}
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
  previewLabel,
  children,
}: {
  accent: keyof typeof accentStyles
  title: string
  description: string
  icon: ReactNode
  previewLabel: string
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
              {previewLabel}
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

function formatRole(role: string | null | undefined, language: 'es' | 'en') {
  switch (role) {
    case 'student':
      return language === 'en' ? 'Student' : 'Alumno'
    case 'school_admin':
      return language === 'en' ? 'Administrator' : 'Administrador'
    case 'system_admin':
      return language === 'en' ? 'System admin' : 'Admin sistema'
    default:
      return language === 'en' ? 'Student' : 'Estudiante'
  }
}

function resolvePasswordChangeErrorMessage(error: unknown, language: 'es' | 'en') {
  if (error instanceof ApiError) {
    switch (error.message) {
      case 'invalid_current_password':
        return language === 'en' ? 'The current password is incorrect.' : 'La contraseña actual no es correcta.'
      case 'password_too_short':
        return language === 'en'
          ? `The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`
          : `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
      case 'password_must_be_different':
        return language === 'en' ? 'The new password must be different from the current one.' : 'La nueva contraseña debe ser distinta de la actual.'
      case 'user_not_found':
        return language === 'en' ? 'We could not find your authenticated user.' : 'No pudimos encontrar tu usuario autenticado.'
      default:
        return error.message || (language === 'en' ? 'We could not change the password.' : 'No pudimos cambiar la contraseña.')
    }
  }

  if (error instanceof Error && error.message) {
    if (error.message === 'session_expired') {
      return language === 'en' ? 'Your session expired. Sign in again.' : 'Tu sesión expiró. Iniciá sesión de nuevo.'
    }

    return error.message
  }

  return language === 'en' ? 'We could not change the password.' : 'No pudimos cambiar la contraseña.'
}
