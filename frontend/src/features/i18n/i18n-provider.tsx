import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type Language } from './i18n-context'

const LANGUAGE_STORAGE_KEY = 'drivemind.language'

function isLanguage(value: string | null): value is Language {
  return value === 'es' || value === 'en'
}

function readStoredLanguage(): Language {
  const rawValue = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isLanguage(rawValue) ? rawValue : 'es'
}

function writeStoredLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}

function getLocale(language: Language) {
  return language === 'en' ? 'en-US' : 'es-ES'
}

export function I18nProvider({ children, initialLanguage }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(() => initialLanguage ?? readStoredLanguage())

  useEffect(() => {
    writeStoredLanguage(language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({
      language,
      locale: getLocale(language),
      setLanguage,
    }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
