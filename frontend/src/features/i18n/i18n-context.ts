import { createContext, useContext } from 'react'

export type Language = 'es' | 'en'

export type I18nContextValue = {
  language: Language
  locale: string
  setLanguage: (language: Language) => void
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }

  return context
}
