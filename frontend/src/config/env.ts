const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export const env = {
  authServiceUrl: trimTrailingSlash(import.meta.env.VITE_AUTH_SERVICE_URL ?? '/api'),
}
