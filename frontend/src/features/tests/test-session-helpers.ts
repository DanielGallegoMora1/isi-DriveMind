import type { TestMode } from './types'

export function formatElapsedTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function getModeBadge(mode: TestMode, testLabel: string) {
  switch (mode) {
    case 'TOPIC':
      return testLabel
    case 'FAILED':
      return 'Preguntas falladas'
    case 'RANDOM':
      return 'Test aleatorio'
    case 'PERMIT':
    default:
      return 'Test por licencia'
  }
}

export function formatAccuracy(value: number) {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value)}%`
}
