import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, ChevronDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { useI18n } from '../features/i18n'

type FaqItem = {
  question: string
  answer: string
}

type FaqCategory = {
  category: string
  items: FaqItem[]
}

const helpCenterContent = {
  en: {
    back: 'Back to settings',
    title: 'Help center',
    description: 'Have questions? Here you will find answers to the most common ones.',
    searchLabel: 'Search help',
    searchPlaceholder: 'Search help...',
    allCategories: 'All',
    visibleFilterCategories: ['Account and profile', 'Tests and exams', 'Technical issues', 'Payments and subscriptions'],
    questionCount: (count: number) => `${count} questions`,
    searchHint: 'Search also shows results from other help center sections.',
    noResultsTitle: 'We could not find results',
    noResultsDescription: 'Try another keyword or switch the selected category.',
    summary: 'Summary',
    summaryDescription: 'Quick view of the content currently loaded in the help center.',
    categories: 'Categories',
    totalQuestions: 'Total questions',
    visibleResults: 'Visible results',
    categoriesData: [
      {
        category: 'Account and profile',
        items: [
          {
            question: 'How do I change my password?',
            answer: 'You can change your password from Settings > Security and privacy > Change password. Enter your current password and the new one, then save the changes.',
          },
          {
            question: 'How do I update my personal information?',
            answer: 'Go to Settings > Profile and click “Edit profile”. From there you will be able to change your data such as name, email, or phone number.',
          },
          {
            question: 'Can I link my account to multiple driving schools?',
            answer: 'It depends on your account configuration. If you need to switch schools or link another one, contact support so they can manage it.',
          },
          {
            question: 'What should I do if I do not remember my password?',
            answer: 'On the sign-in screen, click “Forgot your password?” and follow the instructions to reset it.',
          },
        ],
      },
      {
        category: 'Tests and exams',
        items: [
          {
            question: 'How do the tests work?',
            answer: 'Tests simulate the official theory exam. Each test contains a fixed number of questions and you can only make a limited number of mistakes to pass.',
          },
          {
            question: 'How many questions does each test have?',
            answer: 'The number of questions can vary depending on configuration, but it normally follows the official theory exam format.',
          },
          {
            question: 'How many mistakes can I make to pass?',
            answer: 'In general you can make up to 3 mistakes. If you go over that number, the test is considered failed.',
          },
          {
            question: 'How much time do I have to complete a test?',
            answer: 'Time depends on the test configuration. There may be a limit per test or per question.',
          },
          {
            question: 'Can I pause a test and continue later?',
            answer: 'It depends on the test type. Some allow pausing, while others must be completed in a single session.',
          },
          {
            question: 'What is the failed-questions test?',
            answer: 'It is a test automatically generated from questions you have failed before, so you can reinforce those weak spots.',
          },
          {
            question: 'How is my score calculated?',
            answer: 'The score is based on the number of correct and incorrect answers. It also considers whether the test is passed or failed.',
          },
        ],
      },
      {
        category: 'Progress and statistics',
        items: [
          {
            question: 'What do my statistics mean?',
            answer: 'Statistics show your performance, including accuracy rate, passed tests, and progress over time.',
          },
          {
            question: 'How can I improve my performance?',
            answer: 'Review your mistakes, repeat failed tests, and practice the topics where your accuracy is lower.',
          },
          {
            question: 'What is my test streak?',
            answer: 'It is the number of consecutive tests you have passed. Keeping a strong streak usually indicates steady progress.',
          },
        ],
      },
      {
        category: 'Settings',
        items: [
          {
            question: 'Can I change the app language?',
            answer: 'Yes, you can do it from Settings > Appearance > Language.',
          },
          {
            question: 'What does the “Show timer” option do?',
            answer: 'It turns the remaining time display on or off while you are taking a test.',
          },
          {
            question: 'What are interaction sounds for?',
            answer: 'They indicate actions inside the test, such as answering correctly or moving to the next question.',
          },
        ],
      },
      {
        category: 'Technical issues',
        items: [
          {
            question: 'The application closes unexpectedly',
            answer: 'Try refreshing the page or restarting the application. If the issue persists, contact support.',
          },
          {
            question: 'I cannot see the question images',
            answer: 'Check your internet connection. If it still fails, it may be a temporary server issue.',
          },
          {
            question: 'Notifications are not working',
            answer: 'Verify that notifications are enabled both in settings and on your device.',
          },
        ],
      },
      {
        category: 'Payments and subscriptions',
        items: [
          {
            question: 'Which payment methods do you accept?',
            answer: 'We accept different methods depending on the platform (card, and others). Check the options available in the app.',
          },
          {
            question: 'How do I cancel my subscription?',
            answer: 'You can cancel it from your profile or subscription section. Changes apply at the end of the current billing period.',
          },
          {
            question: 'Do you offer refunds?',
            answer: 'Refunds depend on the service conditions. Review the relevant policy or contact support.',
          },
        ],
      },
    ] satisfies FaqCategory[],
  },
  es: {
    back: 'Volver a ajustes',
    title: 'Centro de ayuda',
    description: '¿Tienes dudas? Aquí encontrarás respuestas a las preguntas más frecuentes',
    searchLabel: 'Buscar en la ayuda',
    searchPlaceholder: 'Buscar en la ayuda...',
    allCategories: 'Todas',
    visibleFilterCategories: ['Cuenta y perfil', 'Tests y exámenes', 'Problemas técnicos', 'Pagos y suscripciones'],
    questionCount: (count: number) => `${count} preguntas`,
    searchHint: 'La búsqueda también muestra resultados de otras secciones del centro de ayuda.',
    noResultsTitle: 'No hemos encontrado resultados',
    noResultsDescription: 'Prueba con otra palabra clave o cambia la categoría seleccionada.',
    summary: 'Resumen',
    summaryDescription: 'Consulta rápida del contenido cargado en el centro de ayuda.',
    categories: 'Categorías',
    totalQuestions: 'Preguntas totales',
    visibleResults: 'Resultados visibles',
    categoriesData: [
      {
        category: 'Cuenta y perfil',
        items: [
          {
            question: '¿Cómo cambio mi contraseña?',
            answer: 'Puedes cambiar tu contraseña desde Ajustes > Seguridad y privacidad > Cambiar contraseña. Introduce tu contraseña actual y la nueva, y guarda los cambios.',
          },
          {
            question: '¿Cómo actualizo mi información personal?',
            answer: 'Accede a Ajustes > Perfil y pulsa en “Editar perfil”. Desde ahí podrás modificar tus datos como nombre, email o teléfono.',
          },
          {
            question: '¿Puedo vincular mi cuenta con varias autoescuelas?',
            answer: 'Depende de la configuración de tu cuenta. Si necesitas cambiar de autoescuela o vincular otra, contacta con soporte para que lo gestionen.',
          },
          {
            question: '¿Qué hago si no recuerdo mi contraseña?',
            answer: 'En la pantalla de inicio de sesión, pulsa en “¿Olvidaste tu contraseña?” y sigue las instrucciones para restablecerla.',
          },
        ],
      },
      {
        category: 'Tests y exámenes',
        items: [
          {
            question: '¿Cómo funcionan los tests?',
            answer: 'Los tests simulan el examen teórico oficial. Cada test contiene un número fijo de preguntas y puedes cometer un máximo de errores para aprobar.',
          },
          {
            question: '¿Cuántas preguntas tiene cada test?',
            answer: 'El número de preguntas puede variar según la configuración, pero normalmente sigue el formato oficial del examen teórico.',
          },
          {
            question: '¿Cuántos fallos puedo tener para aprobar?',
            answer: 'Generalmente puedes cometer hasta 3 errores. Si superas ese número, el test se considera no apto.',
          },
          {
            question: '¿Cuánto tiempo tengo para completar un test?',
            answer: 'El tiempo depende de la configuración del test. Puede haber límite por test o por pregunta.',
          },
          {
            question: '¿Puedo pausar un test y continuar después?',
            answer: 'Depende del tipo de test. Algunos permiten pausa, mientras que otros deben completarse en una sola sesión.',
          },
          {
            question: '¿Qué es el test de preguntas falladas?',
            answer: 'Es un test generado automáticamente con preguntas que has fallado anteriormente, para ayudarte a mejorar.',
          },
          {
            question: '¿Cómo se calcula mi nota?',
            answer: 'La nota se basa en el número de aciertos y errores. También se tiene en cuenta si el test está aprobado o suspendido.',
          },
        ],
      },
      {
        category: 'Estadísticas y progreso',
        items: [
          {
            question: '¿Qué significan mis estadísticas?',
            answer: 'Las estadísticas muestran tu rendimiento, incluyendo tasa de aciertos, aprobados y evolución en el tiempo.',
          },
          {
            question: '¿Cómo puedo mejorar mi rendimiento?',
            answer: 'Revisa tus errores, repite tests fallados y practica en los temas donde tengas menor porcentaje de aciertos.',
          },
          {
            question: '¿Qué es la racha de tests?',
            answer: 'Es el número de tests consecutivos que has aprobado. Mantener una buena racha indica progreso constante.',
          },
        ],
      },
      {
        category: 'Configuración',
        items: [
          {
            question: '¿Puedo cambiar el idioma de la aplicación?',
            answer: 'Sí, puedes hacerlo desde Ajustes > Apariencia > Idioma.',
          },
          {
            question: '¿Qué hace la opción “Mostrar temporizador”?',
            answer: 'Activa o desactiva la visualización del tiempo restante durante un test.',
          },
          {
            question: '¿Para qué sirven los sonidos de interacción?',
            answer: 'Indican acciones dentro del test, como responder correctamente o avanzar de pregunta.',
          },
        ],
      },
      {
        category: 'Problemas técnicos',
        items: [
          {
            question: 'La aplicación se cierra inesperadamente',
            answer: 'Intenta actualizar la página o reiniciar la aplicación. Si el problema persiste, contacta con soporte.',
          },
          {
            question: 'No puedo ver las imágenes de las preguntas',
            answer: 'Comprueba tu conexión a internet. Si sigue fallando, puede ser un problema temporal del servidor.',
          },
          {
            question: 'Las notificaciones no funcionan',
            answer: 'Verifica que tienes activadas las notificaciones en ajustes y en tu dispositivo.',
          },
        ],
      },
      {
        category: 'Pagos y suscripciones',
        items: [
          {
            question: '¿Qué métodos de pago aceptan?',
            answer: 'Aceptamos diferentes métodos según la plataforma (tarjeta, etc.). Consulta las opciones disponibles en la app.',
          },
          {
            question: '¿Cómo cancelo mi suscripción?',
            answer: 'Puedes cancelarla desde tu perfil o sección de suscripciones. Los cambios se aplicarán al final del periodo activo.',
          },
          {
            question: '¿Ofrecen reembolsos?',
            answer: 'Los reembolsos dependen de las condiciones del servicio. Consulta la política correspondiente o contacta con soporte.',
          },
        ],
      },
    ] satisfies FaqCategory[],
  },
} as const

function normalizeText(value: string, locale: string) {
  return value
    .toLocaleLowerCase(locale)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function HelpCenterPage() {
  const { language } = useI18n()
  const copy = helpCenterContent[language]
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>(copy.allCategories)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch {
      // jsdom does not implement scrollTo
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset local filters when switching locales.
    setActiveCategory(copy.allCategories)
    setExpandedItems([])
    setSearchTerm('')
  }, [copy.allCategories])

  const filterCategories: string[] = [copy.allCategories, ...copy.visibleFilterCategories]
  const totalQuestions = useMemo(
    () => copy.categoriesData.reduce((total, category) => total + category.items.length, 0),
    [copy.categoriesData],
  )

  const filteredCategories = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm.trim(), locale)

    return copy.categoriesData
      .filter((category) => activeCategory === copy.allCategories || category.category === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!normalizedSearchTerm) {
            return true
          }

          const searchableContent = normalizeText(`${category.category} ${item.question} ${item.answer}`, locale)
          return searchableContent.includes(normalizedSearchTerm)
        }),
      }))
      .filter((category) => category.items.length > 0)
  }, [activeCategory, copy.allCategories, copy.categoriesData, locale, searchTerm])

  const visibleQuestions = filteredCategories.reduce((total, category) => total + category.items.length, 0)
  const normalizedSearchTerm = normalizeText(searchTerm.trim(), locale)
  const includesNonVisibleCategoryResults =
    normalizedSearchTerm.length > 0 &&
    activeCategory === copy.allCategories &&
    filteredCategories.some((category) => !filterCategories.includes(category.category))

  function getFaqItemId(category: string, question: string) {
    return `faq-${normalizeText(`${category}-${question}`, locale).replace(/[^a-z0-9]+/g, '-')}`
  }

  function toggleItem(itemId: string) {
    setExpandedItems((currentItems) =>
      currentItems.includes(itemId)
        ? currentItems.filter((currentItem) => currentItem !== itemId)
        : [...currentItems, itemId],
    )
  }

  return (
    <section className="grid gap-6 text-[#1E3A5F]">
      <header className="rounded-[32px] border border-[#dce5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,249,246,0.98))] p-5 shadow-[0_20px_45px_-30px_rgba(30,58,95,0.22)] md:p-8">
        <div className="grid gap-8">
          <div className="flex items-start justify-start">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-[#d7e8de] bg-white px-4 py-2 text-sm font-semibold text-[#24543d] shadow-[0_14px_28px_-24px_rgba(36,84,61,0.45)] transition-colors duration-200 hover:border-[#bdd7c7] hover:bg-[#f7fbf8]"
              to="/settings"
            >
              <ArrowLeft className="size-4" strokeWidth={2} />
              {copy.back}
            </Link>
          </div>

          <div className="grid justify-items-center gap-4 text-center">
            <div className="flex size-18 items-center justify-center rounded-full bg-[linear-gradient(135deg,#24543d,#2e7d5b)] text-white shadow-[0_18px_36px_-24px_rgba(36,84,61,0.65)] md:size-20">
              <BookOpen className="size-8 md:size-9" strokeWidth={2} />
            </div>

            <div className="grid gap-3">
              <h1 className="m-0 text-[clamp(2rem,4vw,3rem)] leading-none">{copy.title}</h1>
              <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">{copy.description}</p>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-4xl gap-4">
            <label className="grid gap-2" htmlFor="help-center-search">
              <span className="sr-only">{copy.searchLabel}</span>
              <span className="flex items-center gap-3 rounded-[24px] border border-[#d7e8de] bg-white px-5 py-4 shadow-[0_18px_36px_-30px_rgba(36,84,61,0.3)] transition-colors focus-within:border-[#2e7d5b] focus-within:ring-4 focus-within:ring-[#e8f5ee]">
                <Search className="size-5 text-[#5f7287]" strokeWidth={2} />
                <input
                  className="w-full border-0 bg-transparent text-sm text-[#1E3A5F] outline-none md:text-base"
                  id="help-center-search"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  type="search"
                  value={searchTerm}
                />
              </span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" role="list" aria-label={copy.title}>
              {filterCategories.map((category) => {
                const isActive = activeCategory === category
                const itemCount =
                  category === copy.allCategories
                    ? totalQuestions
                    : copy.categoriesData.find((faqCategory) => faqCategory.category === category)?.items.length ?? 0

                return (
                  <button
                    key={category}
                    aria-pressed={isActive}
                    className={isActive
                      ? 'grid min-h-28 gap-2 rounded-[24px] border border-[#2e7d5b] bg-[linear-gradient(180deg,#f4fbf7,#ebf8f2)] p-5 text-left shadow-[0_22px_34px_-28px_rgba(46,125,91,0.6)]'
                      : 'grid min-h-28 gap-2 rounded-[24px] border border-[#dce5ef] bg-white p-5 text-left shadow-[0_18px_30px_-28px_rgba(30,58,95,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c7d5e3] hover:shadow-[0_22px_34px_-26px_rgba(30,58,95,0.24)]'}
                    onClick={() => setActiveCategory(category)}
                    type="button"
                  >
                    <span className={isActive ? 'text-sm font-semibold text-[#2e7d5b]' : 'text-sm font-semibold text-[#5f7287]'}>{category}</span>
                    <span className="text-base font-semibold text-[#1E3A5F]">{copy.questionCount(itemCount)}</span>
                  </button>
                )
              })}
            </div>

            {includesNonVisibleCategoryResults ? (
              <p className="m-0 text-center text-sm text-[#5f7287]">{copy.searchHint}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <Card as="section" className="grid gap-5 p-6 md:p-7">
            <div className="grid gap-4">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <section key={category.category} className="grid gap-4 rounded-[24px] border border-[#e7edf4] bg-[#fbfdff] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="m-0 text-xl">{category.category}</h2>
                      <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2453d0]">
                        {copy.questionCount(category.items.length)}
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {category.items.map((item) => {
                        const itemId = getFaqItemId(category.category, item.question)
                        const isExpanded = expandedItems.includes(itemId)

                        return (
                          <div key={item.question} className="overflow-hidden rounded-[20px] border border-[#e3ebf3] bg-white">
                            <h3 className="m-0">
                              <button
                                aria-controls={`${itemId}-answer`}
                                aria-expanded={isExpanded}
                                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-base font-semibold text-[#1E3A5F] transition-colors hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e8eefc]"
                                onClick={() => toggleItem(itemId)}
                                type="button"
                              >
                                <span>{item.question}</span>
                                <ChevronDown
                                  className={isExpanded ? 'size-5 shrink-0 rotate-180 text-[#2e7d5b] transition-transform' : 'size-5 shrink-0 text-[#5f7287] transition-transform'}
                                  strokeWidth={2}
                                />
                              </button>
                            </h3>

                            {isExpanded ? (
                              <div id={`${itemId}-answer`} className="border-t border-[#edf2f7] px-4 pb-4 pt-3">
                                <p className="m-0 text-sm leading-7 text-[#40566f] md:text-[15px]">{item.answer}</p>
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#cfdbe7] bg-[#fbfdff] p-6 text-center">
                  <h2 className="m-0 text-xl">{copy.noResultsTitle}</h2>
                  <p className="mt-2 mb-0 text-sm leading-7 text-[#5f7287]">{copy.noResultsDescription}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 self-start">
          <Card as="aside" className="grid gap-4 p-6">
            <div className="grid gap-1">
              <h2 className="m-0 text-lg">{copy.summary}</h2>
              <p className="m-0 text-sm text-[#5f7287]">{copy.summaryDescription}</p>
            </div>

            <div className="grid gap-3">
              <InfoRow label={copy.categories} value={String(copy.categoriesData.length)} />
              <InfoRow label={copy.totalQuestions} value={String(totalQuestions)} />
              <InfoRow label={copy.visibleResults} value={String(visibleQuestions)} />
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f7] bg-[#fbfdff] px-4 py-3">
      <span className="text-sm text-[#5f7287]">{label}</span>
      <span className="text-sm font-semibold text-[#1E3A5F]">{value}</span>
    </div>
  )
}
