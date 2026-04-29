export type StudentLicense =
  | string
  | {
      code: string
      name?: string | null
    }

export type SchoolAdminStudent = {
  id: string
  email: string
  full_name: string
  document_id?: string | null
  phone?: string | null
  licenses?: StudentLicense[] | null
  active: boolean
  created_at: string | null
  updated_at: string | null
  tests_completed?: number | null
  tests_this_week?: number | null
  pass_rate_pct?: number | null
  average_score?: number | null
  last_activity_at?: string | null
}

export type PaginatedStudentsResponse = {
  items: SchoolAdminStudent[]
  total: number
  limit: number
  offset: number
}

export type CreateStudentInput = {
  email: string
  full_name: string
  password: string
  licenses: string[]
}

export type CreateStudentResponse = {
  student: SchoolAdminStudent
}

export type StudentsListFilters = {
  active?: boolean
  license?: string
  limit?: number
  offset?: number
}
