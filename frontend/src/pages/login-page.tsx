import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/auth-context'
import { ApiError } from '../lib/http'

type LocationState = {
  from?: {
    pathname: string
  }
}

function EmailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20H6.75A2.75 2.75 0 0 1 4 17.25V6.75Zm2.2-.25 5.8 4.64 5.8-4.64H6.2Zm12.3 1.92-5.56 4.45a1.5 1.5 0 0 1-1.88 0L5.5 8.42v8.83c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V8.42Z"
        fill="currentColor"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 1.75A5.25 5.25 0 0 0 6.75 7v2.25H6A2.25 2.25 0 0 0 3.75 11.5v8A2.25 2.25 0 0 0 6 21.75h12a2.25 2.25 0 0 0 2.25-2.25v-8A2.25 2.25 0 0 0 18 9.25h-.75V7A5.25 5.25 0 0 0 12 1.75Zm3.75 7.5h-7.5V7a3.75 3.75 0 0 1 7.5 0v2.25Zm-3.75 3a1.75 1.75 0 0 1 .75 3.33v1.17a.75.75 0 0 1-1.5 0v-1.17A1.75 1.75 0 0 1 12 12.25Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        setSubmitError('No se pudo iniciar sesion con auth-service.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-layout">
      <section className="login-panel login-panel-brand">
        <div className="login-brand-decoration login-brand-decoration-large" />
        <div className="login-brand-decoration login-brand-decoration-small" />

        <div className="login-brand-content">
          <p className="eyebrow login-brand-eyebrow">DriveMind</p>
          <h1>
            Tu camino hacia el carnet de conducir <span>empieza aqui</span>
          </h1>
          <p className="login-brand-copy">
            Practica con tests reales, segui tu progreso y preparate con una experiencia clara, moderna y
            enfocada en aprobar.
          </p>

          <div className="login-brand-cta-card">
            <label className="login-brand-input" htmlFor="login-brand-demo">
              <span>Explora la plataforma</span>
              <input id="login-brand-demo" placeholder="Tu progreso empieza con una sesion" readOnly type="text" />
            </label>

            <button className="brand-button" type="button">
              Descubrir DriveMind
            </button>
          </div>

          <div className="login-brand-stats" aria-label="Metricas destacadas de la plataforma">
            <article>
              <strong>500+</strong>
              <span>alumnos activos</span>
            </article>
            <article>
              <strong>50K+</strong>
              <span>preguntas practicadas</span>
            </article>
            <article>
              <strong>92%</strong>
              <span>mejora media</span>
            </article>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-header">
            <p className="eyebrow login-form-eyebrow">Acceso</p>
            <h2>Bienvenido de nuevo</h2>
            <p>Inicia sesion con tus credenciales actuales para continuar en DriveMind.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-input-group">
              <span>Email</span>
              <div className="login-input-shell">
                <EmailIcon />
                <input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="root@admin.com"
                  type="email"
                  value={email}
                />
              </div>
            </label>

            <label className="login-input-group">
              <span>Contrasena</span>
              <div className="login-input-shell">
                <LockIcon />
                <input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="rootpwd"
                  type="password"
                  value={password}
                />
              </div>
            </label>

            <button className="login-inline-link" type="button">
              Olvidaste contrasena?
            </button>

            {submitError ? <p className="form-error">{submitError}</p> : null}

            <button className="primary-button" disabled={isSubmitting || isLoading} type="submit">
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </form>

          <div className="login-footer-links">
            <span>No tienes cuenta?</span>
            <button className="login-inline-link login-inline-link-accent" type="button">
              Registrate aqui
            </button>
          </div>

          <p className="login-help-text">El acceso sigue usando el flujo actual conectado al auth-service.</p>
        </div>
      </section>
    </div>
  )
}
