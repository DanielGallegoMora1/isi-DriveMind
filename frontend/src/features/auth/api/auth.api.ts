import { env } from '../../../config/env'
import { requestJson } from '../../../lib/http'
import type { AuthUser, ChangePasswordRequest, ChangePasswordResponse, LoginRequest, LoginResponse } from '../types'

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

export function changePassword(token: string, payload: ChangePasswordRequest) {
  return requestJson<ChangePasswordResponse>(`${authBaseUrl}/change-password`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}
