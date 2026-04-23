import { useState } from 'react'
import { useAuth } from '../features/auth'
import { DashboardTestFlow } from '../features/stats'
import { MyTestsOverview } from '../features/tests'

type TestsView = 'overview' | 'test-flow'

export function TestsPage() {
  const { accessToken } = useAuth()
  const [view, setView] = useState<TestsView>('overview')

  if (view === 'test-flow') {
    return (
      <DashboardTestFlow
        accessToken={accessToken}
        backButtonLabel="Volver a Mis Tests"
        onBackToDashboard={() => setView('overview')}
      />
    )
  }

  return <MyTestsOverview accessToken={accessToken} onStartTest={() => setView('test-flow')} />
}
