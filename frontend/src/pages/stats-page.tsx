import { useAuth } from '../features/auth'
import { StatsAnalyticsDashboard } from '../features/stats'

export function StatsPage() {
  const { accessToken } = useAuth()

  return <StatsAnalyticsDashboard accessToken={accessToken} />
}
