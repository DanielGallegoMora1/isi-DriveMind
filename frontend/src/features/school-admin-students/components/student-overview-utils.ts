import type { SchoolAdminStudent } from '../types'

export function getStudentInitials(fullName: string) {
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'DM'
}

export function getStudentLicenseCodes(student: SchoolAdminStudent) {
  const licenses = student.licenses ?? []
  const normalized = licenses
    .map((license) => (typeof license === 'string' ? license : license.code))
    .filter(Boolean)

  return normalized.length > 0 ? normalized : ['—']
}

export function formatJoinedDate(value: string | null) {
  return formatStudentDate(value, 'fecha pendiente')
}

export function formatEnrollmentDate(value: string | null) {
  return formatStudentDate(value, 'Fecha pendiente')
}

export function formatLastActivity(student: SchoolAdminStudent) {
  const referenceDate = student.last_activity_at ?? student.updated_at ?? student.created_at

  if (!referenceDate) {
    return 'Sin actividad reciente'
  }

  const date = new Date(referenceDate)

  if (Number.isNaN(date.getTime())) {
    return 'Sin actividad reciente'
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfTarget.getTime()) / 86_400_000)
  const timeText = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

  if (diffDays <= 0) {
    return `Hoy, ${timeText}`
  }

  if (diffDays === 1) {
    return `Ayer, ${timeText}`
  }

  return `Hace ${diffDays} días`
}

export function formatAverageScore(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return '—'
  }

  return value.toFixed(1)
}

export function formatTestsCompleted(value: number | null | undefined) {
  return String(value ?? 0)
}

export function getDerivedAverageTime(student: SchoolAdminStudent) {
  const completedTests = Math.max(0, Number(student.tests_completed ?? 0))
  const weeklyActivity = Math.max(0, Number(student.tests_this_week ?? 0))
  const averageScore = typeof student.average_score === 'number' ? Math.max(0, Math.min(10, student.average_score)) : 7
  const passRate = typeof student.pass_rate_pct === 'number' ? Math.max(0, Math.min(100, student.pass_rate_pct)) : 70

  const scoreAdjustment = Math.round(averageScore / 2)
  const rhythmAdjustment = Math.min(4, Math.round(weeklyActivity / 18))
  const experienceAdjustment = Math.min(4, Math.round(completedTests / 20))
  const confidenceAdjustment = Math.round(passRate / 50)
  const estimatedMinutes = Math.max(12, 24 - scoreAdjustment - rhythmAdjustment - experienceAdjustment - confidenceAdjustment)

  return `${estimatedMinutes} min`
}

function formatStudentDate(value: string | null, fallback: string) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
