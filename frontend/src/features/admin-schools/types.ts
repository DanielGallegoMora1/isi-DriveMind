export type School = {
  id: string
  name: string
  email: string
  tax_id?: string | null
  address?: string | null
  phone?: string | null
  active: boolean
  created_at: string | null
  updated_at: string | null
}

export type SchoolAdminUser = {
  id: string
  email: string
  full_name: string
  role: string
  school_id: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export type SchoolsListFilters = {
  name?: string
  active?: boolean
  limit?: number
  offset?: number
}

export type PaginatedSchoolsResponse = {
  items: School[]
  total: number
  limit: number
  offset: number
}

export type CreateSchoolInput = {
  name: string
  email: string
  password: string
  tax_id?: string
  address?: string
  phone?: string
}

export type CreateSchoolResponse = {
  school: School
  admin_user: SchoolAdminUser
}
