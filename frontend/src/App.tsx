import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { useAuth } from './features/auth/auth-context'
import { AuthProvider } from './features/auth/auth-provider'
import { AiChatPage } from './pages/ai-chat-page'
import { HomePage } from './pages/home-page'
import { LoginPage } from './pages/login-page'
import { SettingsPage } from './pages/settings-page'
import { StatsPage } from './pages/stats-page'
import { TestsPage } from './pages/tests-page'

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center px-6 py-12 text-center">
        <div>
          <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-[#7bd0ff]">
            DriveMind
          </p>
          <h1 className="mt-3 text-[#f5f7fb]">Recuperando sesión</h1>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <AppShell />
}

function LoginOnlyOutlet() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="grid min-h-svh place-items-center px-6 py-12 text-center">
        <div>
          <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-[#7bd0ff]">
            DriveMind
          </p>
          <h1 className="mt-3 text-[#f5f7fb]">Cargando acceso</h1>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate replace to="/" />
  }

  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<LoginOnlyOutlet />}>
        <Route element={<LoginPage />} path="/login" />
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route element={<HomePage />} path="/" />
        <Route element={<TestsPage />} path="/tests" />
        <Route element={<StatsPage />} path="/stats" />
        <Route element={<AiChatPage />} path="/ai-chat" />
        <Route element={<SettingsPage />} path="/settings" />
      </Route>

      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
