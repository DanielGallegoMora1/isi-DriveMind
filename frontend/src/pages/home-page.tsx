import { useState } from 'react'
import { useAuth } from '../features/auth'
import { DashboardTestFlow, StatsOverview } from '../features/stats'

type HomeView = 'dashboard' | 'test-flow'

export function HomePage() {
  const { accessToken, user } = useAuth()
  const [view, setView] = useState<HomeView>('dashboard')

  if (view === 'test-flow') {
    return <DashboardTestFlow accessToken={accessToken} onBackToDashboard={() => setView('dashboard')} />
  }

  return <StatsOverview accessToken={accessToken} user={user} onStartTest={() => setView('test-flow')} />
}
