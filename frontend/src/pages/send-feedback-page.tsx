import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Info, Lightbulb, MessageSquareQuote, Sparkles, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { useAuth } from '../features/auth'
import { useI18n } from '../features/i18n'
import { feedbackTypeOptions, submitFeedback, type FeedbackType } from '../lib/send-feedback'

const DESCRIPTION_MAX_LENGTH = 1500

type FeedbackFormValues = {
  feedbackType: FeedbackType | ''
  title: string
  description: string
  rating: number
}

type FeedbackFormErrors = {
  feedbackType?: string
  title?: string
  description?: string
}

const feedbackLabels = {
  en: {
    'Sugerencia de mejora': 'Improvement suggestion',
    'Reportar un error': 'Report a bug',
    'Nueva funcionalidad': 'New feature',
    'Experiencia de usuario': 'User experience',
  },
  es: {
    'Sugerencia de mejora': 'Sugerencia de mejora',
    'Reportar un error': 'Reportar un error',
    'Nueva funcionalidad': 'Nueva funcionalidad',
    'Experiencia de usuario': 'Experiencia de usuario',
  },
} as const

export function SendFeedbackPage() {
  const { user } = useAuth()
  const { language } = useI18n()
  const copy = language === 'en'
    ? {
        back: 'Back to settings',
        title: 'Send feedback',
        description: 'Share your ideas, suggestions, and improvements for DriveMind.',
        introTitle: 'Your opinion matters',
        introText: 'every suggestion helps us prioritize improvements with more impact for students and driving schools.',
        feedbackType: 'Feedback type',
        titleLabel: 'Title',
        titlePlaceholder: 'Summarize your feedback in one sentence',
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'Tell us in detail about your idea, suggestion, or the issue you found...',
        ratingLabel: 'How would you rate your overall experience?',
        ratingGroup: 'Overall rating',
        selectedStars: (value: number) => `${value} out of 5 stars selected.`,
        optionalRating: 'Optional, but it helps us understand your experience better.',
        sending: 'Sending feedback...',
        submit: 'Send feedback',
        success: 'Thanks for sharing your feedback. We received your message successfully.',
        error: 'We could not send your feedback right now. Try again in a few minutes.',
        whyItMatters: 'Why does your feedback matter?',
        whyItMattersText: 'It helps us detect real friction, understand priorities, and make product decisions with better judgment.',
        usefulTips: 'Useful tips',
        usefulTipsText: 'The clearer you are, the easier it is to turn your feedback into actionable improvements.',
        implementedFeedback: 'Implemented feedback',
        implementedFeedbackText: 'Some signals from the latest monthly improvement cycle.',
        thisMonth: 'This month',
        total: 'Total',
        reviewedSuggestions: 'Reviewed suggestions',
        fixedErrors: 'Fixed issues',
        plannedIdeas: 'Planned ideas',
      }
    : {
        back: 'Volver a ajustes',
        title: 'Enviar feedback',
        description: 'Comparte tus ideas, sugerencias y mejoras para DriveMind',
        introTitle: 'Tu opinión nos importa',
        introText: 'cada sugerencia nos ayuda a priorizar mejoras con más impacto para estudiantes y autoescuelas.',
        feedbackType: 'Tipo de feedback',
        titleLabel: 'Título',
        titlePlaceholder: 'Resume tu feedback en una frase',
        descriptionLabel: 'Descripción',
        descriptionPlaceholder: 'Cuéntanos con detalle tu idea, sugerencia o el problema que has encontrado…',
        ratingLabel: '¿Cómo valorarías tu experiencia general?',
        ratingGroup: 'Valoración general',
        selectedStars: (value: number) => `${value} de 5 estrellas seleccionadas.`,
        optionalRating: 'Opcional, pero nos ayuda a contextualizar tu experiencia.',
        sending: 'Enviando feedback...',
        submit: 'Enviar feedback',
        success: 'Gracias por compartir tu feedback. Hemos recibido tu mensaje correctamente.',
        error: 'No pudimos enviar tu feedback en este momento. Inténtalo de nuevo en unos minutos.',
        whyItMatters: '¿Por qué tu feedback importa?',
        whyItMattersText: 'Nos permite detectar fricciones reales, entender prioridades y tomar decisiones de producto con más criterio.',
        usefulTips: 'Consejos útiles',
        usefulTipsText: 'Cuanto más claro seas, más fácil será convertir tu feedback en mejoras accionables.',
        implementedFeedback: 'Feedback implementado',
        implementedFeedbackText: 'Algunas señales del último ciclo mensual de mejoras.',
        thisMonth: 'Este mes',
        total: 'Total',
        reviewedSuggestions: 'Sugerencias revisadas',
        fixedErrors: 'Errores resueltos',
        plannedIdeas: 'Ideas planificadas',
      }

  const [values, setValues] = useState<FeedbackFormValues>({
    feedbackType: '',
    title: '',
    description: '',
    rating: 0,
  })
  const [errors, setErrors] = useState<FeedbackFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (/jsdom/i.test(window.navigator.userAgent)) {
      return
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const descriptionCounterId = 'feedback-description-counter'
  const descriptionErrorId = 'feedback-description-error'

  function updateValue(field: keyof FeedbackFormValues, value: string | number) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    setSubmitStatus(null)
  }

  function validateForm(nextValues: FeedbackFormValues) {
    const nextErrors: FeedbackFormErrors = {}

    if (!nextValues.feedbackType) {
      nextErrors.feedbackType = language === 'en' ? 'Select the feedback type.' : 'Seleccioná el tipo de feedback.'
    }

    if (!nextValues.title.trim()) {
      nextErrors.title = language === 'en' ? 'Write a short title for your feedback.' : 'Escribí un título breve para tu feedback.'
    }

    if (!nextValues.description.trim()) {
      nextErrors.description = language === 'en' ? 'Tell us the details of your feedback.' : 'Contanos el detalle de tu feedback.'
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedValues: FeedbackFormValues = {
      feedbackType: values.feedbackType,
      title: values.title.trim(),
      description: values.description.trim(),
      rating: values.rating,
    }

    const nextErrors = validateForm(trimmedValues)
    setErrors(nextErrors)
    setSubmitStatus(null)

    if (Object.keys(nextErrors).length > 0 || !trimmedValues.feedbackType) {
      return
    }

    setIsSubmitting(true)

    try {
      await submitFeedback({
        ...trimmedValues,
        feedbackType: trimmedValues.feedbackType,
        userEmail: user?.email?.trim() || undefined,
        userName: user?.full_name?.trim() || undefined,
      })

      setSubmitStatus({ type: 'success', message: copy.success })
      setValues({ feedbackType: '', title: '', description: '', rating: 0 })
    } catch {
      setSubmitStatus({ type: 'error', message: copy.error })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="grid gap-6 bg-[#f5f7fb] text-[#1E3A5F]">
      <header className="rounded-[32px] border border-[#dce5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,252,0.98))] p-5 shadow-[0_20px_45px_-30px_rgba(30,58,95,0.22)] md:p-8">
        <div className="grid gap-8">
          <div className="flex items-start justify-start">
            <Link className="inline-flex items-center gap-2 rounded-xl border border-[#dde5ef] bg-white px-4 py-2 text-sm font-semibold text-[#4b6178] shadow-[0_14px_28px_-24px_rgba(30,58,95,0.35)] transition-colors duration-200 hover:border-[#cad6e2] hover:bg-[#f9fbfd]" to="/settings">
              <ArrowLeft className="size-4" strokeWidth={2} />
              {copy.back}
            </Link>
          </div>

          <div className="grid justify-items-center gap-4 text-center">
            <div className="flex size-18 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2453d0,#5b7cff)] text-white shadow-[0_18px_36px_-24px_rgba(36,83,208,0.55)] md:size-20">
              <MessageSquareQuote className="size-8 md:size-9" strokeWidth={2} />
            </div>

            <div className="grid gap-3">
              <h1 className="m-0 text-[clamp(2rem,4vw,3rem)] leading-none">{copy.title}</h1>
              <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">{copy.description}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
        <Card as="section" className="grid gap-6 p-6 md:p-7">
          <div className="grid gap-2">
            <h2 className="m-0 text-2xl">{copy.introTitle}</h2>
            <p className="m-0 text-sm text-[#5f7287]">
              {user?.full_name ? `${user.full_name}, ` : ''}
              {copy.introText}
            </p>
          </div>

          <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
            <fieldset className="grid gap-3 border-0 p-0">
              <legend className="mb-1 text-sm font-semibold text-[#314860]">
                {copy.feedbackType} <span aria-hidden="true" className="text-[#2453d0]">*</span>
              </legend>
              <div aria-label={copy.feedbackType} className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                {feedbackTypeOptions.map((option) => {
                  const checked = values.feedbackType === option
                  const optionId = `feedback-type-${option.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                  const label = feedbackLabels[language][option]

                  return (
                    <label
                      className={checked
                        ? 'grid cursor-pointer gap-2 rounded-2xl border border-[#9ebcff] bg-[#eef4ff] px-4 py-4 text-left shadow-[0_16px_30px_-24px_rgba(36,83,208,0.28)] transition-all duration-200'
                        : 'grid cursor-pointer gap-2 rounded-2xl border border-[#dde5ef] bg-white px-4 py-4 text-left shadow-[0_12px_24px_-24px_rgba(30,58,95,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8fb1ff] hover:bg-[#f7faff] hover:shadow-[0_22px_40px_-24px_rgba(36,83,208,0.28)]'}
                      key={option}
                      htmlFor={optionId}
                    >
                      <input
                        aria-label={label}
                        checked={checked}
                        className="sr-only"
                        id={optionId}
                        name="feedback-type"
                        onChange={() => updateValue('feedbackType', option)}
                        type="radio"
                        value={option}
                      />
                      <span className="text-sm font-semibold text-[#1E3A5F]">{label}</span>
                      <span className="text-sm text-[#5f7287]">{feedbackTypeDescription(option, language)}</span>
                    </label>
                  )
                })}
              </div>
              {errors.feedbackType ? <span className="text-sm font-medium text-[#c94b59]" role="alert">{errors.feedbackType}</span> : null}
            </fieldset>

            <Field error={errors.title} htmlFor="feedback-title" label={copy.titleLabel} required>
              <input
                aria-label={copy.titleLabel}
                aria-invalid={errors.title ? 'true' : 'false'}
                className={inputClassName(errors.title, 'rounded-xl')}
                id="feedback-title"
                onChange={(event) => updateValue('title', event.target.value)}
                placeholder={copy.titlePlaceholder}
                type="text"
                value={values.title}
              />
            </Field>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[#314860]" htmlFor="feedback-description">
                {copy.descriptionLabel} <span aria-hidden="true" className="text-[#2453d0]">*</span>
              </label>
              <textarea
                aria-label={copy.descriptionLabel}
                aria-describedby={errors.description ? `${descriptionCounterId} ${descriptionErrorId}` : descriptionCounterId}
                aria-invalid={errors.description ? 'true' : 'false'}
                className={inputClassName(errors.description, 'min-h-44 resize-y rounded-xl px-4 py-4')}
                id="feedback-description"
                maxLength={DESCRIPTION_MAX_LENGTH}
                onChange={(event) => updateValue('description', event.target.value)}
                placeholder={copy.descriptionPlaceholder}
                value={values.description}
              />
              <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
                <span className={DESCRIPTION_MAX_LENGTH - values.description.length < 120 ? 'text-[#2453d0]' : 'text-[#5f7287]'} id={descriptionCounterId}>
                  {values.description.length} / {DESCRIPTION_MAX_LENGTH}
                </span>
                {errors.description ? (
                  <span className="font-medium text-[#c94b59]" id={descriptionErrorId} role="alert">
                    {errors.description}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3">
              <p className="m-0 text-sm font-semibold text-[#314860]">{copy.ratingLabel}</p>
              <div aria-label={copy.ratingGroup} className="flex flex-wrap gap-2" role="group">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1
                  const active = value <= values.rating

                  return (
                    <button
                      aria-label={language === 'en' ? `Rate ${value} star${value === 1 ? '' : 's'}` : `Valorar con ${value} estrella${value === 1 ? '' : 's'}`}
                      aria-pressed={values.rating === value}
                      className={active
                        ? 'inline-flex size-12 items-center justify-center rounded-xl border border-[#f2d27a] bg-[#fff7d6] text-[#d49b00] transition-colors hover:bg-[#fff2bb]'
                        : 'inline-flex size-12 items-center justify-center rounded-xl border border-[#dde5ef] bg-white text-[#8fa1b4] transition-colors hover:border-[#c8d7e6] hover:bg-[#fafcff]'}
                      key={value}
                      onClick={() => updateValue('rating', value)}
                      type="button"
                    >
                      <Star className={active ? 'size-5 fill-current' : 'size-5'} strokeWidth={1.9} />
                    </button>
                  )
                })}
              </div>
              <p className="m-0 text-sm text-[#5f7287]">
                {values.rating > 0 ? copy.selectedStars(values.rating) : copy.optionalRating}
              </p>
            </div>

            {submitStatus ? (
              <div className={submitStatus.type === 'success' ? 'rounded-[20px] border border-[#cce9d9] bg-[#f1faf5] px-4 py-3 text-sm text-[#24543d]' : 'rounded-[20px] border border-[#f0cfd4] bg-[#fff7f8] px-4 py-3 text-sm text-[#a53849]'} role="status">
                {submitStatus.message}
              </div>
            ) : null}

            <div>
              <button className="inline-flex min-h-13 w-full items-center justify-center rounded-xl border-0 bg-[#2453d0] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_32px_-22px_rgba(36,83,208,0.55)] transition-colors duration-200 hover:bg-[#1e46b1] disabled:cursor-progress disabled:opacity-70" disabled={isSubmitting} type="submit">
                {isSubmitting ? copy.sending : copy.submit}
              </button>
            </div>
          </form>
        </Card>

        <div className="grid gap-5 self-start lg:sticky lg:top-6">
          <Card as="aside" className="grid gap-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#ebf3ff] text-[#2453d0]">
                <Lightbulb className="size-5" strokeWidth={1.9} />
              </div>
              <div className="grid gap-1.5">
                <h2 className="m-0 text-lg font-semibold">{copy.whyItMatters}</h2>
                <p className="m-0 text-sm text-[#6a7d90]">{copy.whyItMattersText}</p>
              </div>
            </div>
          </Card>

          <Card as="aside" className="grid gap-4 border-[#eadffd] bg-[#faf7ff] p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#efe7ff] text-[#7c3aed]">
                <Info className="size-5" strokeWidth={1.9} />
              </div>
              <div className="grid gap-1.5">
                <h2 className="m-0 text-lg font-semibold">{copy.usefulTips}</h2>
                <p className="m-0 text-sm text-[#6a7d90]">{copy.usefulTipsText}</p>
              </div>
            </div>

            <ul className="m-0 grid gap-2 pl-5 text-sm text-[#5c5b78]">
              <li>{language === 'en' ? 'Explain what you wanted to do and what you expected to get.' : 'Explica qué querías hacer y qué esperabas obtener.'}</li>
              <li>{language === 'en' ? 'Describe the real impact on your study or daily workflow.' : 'Describe el impacto real en tu estudio o en tu flujo diario.'}</li>
              <li>{language === 'en' ? 'If it is a bug, add concrete steps to reproduce it.' : 'Si es un bug, añade pasos concretos para reproducirlo.'}</li>
            </ul>
          </Card>

          <aside className="grid gap-5 rounded-[24px] border border-[#2f7b5c] bg-[linear-gradient(180deg,#2e7d5b,#235944)] p-6 text-white shadow-[0_24px_50px_-30px_rgba(35,89,68,0.7)]">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase text-white/90">
                  <Sparkles className="size-3.5" strokeWidth={2} />
                  {copy.implementedFeedback}
                </div>
                <p className="m-0 text-sm text-white/80">{copy.implementedFeedbackText}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <MetricCard label={copy.thisMonth} value="14" />
              <MetricCard label={copy.total} value="86" />
            </div>

            <div className="grid gap-3">
              <ProgressRow label={copy.reviewedSuggestions} value={78} />
              <ProgressRow label={copy.fixedErrors} value={64} />
              <ProgressRow label={copy.plannedIdeas} value={52} />
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function feedbackTypeDescription(option: FeedbackType, language: 'es' | 'en') {
  if (language === 'en') {
    switch (option) {
      case 'Sugerencia de mejora':
        return 'Improve an existing feature or part of the current flow.'
      case 'Reportar un error':
        return 'Report crashes, bugs, or unexpected behavior.'
      case 'Nueva funcionalidad':
        return 'Propose a capability that does not exist on the platform today.'
      case 'Experiencia de usuario':
        return 'Share impressions about clarity, navigation, and ease of use.'
    }
  }

  switch (option) {
    case 'Sugerencia de mejora':
      return 'Optimiza una funcionalidad existente o una parte del flujo actual.'
    case 'Reportar un error':
      return 'Comunica fallos, bloqueos o comportamientos inesperados.'
    case 'Nueva funcionalidad':
      return 'Propón una capacidad nueva que hoy no existe en la plataforma.'
    case 'Experiencia de usuario':
      return 'Comparte sensaciones sobre claridad, navegación y facilidad de uso.'
  }
}

function Field({ htmlFor, label, children, error, required = false }: { htmlFor: string; label: string; children: ReactNode; error?: string; required?: boolean }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-[#314860]" htmlFor={htmlFor}>
        {label} {required ? <span aria-hidden="true" className="text-[#2453d0]">*</span> : null}
      </label>
      {children}
      {error ? <span className="text-sm font-medium text-[#c94b59]" role="alert">{error}</span> : null}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-[2px]">
      <p className="m-0 text-sm text-white/74">{label}</p>
      <p className="mt-2 mb-0 text-3xl font-semibold">{value}</p>
    </div>
  )
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm text-white/88">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/14">
        <div className="h-full rounded-full bg-white/80" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
    </div>
  )
}

function inputClassName(error: string | undefined, extraClassName = '') {
  return `${error ? 'border-[#f0cfd4] bg-[#fff7f8] focus:border-[#c94b59] focus:ring-[#f8d9de]' : 'border-[#dbe4ee] bg-[#fbfdff] focus:border-[#2453d0] focus:ring-[#e8eefc]'} min-h-12 w-full border px-4 py-3 text-sm text-[#1E3A5F] outline-none transition-colors focus:ring-4 ${extraClassName}`.trim()
}
