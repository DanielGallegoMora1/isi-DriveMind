import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './msw/server'
import { resetAiAssistantMockState } from './msw/handlers'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  resetAiAssistantMockState()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
