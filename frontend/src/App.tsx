import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginOnlyOutlet, ProtectedLayout } from './app-route-gates'
import { AuthProvider } from './features/auth/auth-provider'
import { I18nProvider } from './features/i18n'
import { AiChatPage } from './pages/ai-chat-page'
import { ContactSupportPage } from './pages/contact-support-page'
import { HomePage } from './pages/home-page'
import { HelpCenterPage } from './pages/help-center-page'
import { LoginPage } from './pages/login-page'
import { PrivacyPolicyPage } from './pages/privacy-policy-page'
import { SendFeedbackPage } from './pages/send-feedback-page'
import { SettingsPage } from './pages/settings-page'
import { StatsPage } from './pages/stats-page'
import { TermsAndConditionsPage } from './pages/terms-and-conditions-page'
import { TestsPage } from './pages/tests-page'

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
        <Route element={<HelpCenterPage />} path="/settings/help-center" />
        <Route element={<ContactSupportPage />} path="/settings/contact-support" />
        <Route element={<SendFeedbackPage />} path="/settings/send-feedback" />
        <Route element={<PrivacyPolicyPage />} path="/settings/privacy-policy" />
        <Route element={<TermsAndConditionsPage />} path="/settings/terms-and-conditions" />
      </Route>

      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
