import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { useAuth } from './features/auth/auth-context'
import { AuthProvider } from './features/auth/auth-provider'
import { AiChatPage } from './pages/ai-chat-page'
import { HomePage } from './pages/home-page'
import { LoginPage } from './pages/login-page'
import { StatsPage } from './pages/stats-page'
import { TestsPage } from './pages/tests-page'

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="screen-state">
        <p className="eyebrow">DriveMind</p>
        <h1>Recuperando sesion</h1>
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
      <div className="screen-state">
        <p className="eyebrow">DriveMind</p>
        <h1>Cargando acceso</h1>
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
