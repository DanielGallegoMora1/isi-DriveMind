import { useState } from 'react'
import { useAuth } from '../features/auth'
import { useI18n } from '../features/i18n'
import { DashboardTestFlow } from '../features/stats'
import { MyTestsOverview } from '../features/tests'

type TestsView = 'overview' | 'test-flow'

export function TestsPage() {
  const { accessToken } = useAuth()
  const { language } = useI18n()
  const [view, setView] = useState<TestsView>('overview')

  if (view === 'test-flow') {
    return (
        <DashboardTestFlow
          accessToken={accessToken}
          backButtonLabel={language === 'en' ? 'Back to My Tests' : 'Volver a Mis Tests'}
          onBackToDashboard={() => setView('overview')}
        />
      )
  }

  return <MyTestsOverview accessToken={accessToken} onStartTest={() => setView('test-flow')} />
}
