import { createContext, useContext } from 'react'
import type { AuthUser } from '../../types/auth'

type LoginValues = {
  email: string
  password: string
}

export type AuthContextValue = {
  accessToken: string | null
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
