import { describe, expect, it, vi } from 'vitest'
import { parseStatsDate } from './stats-date'

describe('parseStatsDate', () => {
  it('interpreta fechas YYYY-MM-DD sin corrimiento de zona horaria', () => {
    const date = parseStatsDate('2026-04-19')

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(3)
    expect(date.getDate()).toBe(19)
    expect(date.getHours()).toBe(12)
  })

  it('trata datetimes sin timezone como UTC para mantener el día del backend', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-25T00:00:00Z'))

    const date = parseStatsDate('2026-04-19T08:30:00')

    expect(date.toISOString()).toBe('2026-04-19T08:30:00.000Z')

    vi.useRealTimers()
  })
})
