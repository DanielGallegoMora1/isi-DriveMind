import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/auth-context'

const navigationItems = [
  { to: '/', label: 'Home' },
  { to: '/tests', label: 'Tests' },
  { to: '/stats', label: 'Stats' },
  { to: '/ai-chat', label: 'AI Chat' },
]

export function AppShell() {
  const { logout, user } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">DriveMind</p>
          <h1>Learning cockpit</h1>
          <p className="sidebar-copy">
            Base frontend del sprint 1 con navegacion inicial y autenticacion minima.
          </p>
        </div>

        <nav className="nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <p className="sidebar-user-name">{user?.full_name}</p>
            <p className="sidebar-user-meta">
              {user?.role} · {user?.email}
            </p>
          </div>
          <button className="secondary-button" onClick={logout} type="button">
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
