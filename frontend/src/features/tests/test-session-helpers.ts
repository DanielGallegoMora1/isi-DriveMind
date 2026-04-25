import type { Language } from '../i18n'
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

export function getModeBadge(mode: TestMode, testLabel: string, language: Language) {
  switch (mode) {
    case 'TOPIC':
      return testLabel
    case 'FAILED':
      return language === 'en' ? 'Failed questions' : 'Preguntas falladas'
    case 'RANDOM':
      return language === 'en' ? 'Random test' : 'Test aleatorio'
    case 'PERMIT':
    default:
      return language === 'en' ? 'Permit test' : 'Test por permiso'
  }
}

export function formatAccuracy(value: number, language: Language) {
  return `${new Intl.NumberFormat(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 1 }).format(value)}%`
}
