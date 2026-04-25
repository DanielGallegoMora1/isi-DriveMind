import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, HelpCircle, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'

type FaqItem = {
  question: string
  answer: string
}

type FaqCategory = {
  category: string
  items: FaqItem[]
}

const faqCategories: FaqCategory[] = [
  {
    category: 'Cuenta y perfil',
    items: [
      {
        question: '¿Cómo cambio mi contraseña?',
        answer:
          'Puedes cambiar tu contraseña desde Ajustes > Seguridad y privacidad > Cambiar contraseña. Introduce tu contraseña actual y la nueva, y guarda los cambios.',
      },
      {
        question: '¿Cómo actualizo mi información personal?',
        answer:
          'Accede a Ajustes > Perfil y pulsa en “Editar perfil”. Desde ahí podrás modificar tus datos como nombre, email o teléfono.',
      },
      {
        question: '¿Puedo vincular mi cuenta con varias autoescuelas?',
        answer:
          'Depende de la configuración de tu cuenta. Si necesitas cambiar de autoescuela o vincular otra, contacta con soporte para que lo gestionen.',
      },
      {
        question: '¿Qué hago si no recuerdo mi contraseña?',
        answer:
          'En la pantalla de inicio de sesión, pulsa en “¿Olvidaste tu contraseña?” y sigue las instrucciones para restablecerla.',
      },
    ],
  },
  {
    category: 'Tests y exámenes',
    items: [
      {
        question: '¿Cómo funcionan los tests?',
        answer:
          'Los tests simulan el examen teórico oficial. Cada test contiene un número fijo de preguntas y puedes cometer un máximo de errores para aprobar.',
      },
      {
        question: '¿Cuántas preguntas tiene cada test?',
        answer:
          'El número de preguntas puede variar según la configuración, pero normalmente sigue el formato oficial del examen teórico.',
      },
      {
        question: '¿Cuántos fallos puedo tener para aprobar?',
        answer:
          'Generalmente puedes cometer hasta 3 errores. Si superas ese número, el test se considera no apto.',
      },
      {
        question: '¿Cuánto tiempo tengo para completar un test?',
        answer:
          'El tiempo depende de la configuración del test. Puede haber límite por test o por pregunta.',
      },
      {
        question: '¿Puedo pausar un test y continuar después?',
        answer:
          'Depende del tipo de test. Algunos permiten pausa, mientras que otros deben completarse en una sola sesión.',
      },
      {
        question: '¿Qué es el test de preguntas falladas?',
        answer:
          'Es un test generado automáticamente con preguntas que has fallado anteriormente, para ayudarte a mejorar.',
      },
      {
        question: '¿Cómo se calcula mi nota?',
        answer:
          'La nota se basa en el número de aciertos y errores. También se tiene en cuenta si el test está aprobado o suspendido.',
      },
    ],
  },
  {
    category: 'Estadísticas y progreso',
    items: [
      {
        question: '¿Qué significan mis estadísticas?',
        answer:
          'Las estadísticas muestran tu rendimiento, incluyendo tasa de aciertos, aprobados y evolución en el tiempo.',
      },
      {
        question: '¿Cómo puedo mejorar mi rendimiento?',
        answer:
          'Revisa tus errores, repite tests fallados y practica en los temas donde tengas menor porcentaje de aciertos.',
      },
      {
        question: '¿Qué es la racha de tests?',
        answer:
          'Es el número de tests consecutivos que has aprobado. Mantener una buena racha indica progreso constante.',
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
        answer:
          'Activa o desactiva la visualización del tiempo restante durante un test.',
      },
      {
        question: '¿Para qué sirven los sonidos de interacción?',
        answer:
          'Indican acciones dentro del test, como responder correctamente o avanzar de pregunta.',
      },
    ],
  },
  {
    category: 'Problemas técnicos',
    items: [
      {
        question: 'La aplicación se cierra inesperadamente',
        answer:
          'Intenta actualizar la página o reiniciar la aplicación. Si el problema persiste, contacta con soporte.',
      },
      {
        question: 'No puedo ver las imágenes de las preguntas',
        answer:
          'Comprueba tu conexión a internet. Si sigue fallando, puede ser un problema temporal del servidor.',
      },
      {
        question: 'Las notificaciones no funcionan',
        answer:
          'Verifica que tienes activadas las notificaciones en ajustes y en tu dispositivo.',
      },
    ],
  },
  {
    category: 'Pagos y suscripciones',
    items: [
      {
        question: '¿Qué métodos de pago aceptan?',
        answer:
          'Aceptamos diferentes métodos según la plataforma (tarjeta, etc.). Consulta las opciones disponibles en la app.',
      },
      {
        question: '¿Cómo cancelo mi suscripción?',
        answer:
          'Puedes cancelarla desde tu perfil o sección de suscripciones. Los cambios se aplicarán al final del periodo activo.',
      },
      {
        question: '¿Ofrecen reembolsos?',
        answer:
          'Los reembolsos dependen de las condiciones del servicio. Consulta la política correspondiente o contacta con soporte.',
      },
    ],
  },
]

const allCategoriesLabel = 'Todas'

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('es-ES')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState(allCategoriesLabel)

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch {
      // jsdom no implementa scrollTo
    }
  }, [])

  const totalQuestions = useMemo(
    () => faqCategories.reduce((total, category) => total + category.items.length, 0),
    [],
  )

  const filteredCategories = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm.trim())

    return faqCategories
      .filter((category) => activeCategory === allCategoriesLabel || category.category === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!normalizedSearchTerm) {
            return true
          }

          const searchableContent = normalizeText(`${category.category} ${item.question} ${item.answer}`)
          return searchableContent.includes(normalizedSearchTerm)
        }),
      }))
      .filter((category) => category.items.length > 0)
  }, [activeCategory, searchTerm])

  const visibleQuestions = filteredCategories.reduce((total, category) => total + category.items.length, 0)

  return (
    <section className="grid gap-6 text-[#1E3A5F]">
      <header className="flex flex-col gap-4 rounded-[30px] border border-[#dce5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,252,0.96))] p-6 shadow-[0_20px_45px_-30px_rgba(30,58,95,0.22)] md:flex-row md:items-start md:justify-between md:p-8">
        <div className="grid gap-2">
          <p className="m-0 text-sm font-semibold tracking-[0.16em] uppercase text-[#2C5F8A]">Ayuda y soporte</p>
          <h1 className="m-0 text-[clamp(2rem,4vw,3rem)] leading-none">Centro de ayuda</h1>
          <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
            Encuentra respuestas reales organizadas por categoría y filtra el contenido para localizar lo que necesitas.
          </p>
        </div>

        <div className="inline-flex items-center gap-3 self-start rounded-full border border-[#dce5ef] bg-white px-4 py-2 text-sm font-medium text-[#2C5F8A] shadow-[0_14px_30px_-24px_rgba(36,83,208,0.45)]">
          <HelpCircle className="size-4" strokeWidth={2} />
          Preguntas frecuentes verificadas
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <Card as="section" className="grid gap-5 p-6 md:p-7">
            <div className="grid gap-3">
              <label className="grid gap-2" htmlFor="help-center-search">
                <span className="text-sm font-semibold text-[#1E3A5F]">Buscar en el Centro de ayuda</span>
                <span className="flex items-center gap-3 rounded-[22px] border border-[#dce5ef] bg-[#fbfdff] px-4 py-3 focus-within:border-[#2453d0]">
                  <Search className="size-4 text-[#5f7287]" strokeWidth={2} />
                  <input
                    className="w-full border-0 bg-transparent text-sm text-[#1E3A5F] outline-none"
                    id="help-center-search"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar por pregunta, respuesta o categoría"
                    type="search"
                    value={searchTerm}
                  />
                </span>
              </label>

              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorías del centro de ayuda">
                {[allCategoriesLabel, ...faqCategories.map((category) => category.category)].map((category) => {
                  const isActive = activeCategory === category

                  return (
                    <button
                      key={category}
                      aria-pressed={isActive}
                      className={isActive
                        ? 'rounded-full border border-[#2453d0] bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2453d0]'
                        : 'rounded-full border border-[#dce5ef] bg-white px-4 py-2 text-sm font-medium text-[#5f7287] transition-colors hover:border-[#c8d6e4] hover:text-[#1E3A5F]'}
                      onClick={() => setActiveCategory(category)}
                      type="button"
                    >
                      {category}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <section key={category.category} className="grid gap-4 rounded-[24px] border border-[#e7edf4] bg-[#fbfdff] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="m-0 text-xl">{category.category}</h2>
                      <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2453d0]">
                        {category.items.length} preguntas
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {category.items.map((item) => (
                        <details key={item.question} className="rounded-[20px] border border-[#e3ebf3] bg-white p-4" open>
                          <summary className="cursor-pointer list-none pr-6 text-base font-semibold text-[#1E3A5F] [&::-webkit-details-marker]:hidden">
                            {item.question}
                          </summary>
                          <p className="mt-3 mb-0 text-sm leading-7 text-[#40566f] md:text-[15px]">{item.answer}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#cfdbe7] bg-[#fbfdff] p-6 text-center">
                  <h2 className="m-0 text-xl">No hemos encontrado resultados</h2>
                  <p className="mt-2 mb-0 text-sm leading-7 text-[#5f7287]">
                    Prueba con otra palabra clave o cambia la categoría seleccionada.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 self-start">
          <Card as="aside" className="grid gap-4 p-6">
            <div className="grid gap-1">
              <h2 className="m-0 text-lg">Resumen</h2>
              <p className="m-0 text-sm text-[#5f7287]">Consulta rápida del contenido cargado en el centro de ayuda.</p>
            </div>

            <div className="grid gap-3">
              <InfoRow label="Categorías" value={String(faqCategories.length)} />
              <InfoRow label="Preguntas totales" value={String(totalQuestions)} />
              <InfoRow label="Resultados visibles" value={String(visibleQuestions)} />
            </div>
          </Card>

          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#e8eef5] px-5 py-3 text-sm font-semibold text-[#1E3A5F] shadow-[0_14px_24px_-18px_rgba(30,58,95,0.5)] transition-colors duration-200 hover:bg-[#dce7f2]"
            to="/settings"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" strokeWidth={2} />
              Volver a ajustes
            </span>
          </Link>
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
