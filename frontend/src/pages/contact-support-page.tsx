import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Clock3, Mail, MessageCircleMore, Phone, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { useAuth } from '../features/auth'
import { useI18n } from '../features/i18n'
import { submitSupportContact } from '../lib/support-contact'

const MESSAGE_MAX_LENGTH = 1200

const inquiryTypeOptions = {
  en: [
    { value: '', label: 'Select inquiry type' },
    { value: 'tecnico', label: 'Technical issue' },
    { value: 'cuenta', label: 'Account and access' },
    { value: 'pagos', label: 'Payments and subscriptions' },
    { value: 'licencias', label: 'Permits and licences' },
    { value: 'sugerencia', label: 'Suggestion or improvement' },
  ],
  es: [
    { value: '', label: 'Selecciona el tipo de consulta' },
    { value: 'tecnico', label: 'Problema técnico' },
    { value: 'cuenta', label: 'Cuenta y acceso' },
    { value: 'pagos', label: 'Pagos y suscripciones' },
    { value: 'licencias', label: 'Permisos y licencias' },
    { value: 'sugerencia', label: 'Sugerencia o mejora' },
  ],
} as const

type SupportFormValues = {
  fullName: string
  email: string
  inquiryType: string
  subject: string
  message: string
}

type SupportFormErrors = Partial<Record<keyof SupportFormValues, string>>

export function ContactSupportPage() {
  const { user } = useAuth()
  const { language } = useI18n()
  const copy = language === 'en'
    ? {
        back: 'Back to settings',
        title: 'Contact support',
        description: 'Complete the form and we will get in touch with you.',
        formTitle: 'Contact form',
        formDescription: 'We will use this information to reply to you. The current submission still uses a local placeholder until a real support endpoint exists.',
        fullName: 'Full name',
        email: 'Email',
        inquiryType: 'Inquiry type',
        subject: 'Subject',
        subjectPlaceholder: 'Write a descriptive title',
        message: 'Message',
        messagePlaceholder: 'Describe your issue or question with as much detail as possible',
        sending: 'Sending message...',
        submit: 'Send message',
        success: 'Your message was sent successfully. The support team will reply by email.',
        error: 'We could not send your inquiry right now. Try again in a few minutes.',
        scheduleTitle: 'Support hours',
        scheduleDescription: 'Our team replies during the support window shown below.',
        weekdays: 'Monday - Friday',
        saturday: 'Saturdays',
        sunday: 'Sundays',
        closed: 'Closed',
        directEmailTitle: 'Direct email',
        directEmailDescription: 'If you prefer to write to us directly:',
        phoneTitle: 'Phone',
        phoneDescription: 'Call us Monday through Friday',
        responseTimeTitle: 'Response time',
        responseTimeDescription: 'We answer most inquiries in less than 24 business hours. If your case is urgent, we recommend using the phone line.',
      }
    : {
        back: 'Volver a ajustes',
        title: 'Contactar con soporte',
        description: 'Completa el formulario y nos pondremos en contacto contigo',
        formTitle: 'Formulario de contacto',
        formDescription: 'Usaremos estos datos para responderte. El envío actual usa un placeholder local hasta que exista un endpoint real de soporte.',
        fullName: 'Nombre completo',
        email: 'Email',
        inquiryType: 'Tipo de consulta',
        subject: 'Asunto',
        subjectPlaceholder: 'Escribe un título descriptivo',
        message: 'Mensaje',
        messagePlaceholder: 'Describe tu consulta o problema con el máximo detalle posible',
        sending: 'Enviando mensaje...',
        submit: 'Enviar mensaje',
        success: 'Tu mensaje se envió correctamente. El equipo de soporte te responderá por email.',
        error: 'No pudimos enviar tu consulta en este momento. Inténtalo de nuevo en unos minutos.',
        scheduleTitle: 'Horario de atención',
        scheduleDescription: 'Nuestro equipo responde durante el horario de soporte indicado.',
        weekdays: 'Lunes - Viernes',
        saturday: 'Sábados',
        sunday: 'Domingos',
        closed: 'Cerrado',
        directEmailTitle: 'Email directo',
        directEmailDescription: 'Si prefieres escribirnos directamente:',
        phoneTitle: 'Teléfono',
        phoneDescription: 'Llámanos de lunes a viernes',
        responseTimeTitle: 'Tiempo de respuesta',
        responseTimeDescription: 'Respondemos la mayoría de consultas en menos de 24 horas laborables. Si tu caso es urgente, te recomendamos usar el teléfono.',
      }

  const [values, setValues] = useState<SupportFormValues>({
    fullName: user?.full_name?.trim() ?? '',
    email: user?.email?.trim() ?? '',
    inquiryType: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<SupportFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch {
      // jsdom no implementa scrollTo
    }
  }, [])

  useEffect(() => {
    setValues((currentValues) => ({
      ...currentValues,
      fullName: currentValues.fullName || user?.full_name?.trim() || '',
      email: currentValues.email || user?.email?.trim() || '',
    }))
  }, [user])

  const remainingCharacters = MESSAGE_MAX_LENGTH - values.message.length
  const messageCounterId = 'support-message-counter'
  const messageErrorId = 'support-message-error'

  function updateValue(field: keyof SupportFormValues, value: string) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    setSubmitStatus(null)
  }

  function validateForm(nextValues: SupportFormValues) {
    const nextErrors: SupportFormErrors = {}

    if (!nextValues.fullName.trim()) {
      nextErrors.fullName = language === 'en' ? 'Enter your full name.' : 'Ingresá tu nombre completo.'
    }

    if (!nextValues.email.trim()) {
      nextErrors.email = language === 'en' ? 'Enter a contact email.' : 'Ingresá un email de contacto.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextValues.email.trim())) {
      nextErrors.email = language === 'en' ? 'Enter a valid email.' : 'Ingresá un email válido.'
    }

    if (!nextValues.inquiryType) {
      nextErrors.inquiryType = language === 'en' ? 'Select the inquiry type.' : 'Seleccioná el tipo de consulta.'
    }

    if (!nextValues.subject.trim()) {
      nextErrors.subject = language === 'en' ? 'Write a descriptive subject.' : 'Escribí un asunto descriptivo.'
    }

    if (!nextValues.message.trim()) {
      nextErrors.message = language === 'en' ? 'Tell us the details of your issue or question.' : 'Contanos el detalle de tu consulta o problema.'
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedValues: SupportFormValues = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      inquiryType: values.inquiryType,
      subject: values.subject.trim(),
      message: values.message.trim(),
    }

    const nextErrors = validateForm(trimmedValues)
    setErrors(nextErrors)
    setSubmitStatus(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await submitSupportContact(trimmedValues)
      setSubmitStatus({ type: 'success', message: copy.success })
      setValues((currentValues) => ({
        ...currentValues,
        inquiryType: '',
        subject: '',
        message: '',
      }))
    } catch {
      setSubmitStatus({ type: 'error', message: copy.error })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="grid gap-6 bg-[#f6f8fb] text-[#1E3A5F]">
      <header className="rounded-[32px] border border-[#dce5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,252,0.98))] p-5 shadow-[0_20px_45px_-30px_rgba(30,58,95,0.22)] md:p-8">
        <div className="grid gap-8">
          <div className="flex items-start justify-start">
            <Link className="inline-flex items-center gap-2 rounded-full border border-[#dde5ef] bg-white px-4 py-2 text-sm font-semibold text-[#4b6178] shadow-[0_14px_28px_-24px_rgba(30,58,95,0.35)] transition-colors duration-200 hover:border-[#cad6e2] hover:bg-[#f9fbfd]" to="/settings">
              <ArrowLeft className="size-4" strokeWidth={2} />
              {copy.back}
            </Link>
          </div>

          <div className="grid justify-items-center gap-4 text-center">
            <div className="flex size-18 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2453d0,#5b7cff)] text-white shadow-[0_18px_36px_-24px_rgba(36,83,208,0.55)] md:size-20">
              <MessageCircleMore className="size-8 md:size-9" strokeWidth={2} />
            </div>

            <div className="grid gap-3">
              <h1 className="m-0 text-[clamp(2rem,4vw,3rem)] leading-none">{copy.title}</h1>
              <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">{copy.description}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card as="section" className="grid gap-6 p-6 md:p-7">
          <div className="grid gap-2">
            <h2 className="m-0 text-2xl">{copy.formTitle}</h2>
            <p className="m-0 text-sm text-[#5f7287]">{copy.formDescription}</p>
          </div>

          <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field error={errors.fullName} htmlFor="support-full-name" label={copy.fullName}>
                <input
                  aria-invalid={errors.fullName ? 'true' : 'false'}
                  className={inputClassName(errors.fullName, 'rounded-xl')}
                  id="support-full-name"
                  onChange={(event) => updateValue('fullName', event.target.value)}
                  type="text"
                  value={values.fullName}
                />
              </Field>

              <Field error={errors.email} htmlFor="support-email" label={copy.email}>
                <input
                  aria-invalid={errors.email ? 'true' : 'false'}
                  className={inputClassName(errors.email, 'rounded-xl')}
                  id="support-email"
                  onChange={(event) => updateValue('email', event.target.value)}
                  type="email"
                  value={values.email}
                />
              </Field>
            </div>

            <Field error={errors.inquiryType} htmlFor="support-inquiry-type" label={copy.inquiryType} required>
              <select
                aria-invalid={errors.inquiryType ? 'true' : 'false'}
                className={inputClassName(errors.inquiryType, 'rounded-xl')}
                id="support-inquiry-type"
                onChange={(event) => updateValue('inquiryType', event.target.value)}
                value={values.inquiryType}
              >
                {inquiryTypeOptions[language].map((option) => (
                  <option key={option.value || 'placeholder'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field error={errors.subject} htmlFor="support-subject" label={copy.subject} required>
              <input
                aria-invalid={errors.subject ? 'true' : 'false'}
                className={inputClassName(errors.subject, 'rounded-xl')}
                id="support-subject"
                onChange={(event) => updateValue('subject', event.target.value)}
                placeholder={copy.subjectPlaceholder}
                type="text"
                value={values.subject}
              />
            </Field>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[#314860]" htmlFor="support-message">
                {copy.message} <span aria-hidden="true" className="text-[#2453d0]">*</span>
              </label>
              <textarea
                aria-describedby={errors.message ? `${messageCounterId} ${messageErrorId}` : messageCounterId}
                aria-invalid={errors.message ? 'true' : 'false'}
                className={inputClassName(errors.message, 'min-h-44 resize-y rounded-xl px-4 py-4')}
                id="support-message"
                maxLength={MESSAGE_MAX_LENGTH}
                onChange={(event) => updateValue('message', event.target.value)}
                placeholder={copy.messagePlaceholder}
                value={values.message}
              />
              <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
                <span className={remainingCharacters < 100 ? 'text-[#2453d0]' : 'text-[#5f7287]'} id={messageCounterId}>
                  {values.message.length} / {MESSAGE_MAX_LENGTH}
                </span>
                {errors.message ? (
                  <span className="font-medium text-[#c94b59]" id={messageErrorId} role="alert">
                    {errors.message}
                  </span>
                ) : null}
              </div>
            </div>

            {submitStatus ? (
              <div className={submitStatus.type === 'success' ? 'rounded-[20px] border border-[#cce9d9] bg-[#f1faf5] px-4 py-3 text-sm text-[#24543d]' : 'rounded-[20px] border border-[#f0cfd4] bg-[#fff7f8] px-4 py-3 text-sm text-[#a53849]'} role="status">
                {submitStatus.message}
              </div>
            ) : null}

            <div>
              <button className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[#2453d0] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_32px_-22px_rgba(36,83,208,0.55)] transition-colors duration-200 hover:bg-[#1e46b1] disabled:cursor-progress disabled:opacity-70" disabled={isSubmitting} type="submit">
                <Send className="size-4" strokeWidth={2} />
                {isSubmitting ? copy.sending : copy.submit}
              </button>
            </div>
          </form>
        </Card>

        <div className="grid gap-5 self-start xl:sticky xl:top-6">
          <Card as="aside" className="grid gap-5 rounded-[24px] p-6 shadow-[0_18px_38px_-30px_rgba(30,58,95,0.24)]">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2453d0]">
                <Clock3 className="size-5" strokeWidth={1.9} />
              </div>
              <div className="grid gap-1.5">
                <h2 className="m-0 text-lg font-semibold">{copy.scheduleTitle}</h2>
                <p className="m-0 text-sm text-[#6a7d90]">{copy.scheduleDescription}</p>
              </div>
            </div>

            <div className="grid gap-3">
              <ScheduleRow day={copy.weekdays} value="09:00 - 18:00" />
              <ScheduleRow day={copy.saturday} value="10:00 - 14:00" />
              <ScheduleRow day={copy.sunday} muted value={copy.closed} />
            </div>
          </Card>

          <Card as="aside" className="grid gap-4 rounded-[24px] p-6 shadow-[0_18px_38px_-30px_rgba(30,58,95,0.24)]">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f3eeff] text-[#7c3aed]">
                <Mail className="size-5" strokeWidth={1.9} />
              </div>
              <div className="grid gap-1.5">
                <h2 className="m-0 text-lg font-semibold">{copy.directEmailTitle}</h2>
                <p className="m-0 text-sm text-[#6a7d90]">{copy.directEmailDescription}</p>
              </div>
            </div>

            <a className="text-sm font-semibold text-[#2453d0] underline-offset-4 transition-colors hover:text-[#1e46b1] hover:underline" href="mailto:support@drivemind.app">
              support@drivemind.app
            </a>
          </Card>

          <Card as="aside" className="grid gap-4 rounded-[24px] p-6 shadow-[0_18px_38px_-30px_rgba(30,58,95,0.24)]">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#ecf8f2] text-[#2e7d5b]">
                <Phone className="size-5" strokeWidth={1.9} />
              </div>
              <div className="grid gap-1.5">
                <h2 className="m-0 text-lg font-semibold">{copy.phoneTitle}</h2>
                <p className="m-0 text-sm text-[#6a7d90]">{copy.phoneDescription}</p>
              </div>
            </div>

            <a className="text-sm font-semibold text-[#1f7a57] underline-offset-4 transition-colors hover:text-[#175e42] hover:underline" href="tel:+34900123456">
              +34 900 123 456
            </a>
          </Card>

          <aside className="grid gap-3 rounded-[24px] bg-[#eef4ff] p-6 text-[#1E3A5F] shadow-[0_18px_38px_-30px_rgba(36,83,208,0.3)]">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#dce8ff] text-[#2453d0]">
                <MessageCircleMore className="size-5" strokeWidth={1.9} />
              </div>
              <div className="grid gap-1.5">
                <h2 className="m-0 text-lg font-semibold">{copy.responseTimeTitle}</h2>
                <p className="m-0 text-sm leading-6 text-[#4d6480]">{copy.responseTimeDescription}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

type FieldProps = {
  children: ReactNode
  error?: string
  htmlFor: string
  label: string
  required?: boolean
}

function Field({ children, error, htmlFor, label, required = false }: FieldProps) {
  const errorId = `${htmlFor}-error`

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-[#314860]" htmlFor={htmlFor}>
        {label} {required ? <span aria-hidden="true" className="text-[#2453d0]">*</span> : null}
      </label>
      {children}
      {error ? (
        <span className="text-sm font-medium text-[#c94b59]" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

function ScheduleRow({ day, value, muted = false }: { day: string; value: string; muted?: boolean }) {
  return (
    <div className={muted ? 'flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-3 text-[#7d8da0]' : 'flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-3'}>
      <span className="text-sm">{day}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

function inputClassName(error: string | undefined, extraClassName = '') {
  return `${error ? 'border-[#f0cfd4] bg-[#fff7f8] focus:border-[#c94b59] focus:ring-[#f8d9de]' : 'border-[#dbe4ee] bg-[#fbfdff] focus:border-[#2453d0] focus:ring-[#e8eefc]'} min-h-12 w-full border px-4 py-3 text-sm text-[#1E3A5F] outline-none transition-colors focus:ring-4 ${extraClassName}`.trim()
}
