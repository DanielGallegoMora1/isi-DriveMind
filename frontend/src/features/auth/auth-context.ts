import { createContext, useContext } from 'react'
import type { AuthUser } from './types'

type LoginValues = {
  email: string
  password: string
}

type ChangePasswordValues = {
  currentPassword: string
  newPassword: string
}

export type AuthContextValue = {
  accessToken: string | null
  changePassword: (values: ChangePasswordValues) => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  login: (values: LoginValues) => Promise<void>
  logout: () => void
  user: AuthUser | null
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
