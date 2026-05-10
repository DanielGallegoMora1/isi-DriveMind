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
import type { AuthUser } from '../../auth/types'
import { filterPermitsForStudent } from '../../auth/student-access'
import { useI18n } from '../../i18n'
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
  user?: AuthUser | null
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

const permitPresentationMapEs: Record<string, PermitPresentation> = {
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

const permitPresentationMapEn: Record<string, PermitPresentation> = {
  AM: {
    code: 'AM',
    title: 'AM Permit - Mopeds',
    description: 'Two or three-wheel mopeds and light quadricycles, ideal for starting urban mobility.',
    icon: 'motorcycle',
  },
  B: {
    code: 'B',
    title: 'B Permit - Cars',
    description: 'Cars with a maximum authorized mass up to 3500 kg and designed for up to 9 seats including the driver.',
    icon: 'car',
    backgroundImage: permitBImage,
  },
  A1: {
    code: 'A1',
    title: 'A1 Permit - Light motorcycles',
    description: 'Motorcycles up to 125 cc, maximum power of 11 kW, and motor tricycles up to 15 kW.',
    icon: 'motorcycle',
  },
  A2: {
    code: 'A2',
    title: 'A2 Permit - Mid-size motorcycles',
    description: 'Motorcycles with a maximum power of 35 kW and a power-to-weight ratio suited for intermediate riding.',
    icon: 'motorcycle',
  },
  'B+E': {
    code: 'B+E',
    title: 'B+E Permit - Car + Trailer',
    description: 'Vehicle combinations made up of a car and a larger trailer for special loads.',
    icon: 'car',
  },
  C1: {
    code: 'C1',
    title: 'C1 Permit - Light trucks',
    description: 'Medium-sized trucks with MMA above 3500 kg and below 7500 kg, plus up to 8 passengers besides the driver.',
    icon: 'truck',
  },
  C: {
    code: 'C',
    title: 'C Permit - Heavy trucks',
    description: 'Motor vehicles for transporting goods with MMA above 3500 kg, designed for heavy loads.',
    icon: 'truck',
  },
}

const fallbackPermitsEs: Permit[] = [
  { id: 1, code: 'AM', name: 'Ciclomotores' },
  { id: 2, code: 'A1', name: 'Motos ligeras' },
  { id: 3, code: 'A2', name: 'Motos medias' },
  { id: 4, code: 'B', name: 'Turismos' },
  { id: 5, code: 'B+E', name: 'Turismo + Remolque' },
  { id: 6, code: 'C1', name: 'Camiones ligeros' },
  { id: 7, code: 'C', name: 'Camiones pesados' },
]

const fallbackPermitsEn: Permit[] = [
  { id: 1, code: 'AM', name: 'Mopeds' },
  { id: 2, code: 'A1', name: 'Light motorcycles' },
  { id: 3, code: 'A2', name: 'Mid-size motorcycles' },
  { id: 4, code: 'B', name: 'Cars' },
  { id: 5, code: 'B+E', name: 'Car + Trailer' },
  { id: 6, code: 'C1', name: 'Light trucks' },
  { id: 7, code: 'C', name: 'Heavy trucks' },
]

const testOptionsEs: TestOption[] = [
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
    description: 'Revisa tus errores más frecuentes y convierte esos fallos en aprendizaje real.',
    icon: 'refresh',
    accent: 'red',
  },
]

const testOptionsEn: TestOption[] = [
  {
    id: 'topic',
    title: 'Topic test',
    description: 'Practice a specific block of the syllabus to reinforce what you are studying right now.',
    icon: 'layers',
    accent: 'blue',
  },
  {
    id: 'random',
    title: 'Random test',
    description: 'Mix varied questions to simulate a general practice session and measure your current level.',
    icon: 'shuffle',
    accent: 'green',
  },
  {
    id: 'failed',
    title: 'Failed questions',
    description: 'Review your most frequent mistakes and turn those setbacks into real learning.',
    icon: 'refresh',
    accent: 'red',
  },
]

const fallbackTopicsByPermitEs: Record<string, Topic[]> = {
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

const fallbackTopicsByPermitEn: Record<string, Topic[]> = {
  AM: [
    { id: 11, permit_id: 1, topic_number: 1, name: 'Basic traffic rules' },
    { id: 12, permit_id: 1, topic_number: 2, name: 'Urban signage' },
    { id: 13, permit_id: 1, topic_number: 3, name: 'Safety and equipment' },
  ],
  A1: [
    { id: 21, permit_id: 2, topic_number: 1, name: 'Signs and priorities' },
    { id: 22, permit_id: 2, topic_number: 2, name: 'Safe motorcycle riding' },
    { id: 23, permit_id: 2, topic_number: 3, name: 'Protection and maneuvers' },
  ],
  A2: [
    { id: 31, permit_id: 3, topic_number: 1, name: 'Traffic techniques' },
    { id: 32, permit_id: 3, topic_number: 2, name: 'Signage and overtaking' },
    { id: 33, permit_id: 3, topic_number: 3, name: 'Active and passive safety' },
  ],
  B: [
    { id: 101, permit_id: 4, topic_number: 1, name: 'Signs' },
    { id: 102, permit_id: 4, topic_number: 2, name: 'Traffic rules' },
    { id: 103, permit_id: 4, topic_number: 3, name: 'Road safety' },
    { id: 104, permit_id: 4, topic_number: 4, name: 'Mechanics and basic maintenance' },
  ],
  'B+E': [
    { id: 41, permit_id: 5, topic_number: 1, name: 'Driving with trailer' },
    { id: 42, permit_id: 5, topic_number: 2, name: 'Masses, loads and maneuvers' },
    { id: 43, permit_id: 5, topic_number: 3, name: 'Safety and braking' },
  ],
  C1: [
    { id: 51, permit_id: 6, topic_number: 1, name: 'Freight regulations' },
    { id: 52, permit_id: 6, topic_number: 2, name: 'Priorities and signage' },
    { id: 53, permit_id: 6, topic_number: 3, name: 'Safety in heavy vehicles' },
  ],
  C: [
    { id: 61, permit_id: 7, topic_number: 1, name: 'Professional transport' },
    { id: 62, permit_id: 7, topic_number: 2, name: 'Masses, distances and braking' },
    { id: 63, permit_id: 7, topic_number: 3, name: 'Road risk prevention' },
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

function getPermitPresentation(permit: Permit, language: 'es' | 'en'): PermitPresentation {
  const presentationMap = language === 'en' ? permitPresentationMapEn : permitPresentationMapEs

  return (
    presentationMap[permit.code] ?? {
      code: permit.code,
      title: language === 'en' ? `Permit ${permit.code} - ${permit.name}` : `Permiso ${permit.code} - ${permit.name}`,
      description:
        language === 'en'
          ? `Theory preparation for permit ${permit.code}. We will expand the specific information for this category soon.`
          : `Preparación teórica para el permiso ${permit.code}. Próximamente ampliaremos la información específica de esta categoría.`,
      icon: 'car',
    }
  )
}

export function DashboardTestFlow({ accessToken, onBackToDashboard, backButtonLabel = 'Volver al dashboard', user = null }: DashboardTestFlowProps) {
  const { language } = useI18n()
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
  const copy = language === 'en'
    ? {
        testPhase: 'Test phase',
        takingTest: 'You are taking the test',
        takingDescription: 'Answer each question calmly. If you submit the test with blank questions, they will appear as unanswered in the review and will not count as mistakes.',
        generating: 'Generating test',
        cannotOpen: 'We could not open the exam',
        backToTypes: 'Back to test types',
        retry: 'Retry',
        selectedPermit: 'Selected permit',
        topicSelection: 'Topic selection',
        chooseTopic: 'Choose the topic to start the test',
        chooseTopicDescription: 'Selecting a topic takes you straight into the test phase without leaving the dashboard.',
        loadingTopics: 'Loading topics from backend…',
        fallbackTopics: (code: string) => `Showing fallback topics for permit ${code}.`,
        topic: 'Topic',
        openPlaceholder: (code: string) => `Open the placeholder exam for this permit ${code} block.`,
        noTopics: 'We still did not find topics for this permit. Try another permit or come back later.',
        newTest: 'New test',
        selectPermit: 'Select permit',
        selectPermitDescription: 'Choose the permit type you want to take the test on',
        start: 'Start',
        permit: 'Permit',
        permitLabel: (code: string) => `Permit ${code}`,
        whatType: 'What kind of test do you want to take?',
        chooseOption: 'Choose one of the following options to practice',
        modeFallback: 'Test mode',
      }
    : {
        testPhase: 'Fase del test',
        takingTest: 'Estás haciendo el test',
        takingDescription: 'Responde cada pregunta con calma. Si envías el test con preguntas en blanco, aparecerán como sin responder en la revisión y no sumarán como fallo.',
        generating: 'Generando el test',
        cannotOpen: 'No pudimos abrir el examen',
        backToTypes: 'Volver a tipos de test',
        retry: 'Reintentar',
        selectedPermit: 'Permiso seleccionado',
        topicSelection: 'Selección de tema',
        chooseTopic: 'Elige el tema para empezar el test',
        chooseTopicDescription: 'Al seleccionar un tema pasas directamente a la fase de hacer test sin salir del dashboard.',
        loadingTopics: 'Cargando temas del backend…',
        fallbackTopics: (code: string) => `Mostrando temas fallback para el permiso ${code}.`,
        topic: 'Tema',
        openPlaceholder: (code: string) => `Abrir placeholder de examen para este bloque del permiso ${code}.`,
        noTopics: 'No encontramos temas para este permiso todavía. Prueba con otro permiso o vuelve más tarde.',
        newTest: 'Nuevo test',
        selectPermit: 'Selecciona el permiso',
        selectPermitDescription: 'Elige el tipo de permiso sobre el que quieres realizar el test',
        start: 'Comenzar',
        permit: 'Permiso',
        permitLabel: (code: string) => `Permiso ${code}`,
        whatType: '¿Qué tipo de test quieres hacer?',
        chooseOption: 'Elige entre las siguientes opciones para practicar',
        modeFallback: 'Modo de test',
      }

  const submitTestMutation = useSubmitTest(accessToken, activeTest?.id ?? null)

  const permits = useMemo(() => {
    const fallbackPermits = language === 'en' ? fallbackPermitsEn : fallbackPermitsEs
    const sourcePermits = permitsQuery.data && permitsQuery.data.length > 0 ? permitsQuery.data : fallbackPermits
    const visiblePermits = filterPermitsForStudent(sourcePermits, user)

    if (visiblePermits.length > 0) {
      return visiblePermits
    }

    const fallbackVisiblePermits = filterPermitsForStudent(fallbackPermits, user)
    return fallbackVisiblePermits.length > 0 ? fallbackVisiblePermits : sourcePermits
  }, [language, permitsQuery.data, user])

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

    return (language === 'en' ? fallbackTopicsByPermitEn : fallbackTopicsByPermitEs)[selectedPermit.code] ?? []
  }, [language, selectedPermit, topicsQuery.data])

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
       setSessionError(error instanceof ApiError ? error.message : language === 'en' ? 'We could not generate the real test with core-service.' : 'No pudimos generar el test real con core-service.')
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
       setSessionError(error instanceof ApiError ? error.message : language === 'en' ? 'We could not grade the test in core-service.' : 'No pudimos corregir el test en core-service.')
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
           permitLabel={selectedPermit?.name ?? `${language === 'en' ? 'Permit' : 'Permiso'} ${selectedPermit?.code ?? ''}`}
          result={result}
          test={activeTest}
           testLabel={getTestOptionTitle(selectedOption, language)}
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
           testLabel={getTestOptionTitle(selectedOption, language)}
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
           <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">{copy.testPhase}</p>
           <h2 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-none text-[#1E3A5F]">{copy.takingTest}</h2>
           <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
             {copy.takingDescription}
           </p>
        </section>

        {generateTestMutation.isPending && !activeTest ? (
          <Card as="section" className="flex min-h-80 items-center justify-center gap-3 py-12">
            <Spinner className="border-[#d1dceb] border-t-[#2C5F8A]" />
             <span className="text-sm text-[#5f7287]">{copy.generating}</span>
          </Card>
        ) : null}

        {sessionError && !activeTest ? (
          <Card as="section" className="grid gap-4 border-[#f1d7d7] bg-[#fff9f9]">
            <div className="grid gap-2">
               <h3 className="m-0 text-2xl text-[#1E3A5F]">{copy.cannotOpen}</h3>
              <p className="m-0 text-sm leading-6 text-[#5f7287]">{sessionError}</p>
            </div>

            <div className="flex flex-wrap gap-3">
               <Button type="button" onClick={handleBackToModeSelection}>{copy.backToTypes}</Button>
               <Button type="button" variant="secondary" onClick={handleChangePermit}>{language === 'en' ? 'Change permit' : 'Cambiar permiso'}</Button>
               <Button type="button" variant="secondary" onClick={resetExamState}>{copy.retry}</Button>
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
               testLabel={getTestOptionTitle(selectedOption, language)}
              topics={availableTopics}
            />
          </>
        ) : null}
      </div>
    )
  }

  if (step === 'mode-selection' && selectedPermit) {
    const permitPresentation = getPermitPresentation(selectedPermit, language)

    return (
      <div className="grid gap-6 xl:gap-7">
         <TopActionButton label={language === 'en' ? 'Change permit' : 'Cambiar permiso'} onClick={handleChangePermit} />

        <section className="grid gap-2">
           <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">{copy.permitLabel(selectedPermit.code)}</p>
           <h2 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-none text-[#1E3A5F]">{copy.whatType}</h2>
           <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">{copy.chooseOption}</p>
        </section>

        <Card as="section" className="grid gap-6 border-[#dfe7f0] bg-[linear-gradient(180deg,#fdfefe_0%,#f7fafc_100%)]">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-[20px] bg-[#f1f6fb] p-5">
            <div className="flex items-start gap-4">
              <PermitIllustration icon={permitPresentation.icon} />
              <div>
                 <p className="m-0 text-sm font-semibold text-[#2C5F8A]">{copy.selectedPermit}</p>
                <strong className="mt-1 block text-lg text-[#1E3A5F]">{permitPresentation.title}</strong>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
             {(language === 'en' ? testOptionsEn : testOptionsEs).map((option) => (
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
                 <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">{copy.topicSelection}</p>
                 <h3 className="m-0 text-2xl text-[#1E3A5F]">{copy.chooseTopic}</h3>
                 <p className="m-0 text-sm leading-6 text-[#5f7287]">
                   {copy.chooseTopicDescription}
                 </p>
                 {topicsQuery.isLoading ? <p className="m-0 text-sm text-[#5f7287]">{copy.loadingTopics}</p> : null}
                 {topicsQuery.isError || !topicsQuery.data?.length ? (
                   <p className="m-0 text-sm text-[#5f7287]">{copy.fallbackTopics(selectedPermit.code)}</p>
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
                       {copy.topic} {topic.topic_number}
                     </span>
                     <strong className="text-base text-[#1E3A5F]">{topic.name}</strong>
                     <span className="text-sm text-[#5f7287]">{copy.openPlaceholder(selectedPermit.code)}</span>
                   </button>
                ))}
              </div>

              {availableTopics.length === 0 ? (
                <p className="m-0 rounded-[20px] bg-[#f6f9fc] p-4 text-sm text-[#5f7287]">
                   {copy.noTopics}
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
         <p className="m-0 text-sm font-semibold tracking-[0.12em] uppercase text-[#2C5F8A]">{copy.newTest}</p>
         <h2 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-none text-[#1E3A5F]">{copy.selectPermit}</h2>
         <p className="m-0 max-w-3xl text-sm text-[#5f7287] md:text-base">
           {copy.selectPermitDescription}
         </p>
      </section>

      <div className="grid gap-4">
        {permits.map((permit) => {
          const presentation = getPermitPresentation(permit, language)

          return (
            <button
              key={permit.code}
              type="button"
               aria-label={`${copy.start} ${presentation.title}`}
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
                     {copy.permit} {presentation.code}
                    <span className="ml-2 text-[17px] font-medium text-[rgba(255,255,255,0.72)]">- {presentation.title.split(' - ')[1] ?? permit.name}</span>
                  </h3>
                  <p className="m-0 max-w-2xl text-[15px] leading-[1.5] text-[rgba(255,255,255,0.76)]">{presentation.description}</p>
                </div>
              </div>

              <span className="relative z-10 inline-flex items-end justify-end md:self-end">
                <span className="inline-flex items-center gap-2 rounded-[18px] border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[15px] font-medium text-white backdrop-blur-sm">
                   <span>{copy.start}</span>
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

function getTestOptionTitle(optionId: TestOption['id'], language: 'es' | 'en') {
  const options = language === 'en' ? testOptionsEn : testOptionsEs
  return options.find((option) => option.id === optionId)?.title ?? (language === 'en' ? 'Test mode' : 'Modo de test')
}
