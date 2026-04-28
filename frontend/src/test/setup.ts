import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './msw/server'
import { resetAiAssistantMockState, resetSchoolsMockState } from './msw/handlers'

function installLocalStorageFallback() {
  const storage = window.localStorage

  if (
    typeof storage?.getItem === 'function' &&
    typeof storage?.setItem === 'function' &&
    typeof storage?.removeItem === 'function' &&
    typeof storage?.clear === 'function'
  ) {
    return
  }

  const values = new Map<string, string>()

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, String(value))
      },
      removeItem: (key: string) => {
        values.delete(key)
      },
      clear: () => {
        values.clear()
      },
    },
  })
}

beforeAll(() => {
  installLocalStorageFallback()
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  resetAiAssistantMockState()
  resetSchoolsMockState()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
