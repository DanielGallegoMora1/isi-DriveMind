import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/auth-context'
import { AiChatIcon, HomeIcon, StatsIcon, TestsIcon } from './icons'
import { Button } from './ui/button'

const navigationItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/tests', label: 'Tests', icon: TestsIcon },
  { to: '/stats', label: 'Stats', icon: StatsIcon },
  { to: '/ai-chat', label: 'AI Chat', icon: AiChatIcon },
]

export function AppShell() {
  const { logout, user } = useAuth()

  return (
    <div className="grid min-h-svh grid-cols-[300px_1fr] max-[960px]:grid-cols-1">
      <aside
        className="flex flex-col justify-between border-r border-[rgba(141,177,229,0.1)] p-8 max-[960px]:p-6"
        style={{ background: 'rgba(7,15,27,0.86)', backdropFilter: 'blur(20px)' }}
      >
        <div>
          <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-[#7bd0ff]">
            DriveMind
          </p>
          <h1 className="my-3 text-[2rem] leading-none text-[#f5f7fb]">
            Learning cockpit
          </h1>
          <p className="text-[#9fb2cc] text-sm">
            Prepara tu carnet. Practica, analiza, mejora.
          </p>
        </div>

        <nav className="my-8 grid gap-2.5">
          {navigationItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[14px] border px-4 py-3.5 text-sm transition-all duration-200 ${
                  isActive
                    ? 'border-[rgba(123,208,255,0.28)] bg-[rgba(123,208,255,0.12)] text-[#f5f7fb]'
                    : 'border-transparent text-[#b9c7da] hover:border-[rgba(123,208,255,0.28)] hover:bg-[rgba(123,208,255,0.12)] hover:text-[#f5f7fb]'
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="grid gap-4">
          <div>
            <p className="m-0 font-semibold text-white">{user?.full_name}</p>
            <p className="m-0 text-sm text-[#9fb2cc]">
              {user?.role} · {user?.email}
            </p>
          </div>
          <Button variant="secondary" onClick={logout} type="button">
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="p-8 max-[960px]:p-6">
        <Outlet />
      </main>
    </div>
  )
}
