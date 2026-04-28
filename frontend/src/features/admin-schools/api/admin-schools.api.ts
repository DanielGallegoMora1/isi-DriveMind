import { env } from '../../../config/env'
import { requestJson } from '../../../lib/http'
import type { CreateSchoolInput, CreateSchoolResponse, PaginatedSchoolsResponse, SchoolsListFilters } from '../types'

const schoolsBaseUrl = `${env.authServiceUrl}/v1/auth/schools`

export function listSchools(token: string, filters: SchoolsListFilters = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('limit', String(filters.limit ?? 20))
  searchParams.set('offset', String(filters.offset ?? 0))

  if (filters.name) {
    searchParams.set('name', filters.name)
  }

  if (filters.active != null) {
    searchParams.set('active', String(filters.active))
  }

  return requestJson<PaginatedSchoolsResponse>(`${schoolsBaseUrl}?${searchParams.toString()}`, {
    token,
  })
}

export function createSchool(token: string, input: CreateSchoolInput) {
  return requestJson<CreateSchoolResponse>(schoolsBaseUrl, {
    body: JSON.stringify(input),
    method: 'POST',
    token,
  })
}

export function deleteSchool(token: string, schoolId: string) {
  return requestJson<void>(`${schoolsBaseUrl}/${schoolId}`, {
    method: 'DELETE',
    token,
  })
}
