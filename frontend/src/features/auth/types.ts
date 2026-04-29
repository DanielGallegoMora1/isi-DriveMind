export type UserRole = 'student' | 'school_admin' | 'system_admin'

export type AuthUserLicense =
  | string
  | {
      code: string
      name?: string | null
    }

export type AuthUser = {
  id: string
  email: string
  full_name: string
  role: UserRole | string
  licenses?: AuthUserLicense[] | null
  school_id: string | null
  school_name?: string | null
  phone?: string | null
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

export type ChangePasswordRequest = {
  current_password: string
  new_password: string
}

export type ChangePasswordResponse = {
  message: string
}
