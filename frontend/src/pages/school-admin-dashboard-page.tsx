import { useAuth } from '../features/auth'
import { SchoolAdminStudentsDashboard } from '../features/school-admin-students'

export function SchoolAdminDashboardPage() {
  const { accessToken } = useAuth()

  return <SchoolAdminStudentsDashboard accessToken={accessToken} />
}
