import type { Language } from './i18n-context'

export function getLanguageLabel(language: Language) {
  return language === 'en' ? 'English' : 'Español'
}

export function formatRole(role: string | null | undefined, language: Language) {
  switch (role) {
    case 'student':
      return language === 'en' ? 'Student' : 'Alumno'
    case 'school_admin':
      return language === 'en' ? 'Administrator' : 'Administrador'
    case 'system_admin':
      return language === 'en' ? 'System admin' : 'Admin sistema'
    default:
      return language === 'en' ? role ?? 'User' : role ?? 'Usuario'
  }
}
