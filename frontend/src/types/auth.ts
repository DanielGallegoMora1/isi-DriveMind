export type UserRole = 'student' | 'school_admin' | 'system_admin'

export type AuthUser = {
  id: string
  email: string
  full_name: string
  role: UserRole | string
  school_id: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}
