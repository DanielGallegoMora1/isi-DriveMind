import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/auth-context'
import { useI18n } from '../features/i18n'
import { ApiError } from '../lib/http'
import { EmailIcon, LockIcon } from '../components/icons'
import { Button } from '../components/ui/button'

type LocationState = {
  from?: {
    pathname: string
  }
}

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const { language } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const copy = language === 'en'
    ? {
        heroTitle: 'Your path to a driving licence starts here',
        heroHighlight: 'starts here',
        heroDescription: 'Practice with real tests, track your progress, and get ready with a clear, modern experience focused on passing.',
        heroMetricsLabel: 'Featured platform metrics',
        heroStats: [
          { value: '500+', label: 'active students' },
          { value: '50K+', label: 'questions practiced' },
          { value: '92%', label: 'average improvement' },
        ],
        access: 'Access',
        welcome: 'Welcome back',
        description: 'Sign in with your current credentials to continue in DriveMind.',
        email: 'Email',
        emailPlaceholder: 'email@example.com',
        password: 'Password',
        loginError: 'Could not sign in with auth-service.',
        submitting: 'Signing in...',
        submit: 'Sign in',
      }
    : {
        heroTitle: 'Tu camino hacia el carné de conducir empieza aquí',
        heroHighlight: 'empieza aquí',
        heroDescription: 'Practica con tests reales, sigue tu progreso y prepárate con una experiencia clara, moderna y enfocada en aprobar.',
        heroMetricsLabel: 'Métricas destacadas de la plataforma',
        heroStats: [
          { value: '500+', label: 'alumnos activos' },
          { value: '50K+', label: 'preguntas practicadas' },
          { value: '92%', label: 'mejora media' },
        ],
        access: 'Acceso',
        welcome: 'Bienvenido de nuevo',
        description: 'Inicia sesión con tus credenciales actuales para continuar en DriveMind.',
        email: 'Email',
        emailPlaceholder: 'email@ejemplo.com',
        password: 'Contraseña',
        loginError: 'No se pudo iniciar sesión con auth-service.',
        submitting: 'Ingresando...',
        submit: 'Iniciar sesión',
      }

  if (!isLoading && isAuthenticated) {
    const state = location.state as LocationState | null
    return <Navigate replace to={state?.from?.pathname ?? '/'} />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
      const state = location.state as LocationState | null
      navigate(state?.from?.pathname ?? '/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message)
      } else {
        setSubmitError(copy.loginError)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh grid-cols-[1.15fr_0.85fr] max-[960px]:grid-cols-1">
      {/* Panel izquierdo — Brand */}
      <section
        className="relative overflow-hidden flex items-center justify-center p-12 max-[960px]:items-start max-[960px]:p-6"
        style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb, #22c55e)' }}
      >
        {/* Decoraciones */}
        <div className="pointer-events-none absolute top-[6%] right-[-80px] size-60 rounded-full bg-white/20" />
        <div className="pointer-events-none absolute bottom-[10%] right-[18%] size-36 rounded-full bg-white/10" />

        <div className="relative z-10 grid w-full max-w-[640px] gap-6">
          <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-white/84">
            DriveMind
          </p>

          <h1 className="m-0 max-w-[11ch] text-[clamp(3rem,6vw,5rem)] leading-[0.96] text-white max-[640px]:max-w-none max-[640px]:text-[clamp(2.4rem,11vw,3.3rem)]">
            {copy.heroTitle.replace(` ${copy.heroHighlight}`, '')}{' '}
            <span className="text-[#4ade80]">{copy.heroHighlight}</span>
          </h1>

          <p className="m-0 max-w-[54ch] text-[1.02rem] text-[#d1d5db]">
            {copy.heroDescription}
          </p>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-[18px] max-[640px]:grid-cols-1 max-[640px]:gap-4"
            aria-label={copy.heroMetricsLabel}
          >
            {copy.heroStats.map((stat) => (
              <article key={stat.label} className="grid gap-1">
                <strong className="block text-[clamp(1.75rem,3vw,2.35rem)] leading-none text-white">
                  {stat.value}
                </strong>
                <span className="text-[#d1d5db] text-sm">{stat.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Panel derecho — Form */}
      <section className="flex items-center justify-center bg-[#f3f4f6] p-12 max-[960px]:p-6 max-[640px]:p-5">
        <div className="w-full max-w-[460px] rounded-[28px] border border-[#e5e7eb] bg-white p-10 shadow-[0_28px_80px_rgba(15,23,42,0.14)] max-[640px]:p-6">
          <div>
            <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-blue-600">
              {copy.access}
            </p>
            <h2 className="mt-3 mb-2 text-[clamp(2rem,4vw,2.8rem)] leading-none text-[#111827]">
              {copy.welcome}
            </h2>
            <p className="m-0 text-[#6b7280]">
              {copy.description}
            </p>
          </div>

          <form className="mt-7 grid gap-[18px]" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-[0.95rem] text-[#374151]">
              <span>{copy.email}</span>
              <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 transition-all duration-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
                <EmailIcon className="size-[18px] shrink-0 text-[#9ca3af]" />
                <input
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={copy.emailPlaceholder}
                  type="email"
                  value={email}
                  className="w-full border-0 bg-transparent py-[15px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                />
              </div>
            </label>

            <label className="grid gap-2 text-[0.95rem] text-[#374151]">
              <span>{copy.password}</span>
              <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 transition-all duration-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
                <LockIcon className="size-[18px] shrink-0 text-[#9ca3af]" />
                <input
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  className="w-full border-0 bg-transparent py-[15px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                />
              </div>
            </label>
            {submitError ? (
              <p className="m-0 text-[0.95rem] text-red-600">{submitError}</p>
            ) : null}

            <Button
              variant="primary"
              disabled={isSubmitting || isLoading}
              type="submit"
              className="w-full"
            >
               {isSubmitting ? copy.submitting : copy.submit}
             </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
