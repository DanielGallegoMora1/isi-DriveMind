import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import * as authRequest from './api/auth.api'
import type { AuthUser } from './types'

type AuthStatus = 'loading' | 'guest' | 'authenticated'

type StoredAuth = {
  accessToken: string
  user: AuthUser
}

const AUTH_STORAGE_KEY = 'drivemind.auth'

function readStoredAuth(): StoredAuth | null {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as StoredAuth
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function writeStoredAuth(value: StoredAuth | null) {
  if (!value) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value))
}

function getInitialAuthState() {
  const storedAuth = readStoredAuth()

  return {
    accessToken: storedAuth?.accessToken ?? null,
    status: storedAuth ? ('loading' as const) : ('guest' as const),
    user: storedAuth?.user ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialState = getInitialAuthState()
  const [status, setStatus] = useState<AuthStatus>(initialState.status)
  const [accessToken, setAccessToken] = useState<string | null>(initialState.accessToken)
  const [user, setUser] = useState<AuthUser | null>(initialState.user)

  useEffect(() => {
    if (!accessToken) {
      return
    }

    let cancelled = false

    const restoreSession = async () => {
      try {
        const currentUser = await authRequest.getCurrentUser(accessToken)

        if (cancelled) {
          return
        }

        setUser(currentUser)
        writeStoredAuth({ accessToken, user: currentUser })
        setStatus('authenticated')
      } catch {
        if (cancelled) {
          return
        }

        writeStoredAuth(null)
        setAccessToken(null)
        setUser(null)
        setStatus('guest')
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  async function login(values: { email: string; password: string }) {
    const response = await authRequest.login(values)

    setAccessToken(response.access_token)
    setUser(response.user)
    setStatus('authenticated')
    writeStoredAuth({ accessToken: response.access_token, user: response.user })
  }

  async function changePassword(values: { currentPassword: string; newPassword: string }) {
    if (!accessToken) {
      throw new Error('Tu sesión expiró. Iniciá sesión de nuevo.')
    }

    await authRequest.changePassword(accessToken, {
      current_password: values.currentPassword,
      new_password: values.newPassword,
    })
  }

  function logout() {
    writeStoredAuth(null)
    setAccessToken(null)
    setUser(null)
    setStatus('guest')
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        changePassword,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        login,
        logout,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
