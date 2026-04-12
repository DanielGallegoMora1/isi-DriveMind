import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import type { AuthUser } from '../features/auth/types'

const mockUser: AuthUser = {
  id: 'user-1',
  email: 'student@drivemind.test',
  full_name: 'Estudiante Demo',
  role: 'student',
  school_id: null,
  is_active: true,
  created_at: null,
  updated_at: null,
}

function createAuthValue(overrides?: Partial<AuthContextValue>): AuthContextValue {
  return {
    accessToken: 'demo-token',
    isAuthenticated: true,
    isLoading: false,
    login: async () => undefined,
    logout: () => undefined,
    user: mockUser,
    ...overrides,
  }
}

export function renderWithProviders(ui: ReactElement, authOverrides?: Partial<AuthContextValue>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={createAuthValue(authOverrides)}>{children}</AuthContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper })
}
