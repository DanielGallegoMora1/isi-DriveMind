import { useAuth } from '../features/auth'
import { AdminSchoolsDashboard } from '../features/admin-schools'

export function AdminDashboardPage() {
  const { accessToken } = useAuth()

  return <AdminSchoolsDashboard accessToken={accessToken} />
}
