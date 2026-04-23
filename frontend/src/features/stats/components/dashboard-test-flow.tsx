import { useEffect, useMemo, useState } from 'react'
import permitBImage from '../../../assets/B.jpeg'
import { Spinner } from '../../../components/ui/spinner'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CarIcon,
  LayersIcon,
  MotorcycleIcon,
  RefreshIcon,
  ShuffleIcon,
  TruckIcon,
} from '../../../components/icons'
import { ApiError } from '../../../lib/http'
import {
  TestExamInterface,
  TestResultScreen,
  useGenerateTest,
  usePermits,
  useSubmitTest,
  useTopics,
  type GeneratedTest,
  type Permit,
  type TestMode,
  type TestOptionLabel,
  type TestResult,
  type Topic,
} from '../../tests'

type DashboardTestFlowProps = {
  accessToken: string | null
  onBackToDashboard: () => void
  backButtonLabel?: string
}

type FlowStep = 'permit-selection' | 'mode-selection' | 'test-session' | 'test-result' | 'test-review'

type PermitPresentation = {
  code: string
  title: string
  description: string
  icon: 'car' | 'motorcycle' | 'truck'
  backgroundImage?: string
}

type TestOption = {
  id: 'topic' | 'random' | 'failed'
  title: string
  description: string
  icon: 'layers' | 'shuffle' | 'refresh'
  accent: 'blue' | 'green' | 'red'
}

function mapOptionToMode(option: TestOption['id']): TestMode {
  switch (option) {
    case 'topic':
      return 'TOPIC'
    case 'failed':
      return 'FAILED'
    case 'random':
    default:
      return 'RANDOM'
  }
}

function buildSubmitPayload(answers: Record<number, TestOptionLabel | undefined>) {
  return Object.entries(answers)
    .flatMap(([questionId, selectedLabel]) =>
      selectedLabel === undefined
        ? []
        : [
            {
              question_id: Number(questionId),
              selected_label: selectedLabel,
            },
          ],
    )
}

const permitPresentationMap: Record<string, PermitPresentation> = {
  AM: {
    code: 'AM',
    title: 'Permiso AM - Ciclomotores',
    description: 'Ciclomotores de dos o tres ruedas y cuadriciclos ligeros, ideales para iniciarse en la movilidad urbana.',
    icon: 'motorcycle',
  },
  B: {
    code: 'B',
    title: 'Permiso B - Turismos',
    description:
      'Automóviles con MMA no superior a 3500 kg y diseñados para un máximo de 9 plazas incluido el conductor.',
    icon: 'car',
    backgroundImage: permitBImage,
  },
  A1: {
    code: 'A1',
    title: 'Permiso A1 - Motos ligeras',
    description: 'Motocicletas de hasta 125 cc, potencia máxima de 11 kW y triciclos de motor de hasta 15 kW.',
    icon: 'motorcycle',
  },
  A2: {
    code: 'A2',
    title: 'Permiso A2 - Motos medias',
    description: 'Motocicletas con una potencia máxima de 35 kW y una relación potencia/peso adecuada para conducción intermedia.',
    icon: 'motorcycle',
  },
  'B+E': {
    code: 'B+E',
    title: 'Permiso B+E - Turismo + Remolque',
    description: 'Conjuntos de vehículos acoplados formados por un turismo y un remolque de mayor capacidad para cargas especiales.',
    icon: 'car',
  },
  C1: {
    code: 'C1',
    title: 'Permiso C1 - Camiones ligeros',
    description: 'Camiones de tamaño medio con MMA superior a 3500 kg e inferior a 7500 kg, con hasta 8 pasajeros además del conductor.',
    icon: 'truck',
  },
  C: {
    code: 'C',
    title: 'Permiso C - Camiones pesados',
    description: 'Vehículos automóviles para el transporte de mercancías con MMA superior a 3500 kg, pensados para carga pesada.',
    icon: 'truck',
  },
}

const fallbackPermits: Permit[] = [
  { id: 1, code: 'AM', name: 'Ciclomotores' },
  { id: 2, code: 'A1', name: 'Motos ligeras' },
  { id: 3, code: 'A2', name: 'Motos medias' },
  { id: 4, code: 'B', name: 'Turismos' },
  { id: 5, code: 'B+E', name: 'Turismo + Remolque' },
  { id: 6, code: 'C1', name: 'Camiones ligeros' },
  { id: 7, code: 'C', name: 'Camiones pesados' },
]

const testOptions: TestOption[] = [
  {
    id: 'topic',
    title: 'Test por temas',
    description: 'Practica un bloque concreto del temario para reforzar lo que estás estudiando ahora.',
    icon: 'layers',
    accent: 'blue',
  },
  {
    id: 'random',
    title: 'Test aleatorio',
    description: 'Mezcla preguntas variadas para simular una práctica general y medir tu nivel actual.',
    icon: 'shuffle',
    accent: 'green',
  },
  {
    id: 'failed',
    title: 'Preguntas falladas',
    description: 'Revisa tus errores más frecuentes y convertí esos tropiezos en aprendizaje real.',
    icon: 'refresh',
    accent: 'red',
  },
]

const fallbackTopicsByPermit: Record<string, Topic[]> = {
  AM: [
    { id: 11, permit_id: 1, topic_number: 1, name: 'Normas básicas de circulación' },
    { id: 12, permit_id: 1, topic_number: 2, name: 'Señalización urbana' },
    { id: 13, permit_id: 1, topic_number: 3, name: 'Seguridad y equipamiento' },
  ],
  A1: [
    { id: 21, permit_id: 2, topic_number: 1, name: 'Señales y prioridades' },
    { id: 22, permit_id: 2, topic_number: 2, name: 'Conducción segura en moto' },
    { id: 23, permit_id: 2, topic_number: 3, name: 'Protección y maniobras' },
  ],
  A2: [
    { id: 31, permit_id: 3, topic_number: 1, name: 'Técnicas de circulación' },
    { id: 32, permit_id: 3, topic_number: 2, name: 'Señalización y adelantamientos' },
    { id: 33, permit_id: 3, topic_number: 3, name: 'Seguridad activa y pasiva' },
  ],
  B: [
    { id: 101, permit_id: 4, topic_number: 1, name: 'Señales' },
    { id: 102, permit_id: 4, topic_number: 2, name: 'Normas de circulación' },
    { id: 103, permit_id: 4, topic_number: 3, name: 'Seguridad vial' },
    { id: 104, permit_id: 4, topic_number: 4, name: 'Mecánica y mantenimiento básico' },
  ],
  'B+E': [
    { id: 41, permit_id: 5, topic_number: 1, name: 'Circulación con remolque' },
    { id: 42, permit_id: 5, topic_number: 2, name: 'Masas, cargas y maniobras' },
    { id: 43, permit_id: 5, topic_number: 3, name: 'Seguridad y frenado' },
  ],
  C1: [
    { id: 51, permit_id: 6, topic_number: 1, name: 'Normativa de mercancías' },
    { id: 52, permit_id: 6, topic_number: 2, name: 'Prioridades y señalización' },
    { id: 53, permit_id: 6, topic_number: 3, name: 'Seguridad en vehículos pesados' },
  ],
  C: [
    { id: 61, permit_id: 7, topic_number: 1, name: 'Transporte profesional' },
    { id: 62, permit_id: 7, topic_number: 2, name: 'Masas, distancias y frenado' },
    { id: 63, permit_id: 7, topic_number: 3, name: 'Prevención de riesgos viales' },
  ],
}

const accentClasses: Record<TestOption['accent'], { card: string; icon: string; iconHover: string; pill: string }> = {
  blue: {
    card: 'bg-[#eef5ff] text-[#2453d0]',
    icon: 'text-[#2453d0]',
    iconHover: 'group-hover:shadow-[0_18px_32px_-20px_rgba(36,83,208,0.95)]',
    pill: 'bg-[#eef5ff] text-[#2453d0]',
  },
  green: {
    card: 'bg-[#edf9f1] text-[#24774c]',
    icon: 'text-[#24774c]',
    iconHover: 'group-hover:shadow-[0_18px_32px_-20px_rgba(36,119,76,0.95)]',
    pill: 'bg-[#edf9f1] text-[#24774c]',
  },
  red: {
    card: 'bg-[#fff0f0] text-[#c03c3c]',
    icon: 'text-[#c03c3c]',
    iconHover: 'group-hover:shadow-[0_18px_32px_-20px_rgba(192,60,60,0.95)]',
    pill: 'bg-[#fff0f0] text-[#c03c3c]',
  },
}

function getPermitPresentation(permit: Permit): PermitPresentation {
  return (
    permitPresentationMap[permit.code] ?? {
      code: permit.code,
      title: `Permiso ${permit.code} - ${permit.name}`,
      description: `Preparación teórica para el permiso ${permit.code}. Próximamente ampliaremos la información específica de esta categoría.`,
      icon: 'car',
    }
  )
}

export function DashboardTestFlow({ accessToken, onBackToDashboard, backButtonLabel = 'Volver al dashboard' }: DashboardTestFlowProps) {
  const permitsQuery = usePermits(accessToken)
  const generateTestMutation = useGenerateTest(accessToken)
  const generateTestAsync = generateTestMutation.mutateAsync
  const [step, setStep] = useState<FlowStep>('permit-selection')
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null)
  const [selectedOption, setSelectedOption] = useState<TestOption['id'] | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [activeTest, setActiveTest] = useState<GeneratedTest | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, TestOptionLabel | undefined>>({})
  const [result, setResult] = useState<TestResult | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const shouldLoadTopics = selectedPermit !== null && (step === 'mode-selection' || selectedOption === 'topic')

  const topicsQuery = useTopics(accessToken, selectedPermit?.code ?? '', shouldLoadTopics)
  const submitTestMutation = useSubmitTest(accessToken, activeTest?.id ?? null)

  const permits = useMemo(() => {
    if (permitsQuery.data && permitsQuery.data.length > 0) {
      return permitsQuery.data
    }

    return fallbackPermits
  }, [permitsQuery.data])

  function handlePermitSelect(permit: Permit) {
    resetExamState()
    setSelectedPermit(permit)
    setSelectedOption(null)
    setSelectedTopic(null)
    setStep('mode-selection')
  }

  function handleChangePermit() {
    resetExamState()
    setSelectedPermit(null)
    setSelectedOption(null)
    setSelectedTopic(null)
    setStep('permit-selection')
  }

  const availableTopics = useMemo(() => {
    if (!selectedPermit) {
      return []
    }

    if (topicsQuery.data && topicsQuery.data.length > 0) {
      return topicsQuery.data
    }

    return fallbackTopicsByPermit[selectedPermit.code] ?? []
  }, [selectedPermit, topicsQuery.data])

  const answeredCount = useMemo(
    () => Object.values(selectedAnswers).filter((answer) => answer !== undefined).length,
    [selectedAnswers],
  )

  useEffect(() => {
    if (step !== 'test-session' || !activeTest) {
      return
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((currentValue) => currentValue + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [activeTest, step])

  function resetExamState() {
    setActiveTest(null)
    setActiveQuestionId(null)
    setElapsedSeconds(0)
    setSelectedAnswers({})
    setResult(null)
    setSessionError(null)
  }

  async function startTestSession(optionId: TestOption['id'], topic?: Topic) {
    if (!selectedPermit) {
      return
    }

    setSelectedOption(optionId)
    setSelectedTopic(topic ?? null)
    setStep('test-session')
    resetExamState()

    try {
      const generatedTest = await generateTestAsync({
        permit_code: selectedPermit.code,
        mode: mapOptionToMode(optionId),
        topic_id: optionId === 'topic' ? topic?.id : undefined,
      })

      setActiveTest(generatedTest)
      setActiveQuestionId(generatedTest.questions[0]?.id ?? 0)
    } catch (error) {
      setSessionError(error instanceof ApiError ? error.message : 'No pudimos generar el test real con core-service.')
    }
  }

  function handleModeSelect(option: TestOption) {
    if (option.id === 'topic') {
      resetExamState()
      setSelectedOption(option.id)
      setSelectedTopic(null)
      return
    }

    void startTestSession(option.id)
  }

  function handleTopicSelect(topic: Topic) {
    void startTestSession('topic', topic)
  }

  function handleBackToModeSelection() {
    resetExamState()
    setSelectedTopic(null)
    setStep('mode-selection')
  }

  function handleAnswerSelect(questionId: number, selectedLabel: TestOptionLabel) {
    setSelectedAnswers((current) => ({ ...current, [questionId]: selectedLabel }))
  }

  async function handleSubmitTest() {
    if (!activeTest) {
      return
    }

    setSessionError(null)

    try {
      const submission = await submitTestMutation.mutateAsync(buildSubmitPayload(selectedAnswers))
      setResult(submission)
      setStep('test-result')
    } catch (error) {
      setSessionError(error instanceof ApiError ? error.message : 'No pudimos corregir el test en core-service.')
    }
  }

  if (step === 'test-result' && activeTest && selectedOption && result) {
    return (
      <div className="grid gap-6 xl:gap-7">
        <TestResultScreen
          answeredCount={answeredCount}
          elapsedSeconds={elapsedSeconds}
          onBackToDashboard={onBackToDashboard}
          onReviewAnswers={() => setStep('test-review')}
          onStartAnotherTest={() => void startTestSession(selectedOption, selectedTopic ?? undefined)}
          permitLabel={selectedPermit?.name ?? `Permiso ${selectedPermit?.code ?? ''}`}
          result={result}
          test={activeTest}
          testLabel={getTestOptionTitle(selectedOption)}
        />
      </div>
    )
  }

  if (step === 'test-review' && activeTest && selectedOption && result) {
    return (
      <div className="grid gap-6 xl:gap-7">
        <TestExamInterface
          activeQuestionId={activeQuestionId ?? activeTest.questions[0]?.id ?? 0}
          answeredCount={answeredCount}
          elapsedSeconds={elapsedSeconds}
          isReviewMode
          isSubmitting={false}
          onAnswerSelect={handleAnswerSelect}
          onBackToDashboard={onBackToDashboard}
          onBackToModeSelection={handleBackToModeSelection}
          onBackToResult={() => setStep('test-result')}
          onChangePermit={handleChangePermit}
          onQuestionChange={setActiveQuestionId}
          onStartAnotherTest={() => void startTestSession(selectedOption, selectedTopic ?? undefined)}
          onSubmit={handleSubmitTest}
          reviewItems={result.review_items}
          selectedAnswers={selectedAnswers}
          test={activeTest}
          testLabel={getTestOptionTitle(selectedOption)}
          topics={availableTopics}
        />
      </div>
    )
  }

  if (step === 'test-session' && selectedPermit && selectedOption) {
    return (
      <div className="grid gap-6 xl:gap-7">
        <TopActionButton label={backButtonLabel} onClick={onBackToDashboard} />

        <section className="grid gap-2">
          <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">Fase del test</p>
          <h2 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-none text-[#1E3A5F]">Estás haciendo el test</h2>
          <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
            Responde cada pregunta con calma. Si envías el test con preguntas en blanco, contarán como fallo y también aparecerán en la revisión.
          </p>
        </section>

        {generateTestMutation.isPending && !activeTest ? (
          <Card as="section" className="flex min-h-80 items-center justify-center gap-3 py-12">
            <Spinner className="border-[#d1dceb] border-t-[#2C5F8A]" />
            <span className="text-sm text-[#5f7287]">Generando el test</span>
          </Card>
        ) : null}

        {sessionError && !activeTest ? (
          <Card as="section" className="grid gap-4 border-[#f1d7d7] bg-[#fff9f9]">
            <div className="grid gap-2">
              <h3 className="m-0 text-2xl text-[#1E3A5F]">No pudimos abrir el examen</h3>
              <p className="m-0 text-sm leading-6 text-[#5f7287]">{sessionError}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleBackToModeSelection}>Volver a tipos de test</Button>
              <Button type="button" variant="secondary" onClick={handleChangePermit}>Cambiar permiso</Button>
              <Button type="button" variant="secondary" onClick={resetExamState}>Reintentar</Button>
            </div>
          </Card>
        ) : null}

        {activeTest ? (
          <>
            {sessionError ? <p className="m-0 text-sm text-[#b94b4b]">{sessionError}</p> : null}
            <TestExamInterface
              activeQuestionId={activeQuestionId ?? activeTest.questions[0]?.id ?? 0}
              answeredCount={answeredCount}
              elapsedSeconds={elapsedSeconds}
              isSubmitting={submitTestMutation.isPending}
              onAnswerSelect={handleAnswerSelect}
              onBackToModeSelection={handleBackToModeSelection}
              onChangePermit={handleChangePermit}
              onQuestionChange={setActiveQuestionId}
              onStartAnotherTest={() => void startTestSession(selectedOption, selectedTopic ?? undefined)}
              onSubmit={handleSubmitTest}
              selectedAnswers={selectedAnswers}
              test={activeTest}
              testLabel={getTestOptionTitle(selectedOption)}
              topics={availableTopics}
            />
          </>
        ) : null}
      </div>
    )
  }

  if (step === 'mode-selection' && selectedPermit) {
    const permitPresentation = getPermitPresentation(selectedPermit)

    return (
      <div className="grid gap-6 xl:gap-7">
        <TopActionButton label="Cambiar permiso" onClick={handleChangePermit} />

        <section className="grid gap-2">
          <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">Permiso {selectedPermit.code}</p>
          <h2 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-none text-[#1E3A5F]">¿Qué tipo de test quieres hacer?</h2>
          <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">Elige entre las siguientes opciones para practicar</p>
        </section>

        <Card as="section" className="grid gap-6 border-[#dfe7f0] bg-[linear-gradient(180deg,#fdfefe_0%,#f7fafc_100%)]">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-[20px] bg-[#f1f6fb] p-5">
            <div className="flex items-start gap-4">
              <PermitIllustration icon={permitPresentation.icon} />
              <div>
                <p className="m-0 text-sm font-semibold text-[#2C5F8A]">Permiso seleccionado</p>
                <strong className="mt-1 block text-lg text-[#1E3A5F]">{permitPresentation.title}</strong>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {testOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleModeSelect(option)}
                aria-pressed={selectedOption === option.id}
                className="group grid min-h-[14rem] gap-4 rounded-[24px] border border-[#dbe3ec] bg-white p-5 text-left shadow-[0_20px_45px_-32px_rgba(30,58,95,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C5F8A]"
              >
                <FlowOptionIcon accent={option.accent} icon={option.icon} />
                <div className="grid gap-2">
                  <h3 className="m-0 text-xl text-[#1E3A5F]">{option.title}</h3>
                  <p className="m-0 text-sm leading-6 text-[#5f7287]">{option.description}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedOption === 'topic' ? (
            <section className="grid gap-4 rounded-[24px] border border-[#dbe3ec] bg-white p-5 shadow-[0_20px_45px_-32px_rgba(30,58,95,0.2)]">
              <div className="grid gap-2">
                <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">Selección de tema</p>
                <h3 className="m-0 text-2xl text-[#1E3A5F]">Elige el tema para empezar el test</h3>
                <p className="m-0 text-sm leading-6 text-[#5f7287]">
                  Al seleccionar un tema pasas directamente a la fase de hacer test sin salir del dashboard.
                </p>
                {topicsQuery.isLoading ? <p className="m-0 text-sm text-[#5f7287]">Cargando temas del backend…</p> : null}
                {topicsQuery.isError || !topicsQuery.data?.length ? (
                  <p className="m-0 text-sm text-[#5f7287]">Mostrando temas fallback para el permiso {selectedPermit.code}.</p>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {availableTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicSelect(topic)}
                    className="group grid gap-2 rounded-[20px] border border-[#dbe3ec] bg-[#f9fbfd] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C5F8A]"
                  >
                    <span className="inline-flex w-fit rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-[#2453d0]">
                      Tema {topic.topic_number}
                    </span>
                    <strong className="text-base text-[#1E3A5F]">{topic.name}</strong>
                    <span className="text-sm text-[#5f7287]">Abrir placeholder de examen para este bloque del permiso {selectedPermit.code}.</span>
                  </button>
                ))}
              </div>

              {availableTopics.length === 0 ? (
                <p className="m-0 rounded-[20px] bg-[#f6f9fc] p-4 text-sm text-[#5f7287]">
                  No encontramos temas para este permiso todavía. Prueba con otro permiso o vuelve más tarde.
                </p>
              ) : null}
            </section>
          ) : null}
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:gap-7">
      <TopActionButton label={backButtonLabel} onClick={onBackToDashboard} />

      <section className="grid gap-2">
        <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">Nuevo test</p>
        <h2 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-none text-[#1E3A5F]">Selecciona el permiso</h2>
        <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
          Elige el tipo de permiso sobre el que quieres realizar el test
        </p>
      </section>

      <div className="grid gap-4">
        {permits.map((permit) => {
          const presentation = getPermitPresentation(permit)

          return (
            <button
              key={permit.code}
              type="button"
              aria-label={`Comenzar ${presentation.title}`}
              onClick={() => handlePermitSelect(permit)}
              className="group relative grid min-h-[12.25rem] w-full gap-4 overflow-hidden rounded-[28px] border border-[#d9e3ee] bg-white px-5 py-4 text-left shadow-[0_22px_45px_-32px_rgba(30,58,95,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b9d0e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C5F8A] md:grid-cols-[1fr_auto]"
            >
              {presentation.backgroundImage ? (
                <>
                  <img
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    src={presentation.backgroundImage}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.76)_0%,rgba(15,23,42,0.62)_34%,rgba(15,23,42,0.32)_62%,rgba(15,23,42,0.22)_100%)]"
                  />
                </>
              ) : null}

              <span className="absolute right-0 top-0 z-10 inline-flex size-14 items-center justify-center rounded-bl-[22px] rounded-tr-[28px] bg-[rgba(255,255,255,0.18)] text-white backdrop-blur-md">
                <PermitIllustration icon={presentation.icon} monochrome />
              </span>

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex items-center rounded-full bg-[rgba(15,23,42,0.42)] px-3 py-1 text-[13px] font-medium text-[rgba(255,255,255,0.8)] backdrop-blur-sm">
                    {permit.name}
                  </span>
                </div>

                <div className="grid gap-2">
                  <h3 className="m-0 text-[clamp(2rem,4vw,2.5rem)] font-bold tracking-[-0.03em] text-white">
                    Permiso {presentation.code}
                    <span className="ml-2 text-[17px] font-medium text-[rgba(255,255,255,0.72)]">- {presentation.title.split(' - ')[1] ?? permit.name}</span>
                  </h3>
                  <p className="m-0 max-w-2xl text-[15px] leading-[1.5] text-[rgba(255,255,255,0.76)]">{presentation.description}</p>
                </div>
              </div>

              <span className="relative z-10 inline-flex items-end justify-end md:self-end">
                <span className="inline-flex items-center gap-2 rounded-[18px] border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[15px] font-medium text-white backdrop-blur-sm">
                  <span>Comenzar</span>
                  <ArrowRightIcon />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TopActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-fit items-center gap-2 rounded-full bg-transparent px-1 py-1 text-sm font-semibold text-[#2C5F8A] transition-colors duration-200 hover:text-[#1E3A5F]"
    >
      <ArrowLeftIcon />
      <span>{label}</span>
    </button>
  )
}

function PermitIllustration({ icon, monochrome = false }: { icon: PermitPresentation['icon']; monochrome?: boolean }) {
  return (
    <span className={monochrome ? 'inline-flex items-center justify-center text-current' : 'inline-flex size-20 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#eff5fa_0%,#dce9f5_100%)] text-[#1E3A5F]'}>
      {icon === 'motorcycle' ? <MotorcycleIcon /> : null}
      {icon === 'truck' ? <TruckIcon /> : null}
      {icon === 'car' ? <CarIcon /> : null}
    </span>
  )
}

function FlowOptionIcon({ icon, accent }: { icon: TestOption['icon']; accent: TestOption['accent'] }) {
  const classes = accentClasses[accent]

  return (
    <span
      className={`inline-flex size-12 items-center justify-center rounded-2xl shadow-[0_10px_18px_-16px_rgba(30,58,95,0.32)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 ${classes.card} ${classes.icon} ${classes.iconHover}`}
    >
      {icon === 'layers' ? <LayersIcon /> : null}
      {icon === 'shuffle' ? <ShuffleIcon /> : null}
      {icon === 'refresh' ? <RefreshIcon /> : null}
    </span>
  )
}

function getTestOptionTitle(optionId: TestOption['id']) {
  return testOptions.find((option) => option.id === optionId)?.title ?? 'Modo de test'
}
