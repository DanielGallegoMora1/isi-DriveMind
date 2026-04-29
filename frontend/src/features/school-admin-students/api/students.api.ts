import { env } from '../../../config/env'
import { requestJson } from '../../../lib/http'
import type { CreateStudentInput, CreateStudentResponse, PaginatedStudentsResponse, StudentsListFilters } from '../types'

const studentsBaseUrl = `${env.authServiceUrl}/v1/auth/students`
const statsBaseUrl = `${env.coreServiceUrl}/v1/stats`

type ApiStudent = PaginatedStudentsResponse['items'][number] & {
  active?: boolean
  is_active?: boolean
}

type ApiCreateStudentResponse =
  | ApiStudent
  | {
      student: ApiStudent
    }

type ApiStudentStatsResponse = {
  summary: {
    total_tests: number
    pass_rate_pct: number
    average_score: number
    last_activity_at: string | null
  }
  weekly_activity?: Array<{
    date: string
    tests: number
  }>
}

type StudentStatsSnapshot = {
  tests_completed: number
  tests_this_week: number
  pass_rate_pct: number
  average_score: number
  last_activity_at: string | null
}

function normalizeStudent(student: ApiStudent) {
  return {
    ...student,
    active: student.active ?? student.is_active ?? false,
  }
}

async function fetchStudentStats(token: string, studentId: string): Promise<StudentStatsSnapshot | null> {
  try {
    const response = await requestJson<ApiStudentStatsResponse>(`${statsBaseUrl}?student_id=${encodeURIComponent(studentId)}`, {
      token,
    })

    return {
      tests_completed: Number(response.summary.total_tests ?? 0),
      tests_this_week: (response.weekly_activity ?? []).reduce((total, item) => total + Number(item.tests ?? 0), 0),
      pass_rate_pct: Number(response.summary.pass_rate_pct ?? 0),
      average_score: Number(response.summary.average_score ?? 0),
      last_activity_at: response.summary.last_activity_at ?? null,
    }
  } catch {
    return null
  }
}

function normalizeStudentsResponse(payload: { items: ApiStudent[]; total: number; limit: number; offset: number }): PaginatedStudentsResponse {
  return {
    ...payload,
    items: payload.items.map(normalizeStudent),
  }
}

export async function listStudents(token: string, filters: StudentsListFilters = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('limit', String(filters.limit ?? 100))
  searchParams.set('offset', String(filters.offset ?? 0))

  if (filters.active != null) {
    searchParams.set('active', String(filters.active))
  }

  if (filters.license) {
    searchParams.set('license', filters.license)
  }

  const response = await requestJson<{ items: ApiStudent[]; total: number; limit: number; offset: number }>(
    `${studentsBaseUrl}?${searchParams.toString()}`,
    {
      token,
    },
  )

  const normalized = normalizeStudentsResponse(response)

  if (!token || normalized.items.length === 0) {
    return normalized
  }

  const statsSnapshots = await Promise.all(normalized.items.map((student) => fetchStudentStats(token, student.id)))

  return {
    ...normalized,
    items: normalized.items.map((student, index) => ({
      ...student,
      ...(statsSnapshots[index] ?? {}),
    })),
  }
}

export async function createStudent(token: string, input: CreateStudentInput): Promise<CreateStudentResponse> {
  const response = await requestJson<ApiCreateStudentResponse>(studentsBaseUrl, {
    body: JSON.stringify(input),
    method: 'POST',
    token,
  })

  const student = 'student' in response ? response.student : response

  return {
    student: normalizeStudent(student),
  }
}
