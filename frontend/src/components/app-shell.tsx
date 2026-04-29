import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth'
import { getStudentPermitSummary } from '../features/auth/student-access'
import { formatRole, useI18n } from '../features/i18n'
import { LogOut } from 'lucide-react'
import { AiChatIcon, HomeIcon, SettingsIcon, StatsIcon, TestsIcon } from './icons'
import { Button } from './ui/button'

export function AppShell() {
  const { logout, user } = useAuth()
  const { language } = useI18n()
  const isSystemAdmin = user?.role === 'system_admin'
  const isSchoolAdmin = user?.role === 'school_admin'
  const initials = (user?.full_name ?? 'DM')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('')
  const studentPermitSummary = getStudentPermitSummary(user, language)
  const navigationItems = isSystemAdmin
    ? language === 'en'
      ? [
          { to: '/admin', label: 'Driving schools', icon: HomeIcon },
          { to: '/settings', label: 'Settings', icon: SettingsIcon },
        ]
      : [
          { to: '/admin', label: 'Autoescuelas', icon: HomeIcon },
          { to: '/settings', label: 'Ajustes', icon: SettingsIcon },
        ]
    : isSchoolAdmin
      ? [
          { to: '/school-admin', label: 'Gestión de alumnos', icon: HomeIcon },
          { to: '/settings', label: 'Ajustes', icon: SettingsIcon },
        ]
    : language === 'en'
      ? [
          { to: '/', label: 'Home', icon: HomeIcon },
          { to: '/ai-chat', label: 'DriveMind AI Assistant', icon: AiChatIcon },
          { to: '/tests', label: 'My Tests', icon: TestsIcon },
          { to: '/stats', label: 'Statistics', icon: StatsIcon },
          { to: '/settings', label: 'Settings', icon: SettingsIcon },
        ]
      : [
          { to: '/', label: 'Inicio', icon: HomeIcon },
          { to: '/ai-chat', label: 'Asistente IA de DriveMind', icon: AiChatIcon },
          { to: '/tests', label: 'Mis Tests', icon: TestsIcon },
          { to: '/stats', label: 'Estadísticas', icon: StatsIcon },
          { to: '/settings', label: 'Ajustes', icon: SettingsIcon },
        ]
  const subtitle = isSystemAdmin
    ? formatRole(user?.role, language)
    : isSchoolAdmin
      ? user?.school_name?.trim() || 'Autoescuela asignada'
      : studentPermitSummary
        ? `${formatRole(user?.role, language)} · ${studentPermitSummary}`
        : formatRole(user?.role, language)
  const copy = isSystemAdmin
    ? language === 'en'
      ? {
          title: 'System admin dashboard',
          description: 'Manage driving schools and platform access from one secured workspace.',
          logout: 'Log out',
        }
      : {
          title: 'Panel de administración',
          description: 'Gestiona autoescuelas y accesos de la plataforma desde un espacio seguro.',
          logout: 'Cerrar sesión',
        }
    : isSchoolAdmin
      ? {
          title: 'DriveMind',
          description: 'Gestión de alumnos para autoescuelas',
          logout: 'Cerrar sesión',
        }
    : language === 'en'
      ? {
          title: 'Student dashboard',
          description: 'Your daily panel to practice, review progress, and keep your streak alive.',
          logout: 'Log out',
        }
      : {
          title: 'Panel del alumno',
          description: 'Tu panel diario para practicar, revisar el progreso y mantener la racha.',
          logout: 'Cerrar sesión',
        }

  return (
    <div className="min-h-svh bg-[#F5F7FA] text-[#1E3A5F] lg:grid lg:grid-cols-[280px_1fr]">
      <aside
        className="flex flex-col justify-between border-r border-[#d9e2ec] bg-white p-6 lg:sticky lg:top-0 lg:h-svh"
      >
        <div className="grid gap-8">
          <div>
            <p className="m-0 text-[0.78rem] font-bold tracking-[0.18em] uppercase text-[#2C5F8A]">DriveMind</p>
            <h1 className="my-3 text-[2rem] leading-none text-[#1E3A5F]">{copy.title}</h1>
            <p className="m-0 text-sm text-[#5f7287]">{copy.description}</p>
          </div>

          <nav className="grid gap-2.5">
            {navigationItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[18px] border px-4 py-3.5 text-sm transition-all duration-200 ${
                    isActive
                      ? 'border-[#cddaea] bg-[#edf3f8] text-[#1E3A5F] shadow-[0_18px_30px_-24px_rgba(30,58,95,0.45)]'
                      : 'border-transparent text-[#5f7287] hover:border-[#d8e3ee] hover:bg-[#f7fafd] hover:text-[#1E3A5F]'
                  }`
                }
              >
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="grid gap-4 rounded-[24px] bg-[#f7fafd] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 min-h-12 min-w-12 shrink-0 aspect-square items-center justify-center rounded-full bg-[#1E3A5F] text-sm leading-none font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="m-0 font-semibold text-[#1E3A5F]">{user?.full_name}</p>
              <p className="m-0 text-sm text-[#5f7287]">{subtitle}</p>
            </div>
          </div>
          <Button className="w-full bg-[#c94b59] text-white hover:bg-[#b53c4a]" variant="primary" onClick={logout} type="button">
            <span className="inline-flex items-center gap-2">
              <LogOut className="size-4" strokeWidth={2} />
              {copy.logout}
            </span>
          </Button>
        </div>
      </aside>

      <main className="p-5 md:p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  )
}
