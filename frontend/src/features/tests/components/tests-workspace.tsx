import { useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../../../lib/http'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import { useI18n } from '../../i18n'
import { useGenerateTest, usePermits, useSubmitTest, useTestDetails, useTopics } from '../hooks/use-tests'
import type { GeneratedTest, SubmitAnswer, TestMode, TestOptionLabel, TestQuestion, TestResult, Topic } from '../types'

type TestsWorkspaceProps = {
  accessToken: string | null
}

type FormState = {
  permitCode: string
  mode: TestMode
  topicId: string
}

const optionLabelMap: Record<TestOptionLabel, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
}

function formatAccuracy(value: number) {
  return `${value.toFixed(1)}%`
}

function getTopicName(topics: Topic[], topicId: number, language: 'es' | 'en') {
  const topic = topics.find((item) => item.id === topicId)
  return topic ? `${topic.topic_number}. ${topic.name}` : `${language === 'en' ? 'Topic' : 'Tema'} ${topicId}`
}

function buildAnswersMap(questions: TestQuestion[]) {
  return questions.reduce<Record<number, TestOptionLabel | undefined>>((accumulator, question) => {
    accumulator[question.id] = undefined
    return accumulator
  }, {})
}

function buildSubmitPayload(answers: Record<number, TestOptionLabel | undefined>): SubmitAnswer[] {
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

export function TestsWorkspace({ accessToken }: TestsWorkspaceProps) {
  const { language } = useI18n()
  const permitsQuery = usePermits(accessToken)
  const [formState, setFormState] = useState<FormState>({
    permitCode: '',
    mode: 'PERMIT',
    topicId: '',
  })
  const selectedPermitCode = formState.permitCode || permitsQuery.data?.[0]?.code || ''
  const topicsEnabled = selectedPermitCode.length > 0 && (formState.mode === 'TOPIC' || formState.mode === 'FAILED')
  const topicsQuery = useTopics(accessToken, selectedPermitCode, topicsEnabled)
  const generateTestMutation = useGenerateTest(accessToken)
  const [activeTestId, setActiveTestId] = useState<number | null>(null)
  const testDetailsQuery = useTestDetails(accessToken, activeTestId)
  const submitTestMutation = useSubmitTest(accessToken, activeTestId)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, TestOptionLabel | undefined>>({})
  const [result, setResult] = useState<TestResult | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const copy = language === 'en'
    ? {
        modeOptions: [
          { label: 'By permit', value: 'PERMIT' as const, description: '30 questions for the selected permit.' },
          { label: 'By topic', value: 'TOPIC' as const, description: 'Practice a specific topic for the permit.' },
          { label: 'Random', value: 'RANDOM' as const, description: 'Free mix of questions from the permit.' },
          { label: 'Failed', value: 'FAILED' as const, description: 'Repeat your failed questions if they exist.' },
        ],
        missingPermit: 'Select a permit before generating the test.',
        missingTopic: 'Choose a topic to generate a specific test.',
        generateError: 'We could not generate the test with core-service.',
        gradeError: 'We could not grade the test in core-service.',
        eyebrow: 'Core service',
        title: 'Prepare your next test',
        description: 'Set up the practice, generate the exam with the real backend, and submit the answers to get automatic grading.',
        currentRule: 'Current rule',
        currentRuleDescription: 'You pass with up to 3 mistakes.',
        permit: 'Permit',
        loadingPermits: 'Loading permits...',
        loadPermitsError: 'We could not load permits from core-service.',
        mode: 'Mode',
        topic: 'Topic',
        selectTopic: 'Select a topic',
        loadingTopics: 'Loading topics...',
        generating: 'Generating test...',
        generate: 'Generate test',
        resetPractice: 'Reset practice',
        loadingQuestions: 'Loading questions from the generated test...',
        noTestTitle: 'You have not generated a test yet',
        noTestDescription: 'Choose a permit, define the mode, and DriveMind will bring you 30 real questions from core-service.',
        examDelivery: 'Exam submission',
        answeredSummary: (answeredCount: number, total: number) => `Answered ${answeredCount}/${total} questions. Blank ones will appear as unanswered and will not count as mistakes.`,
        grading: 'Grading...',
        submitAnswers: 'Submit answers',
        question: 'Question',
        result: 'Result',
        passed: 'Passed',
        notPassed: 'Not passed',
        resultDescription: 'Core-service returned the grading for the submitted exam.',
        score: 'Score',
        correct: 'Correct',
        incorrect: 'Incorrect',
        status: 'Status',
        failed: 'Failed',
        byTopic: 'Breakdown by topic',
      }
    : {
        modeOptions: [
          { label: 'Por licencia', value: 'PERMIT' as const, description: '30 preguntas del permiso seleccionado.' },
          { label: 'Por tema', value: 'TOPIC' as const, description: 'Practica un tema concreto del permiso.' },
          { label: 'Random', value: 'RANDOM' as const, description: 'Mezcla libre de preguntas del permiso.' },
          { label: 'Preguntas falladas', value: 'FAILED' as const, description: 'Repite las preguntas que hayas fallado, si hay disponibles.' },
        ],
        missingPermit: 'Selecciona una licencia antes de generar el test.',
        missingTopic: 'Elige un tema para generar un test específico.',
        generateError: 'No pudimos generar el test con core-service.',
        gradeError: 'No pudimos corregir el test en core-service.',
        eyebrow: 'Core service',
        title: 'Prepara tu próximo test',
        description: 'Configura la práctica, genera el examen con el backend real y envía las respuestas para obtener la corrección automática.',
        currentRule: 'Regla actual',
        currentRuleDescription: 'Apruebas con hasta 3 errores.',
        permit: 'Licencia',
        loadingPermits: 'Cargando licencias...',
        loadPermitsError: 'No pudimos cargar licencias desde core-service.',
        mode: 'Modo',
        topic: 'Tema',
        selectTopic: 'Selecciona un tema',
        loadingTopics: 'Cargando temas…',
        generating: 'Generando test…',
        generate: 'Generar test',
        resetPractice: 'Reiniciar práctica',
        loadingQuestions: 'Cargando preguntas del test generado…',
        noTestTitle: 'Todavía no generaste un test',
        noTestDescription: 'Elige una licencia, define el modo y DriveMind te traerá 30 preguntas reales desde core-service.',
        examDelivery: 'Entrega del examen',
        answeredSummary: (answeredCount: number, total: number) => `Respondidas ${answeredCount}/${total} preguntas. Las que dejes en blanco figurarán como sin responder y no sumarán como fallo.`,
        grading: 'Corrigiendo…',
        submitAnswers: 'Enviar respuestas',
        question: 'Pregunta',
        result: 'Resultado',
        passed: 'Aprobado',
        notPassed: 'No aprobado',
        resultDescription: 'Core-service devolvió la corrección del examen enviado.',
        score: 'Score',
        correct: 'Correctas',
        incorrect: 'Incorrectas',
        status: 'Estado',
        failed: 'Fallado',
        byTopic: 'Desglose por tema',
      }

  const activeTest = testDetailsQuery.data
  const answers = useMemo(() => {
    if (!activeTest) {
      return {}
    }

    return {
      ...buildAnswersMap(activeTest.questions),
      ...selectedAnswers,
    }
  }, [activeTest, selectedAnswers])
  const answeredCount = useMemo(
    () => Object.values(selectedAnswers).filter((value) => value !== undefined).length,
    [selectedAnswers],
  )

  async function handleGenerateTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setResult(null)

    if (!selectedPermitCode) {
      setFormError(copy.missingPermit)
      return
    }

    if (formState.mode === 'TOPIC' && !formState.topicId) {
      setFormError(copy.missingTopic)
      return
    }

    try {
      setSelectedAnswers({})

      const generatedTest = await generateTestMutation.mutateAsync({
        permit_code: selectedPermitCode,
        mode: formState.mode,
        topic_id: formState.mode === 'TOPIC' ? Number(formState.topicId) : undefined,
      })

      setActiveTestId(generatedTest.id)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : copy.generateError)
    }
  }

  async function handleSubmitTest() {
    if (!activeTest) {
      return
    }

    setFormError(null)

    try {
      const submissionResult = await submitTestMutation.mutateAsync(buildSubmitPayload(answers))
      setResult(submissionResult)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : copy.gradeError)
    }
  }

  function handleAnswerSelect(questionId: number, selectedLabel: TestOptionLabel) {
    setSelectedAnswers((current) => ({ ...current, [questionId]: selectedLabel }))
  }

  function handleStartAnotherTest() {
    setActiveTestId(null)
    setSelectedAnswers({})
    setResult(null)
    setFormError(null)
  }

  return (
    <div className="grid gap-6">
      <Card as="section" className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-[#7bd0ff]">{copy.eyebrow}</p>
            <h3 className="mt-3 mb-2 text-2xl text-white">{copy.title}</h3>
            <p className="m-0 max-w-[62ch] text-sm text-[#9fb2cc]">{copy.description}</p>
          </div>

          <div className="rounded-2xl border border-[rgba(123,208,255,0.16)] bg-[rgba(123,208,255,0.08)] px-4 py-3 text-sm text-[#d8e1f0]">
            <strong className="block text-white">{copy.currentRule}</strong>
            {copy.currentRuleDescription}
          </div>
        </div>

        <form className="grid gap-5" onSubmit={handleGenerateTest}>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-white" htmlFor="permit-code">{copy.permit}</label>
            <select
              id="permit-code"
              value={selectedPermitCode}
              onChange={(event) => setFormState((current) => ({ ...current, permitCode: event.target.value }))}
              className="min-h-12 rounded-2xl border border-[rgba(141,177,229,0.16)] bg-[#081120] px-4 text-[#f5f7fb] outline-none"
              disabled={permitsQuery.isLoading || permitsQuery.isError}
            >
              {permitsQuery.isLoading ? <option>{copy.loadingPermits}</option> : null}
              {permitsQuery.data?.map((permit) => (
                <option key={permit.code} value={permit.code}>
                  {permit.code} · {permit.name}
                </option>
              ))}
            </select>
            {permitsQuery.isError ? <p className="m-0 text-sm text-red-300">{copy.loadPermitsError}</p> : null}
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold text-white">{copy.mode}</legend>
            <div className="grid gap-3 md:grid-cols-2">
              {copy.modeOptions.map((option) => (
                <label
                  key={option.value}
                  className="grid gap-1 rounded-2xl border border-[rgba(141,177,229,0.12)] bg-[rgba(8,17,32,0.9)] p-4 text-sm text-[#d8e1f0]"
                >
                  <span className="flex items-center gap-3 font-semibold text-white">
                    <input
                      type="radio"
                      name="test-mode"
                      value={option.value}
                      checked={formState.mode === option.value}
                      onChange={() =>
                        setFormState((current) => ({
                          ...current,
                          mode: option.value,
                          topicId: option.value === 'TOPIC' ? current.topicId : '',
                        }))
                      }
                    />
                    {option.label}
                  </span>
                  <span className="text-[#9fb2cc]">{option.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {formState.mode === 'TOPIC' ? (
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-white" htmlFor="topic-id">{copy.topic}</label>
              <select
                id="topic-id"
                value={formState.topicId}
                onChange={(event) => setFormState((current) => ({ ...current, topicId: event.target.value }))}
                className="min-h-12 rounded-2xl border border-[rgba(141,177,229,0.16)] bg-[#081120] px-4 text-[#f5f7fb] outline-none"
                disabled={topicsQuery.isLoading || topicsQuery.isError || !selectedPermitCode}
              >
                <option value="">{copy.selectTopic}</option>
                {topicsQuery.data?.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.topic_number}. {topic.name}
                  </option>
                ))}
              </select>
              {topicsQuery.isLoading ? <p className="m-0 text-sm text-[#9fb2cc]">{copy.loadingTopics}</p> : null}
            </div>
          ) : null}

          {formError ? <p className="m-0 text-sm text-red-300">{formError}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={generateTestMutation.isPending || permitsQuery.isLoading || !selectedPermitCode}>
              {generateTestMutation.isPending ? copy.generating : copy.generate}
            </Button>
            {activeTestId !== null ? (
              <Button type="button" variant="secondary" onClick={handleStartAnotherTest}>
                {copy.resetPractice}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {testDetailsQuery.isLoading ? (
        <Card className="flex items-center justify-center gap-3 py-12">
          <Spinner />
          <span className="text-sm text-[#d8e1f0]">{copy.loadingQuestions}</span>
        </Card>
      ) : null}

      {!testDetailsQuery.isLoading && !activeTest ? <EmptyState title={copy.noTestTitle} description={copy.noTestDescription} /> : null}

      {activeTest ? <TestQuestionsCard answers={answers} language={language} onSelect={handleAnswerSelect} test={activeTest} /> : null}

      {activeTest ? (
        <Card as="section" className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="m-0 text-xl text-white">{copy.examDelivery}</h3>
              <p className="mt-1 mb-0 text-sm text-[#9fb2cc]">{copy.answeredSummary(answeredCount, activeTest.questions.length)}</p>
            </div>

            <Button type="button" onClick={handleSubmitTest} disabled={submitTestMutation.isPending}>
              {submitTestMutation.isPending ? copy.grading : copy.submitAnswers}
            </Button>
          </div>
        </Card>
      ) : null}

      {result ? <TestResultCard language={language} result={result} topics={topicsQuery.data ?? []} /> : null}
    </div>
  )
}

function TestQuestionsCard({
  test,
  answers,
  language,
  onSelect,
}: {
  test: GeneratedTest
  answers: Record<number, TestOptionLabel | undefined>
  language: 'es' | 'en'
  onSelect: (questionId: number, selectedLabel: TestOptionLabel) => void
}) {
  return (
    <div className="grid gap-4">
      {test.questions.map((question, index) => (
        <Card as="article" className="grid gap-4" key={question.id}>
          <div>
            <p className="m-0 text-sm font-semibold text-[#7bd0ff]">{language === 'en' ? 'Question' : 'Pregunta'} {index + 1}</p>
            <h3 className="mt-2 mb-0 text-lg text-white">{question.statement}</h3>
          </div>

          <div className="grid gap-3">
            {question.options.map((option) => {
              const checked = answers[question.id] === option.label

              return (
                <label
                  key={option.id}
                  className="flex items-start gap-3 rounded-2xl border border-[rgba(141,177,229,0.12)] bg-[rgba(8,17,32,0.9)] px-4 py-3 text-sm text-[#d8e1f0]"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={checked}
                    onChange={() => onSelect(question.id, option.label)}
                  />
                  <span>
                    <strong className="mr-2 text-white">{optionLabelMap[option.label]}.</strong>
                    {option.text}
                  </span>
                </label>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}

function TestResultCard({ result, topics, language }: { result: TestResult; topics: Topic[]; language: 'es' | 'en' }) {
  const copy = language === 'en'
    ? {
        result: 'Result',
        passed: 'Passed',
        notPassed: 'Not passed',
        description: 'Core-service returned the grading for the submitted exam.',
        score: 'Score',
        correct: 'Correct',
        incorrect: 'Incorrect',
        status: 'Status',
        failed: 'Failed',
        byTopic: 'Breakdown by topic',
      }
    : {
        result: 'Resultado',
        passed: 'Aprobado',
        notPassed: 'No aprobado',
        description: 'Core-service devolvió la corrección del examen enviado.',
        score: 'Score',
        correct: 'Correctas',
        incorrect: 'Incorrectas',
        status: 'Estado',
        failed: 'Fallado',
        byTopic: 'Desglose por tema',
      }

  return (
    <Card as="section" className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-[#7bd0ff]">{copy.result}</p>
          <h3 className="mt-2 mb-1 text-2xl text-white">{result.passed ? copy.passed : copy.notPassed}</h3>
          <p className="m-0 text-sm text-[#9fb2cc]">{copy.description}</p>
        </div>

        <div className="rounded-2xl border border-[rgba(141,177,229,0.12)] bg-[rgba(8,17,32,0.9)] px-5 py-4 text-right">
          <span className="block text-sm text-[#9fb2cc]">{copy.score}</span>
          <strong className="text-3xl text-white">{result.score ?? 0}</strong>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ResultMetric label={copy.correct} value={String(result.correct_count)} />
        <ResultMetric label={copy.incorrect} value={String(result.wrong_count)} />
        <ResultMetric label={copy.status} value={result.passed ? copy.passed : copy.failed} />
      </div>

      {result.by_topic.length > 0 ? (
        <div className="grid gap-3">
          <h4 className="m-0 text-lg text-white">{copy.byTopic}</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {result.by_topic.map((topic) => (
              <div
                key={topic.topic_id}
                className="rounded-2xl border border-[rgba(141,177,229,0.12)] bg-[rgba(8,17,32,0.9)] p-4"
              >
                <strong className="block text-white">{getTopicName(topics, topic.topic_id, language)}</strong>
                <p className="mt-2 mb-0 text-sm text-[#9fb2cc]">
                  {language === 'en'
                    ? `${topic.correct} correct · ${topic.wrong} incorrect · ${formatAccuracy(topic.accuracy_pct)} accuracy`
                    : `${topic.correct} correctas · ${topic.wrong} incorrectas · ${formatAccuracy(topic.accuracy_pct)} de precisión`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(141,177,229,0.12)] bg-[rgba(8,17,32,0.9)] p-4">
      <span className="block text-sm text-[#9fb2cc]">{label}</span>
      <strong className="mt-2 block text-2xl text-white">{value}</strong>
    </div>
  )
}
