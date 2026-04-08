import { env } from '../../config/env'
import { requestJson } from '../../lib/http'
import type { AuthUser, LoginRequest, LoginResponse } from '../../types/auth'

const authBaseUrl = `${env.authServiceUrl}/v1/auth`

export function login(credentials: LoginRequest) {
  return requestJson<LoginResponse>(`${authBaseUrl}/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function getCurrentUser(token: string) {
  return requestJson<AuthUser>(`${authBaseUrl}/me`, {
    method: 'GET',
    token,
  })
}
