import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { useAuth } from './features/auth/auth-context'
import { getRoleHomePath, hasAllowedRole } from './features/auth/student-access'
import type { UserRole } from './features/auth/types'
import { useI18n } from './features/i18n'

function SessionLoadingView({ message }: { message: string }) {
  return (
    <div className="grid min-h-svh place-items-center px-6 py-12 text-center">
      <div>
        <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-[#7bd0ff]">
          DriveMind
        </p>
        <h1 className="mt-3 text-[#f5f7fb]">{message}</h1>
      </div>
    </div>
  )
}

export function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const { language } = useI18n()

  if (isLoading) {
    const copy = language === 'en' ? 'Restoring session' : 'Recuperando sesión'

    return <SessionLoadingView message={copy} />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <AppShell />
}

type RoleProtectedLayoutProps = {
  allowedRoles: UserRole[]
  fallbackPath?: string
}

export function RoleProtectedLayout({ allowedRoles, fallbackPath = '/' }: RoleProtectedLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  const { language } = useI18n()

  if (isLoading) {
    const copy = language === 'en' ? 'Restoring session' : 'Recuperando sesión'

    return <SessionLoadingView message={copy} />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (!hasAllowedRole(user, allowedRoles)) {
    return <Navigate replace to={fallbackPath || getRoleHomePath(user?.role)} />
  }

  return <AppShell />
}

export function LoginOnlyOutlet() {
  const { isAuthenticated, isLoading } = useAuth()
  const { language } = useI18n()

  if (isLoading) {
    const copy = language === 'en' ? 'Loading access' : 'Cargando acceso'

    return <SessionLoadingView message={copy} />
  }

  if (isAuthenticated) {
    return <Navigate replace to="/" />
  }

  return <Outlet />
}
