import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth'
import { DashboardTestFlow } from '../features/stats'

export function TestsPage() {
  const navigate = useNavigate()
  const { accessToken } = useAuth()

  return <DashboardTestFlow accessToken={accessToken} onBackToDashboard={() => navigate('/')} />
}
