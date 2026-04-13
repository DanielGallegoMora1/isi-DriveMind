import { useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../../../lib/http'
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { Spinner } from '../../../components/ui/spinner'
import { Button } from '../../../components/ui/button'
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

  const modeOptions: Array<{ label: string; value: TestMode; description: string }> = [
    { label: 'Por licencia', value: 'PERMIT', description: '30 preguntas del permiso seleccionado.' },
    { label: 'Por tema', value: 'TOPIC', description: 'Practica un tema concreto del permiso.' },
    { label: 'Random', value: 'RANDOM', description: 'Mezcla libre de preguntas del permiso.' },
    { label: 'Falladas', value: 'FAILED', description: 'Repite tus preguntas falladas si existen.' },
]

const optionLabelMap: Record<TestOptionLabel, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
}

function formatAccuracy(value: number) {
  return `${value.toFixed(1)}%`
}

function getTopicName(topics: Topic[], topicId: number) {
  const topic = topics.find((item) => item.id === topicId)
  return topic ? `${topic.topic_number}. ${topic.name}` : `Tema ${topicId}`
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
      setFormError('Selecciona una licencia antes de generar el test.')
      return
    }

    if (formState.mode === 'TOPIC' && !formState.topicId) {
      setFormError('Elige un tema para generar un test específico.')
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
      setFormError(error instanceof ApiError ? error.message : 'No pudimos generar el test con core-service.')
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
      setFormError(error instanceof ApiError ? error.message : 'No pudimos corregir el test en core-service.')
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
            <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-[#7bd0ff]">Core service</p>
            <h3 className="mt-3 mb-2 text-2xl text-white">Prepara tu próximo test</h3>
            <p className="m-0 max-w-[62ch] text-sm text-[#9fb2cc]">
              Configura la práctica, genera el examen con el backend real y envía las respuestas para obtener la corrección automática.
            </p>
          </div>

          <div className="rounded-2xl border border-[rgba(123,208,255,0.16)] bg-[rgba(123,208,255,0.08)] px-4 py-3 text-sm text-[#d8e1f0]">
            <strong className="block text-white">Regla actual</strong>
            Apruebas con hasta 3 errores.
          </div>
        </div>

        <form className="grid gap-5" onSubmit={handleGenerateTest}>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-white" htmlFor="permit-code">Licencia</label>
            <select
              id="permit-code"
              value={selectedPermitCode}
              onChange={(event) => setFormState((current) => ({ ...current, permitCode: event.target.value }))}
              className="min-h-12 rounded-2xl border border-[rgba(141,177,229,0.16)] bg-[#081120] px-4 text-[#f5f7fb] outline-none"
              disabled={permitsQuery.isLoading || permitsQuery.isError}
            >
              {permitsQuery.isLoading ? <option>Cargando licencias...</option> : null}
              {permitsQuery.data?.map((permit) => (
                <option key={permit.code} value={permit.code}>
                  {permit.code} · {permit.name}
                </option>
              ))}
            </select>
            {permitsQuery.isError ? (
              <p className="m-0 text-sm text-red-300">No pudimos cargar licencias desde core-service.</p>
            ) : null}
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold text-white">Modo</legend>
            <div className="grid gap-3 md:grid-cols-2">
              {modeOptions.map((option) => (
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
              <label className="text-sm font-semibold text-white" htmlFor="topic-id">Tema</label>
              <select
                id="topic-id"
                value={formState.topicId}
                onChange={(event) => setFormState((current) => ({ ...current, topicId: event.target.value }))}
                className="min-h-12 rounded-2xl border border-[rgba(141,177,229,0.16)] bg-[#081120] px-4 text-[#f5f7fb] outline-none"
                disabled={topicsQuery.isLoading || topicsQuery.isError || !selectedPermitCode}
              >
                <option value="">Selecciona un tema</option>
                {topicsQuery.data?.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.topic_number}. {topic.name}
                  </option>
                ))}
              </select>
              {topicsQuery.isLoading ? <p className="m-0 text-sm text-[#9fb2cc]">Cargando temas…</p> : null}
            </div>
          ) : null}

          {formError ? <p className="m-0 text-sm text-red-300">{formError}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={generateTestMutation.isPending || permitsQuery.isLoading || !selectedPermitCode}>
              {generateTestMutation.isPending ? 'Generando test…' : 'Generar test'}
            </Button>
            {activeTestId !== null ? (
              <Button type="button" variant="secondary" onClick={handleStartAnotherTest}>
                Reiniciar práctica
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {testDetailsQuery.isLoading ? (
        <Card className="flex items-center justify-center gap-3 py-12">
          <Spinner />
          <span className="text-sm text-[#d8e1f0]">Cargando preguntas del test generado…</span>
        </Card>
      ) : null}

      {!testDetailsQuery.isLoading && !activeTest ? (
        <EmptyState
          title="Todavía no generaste un test"
          description="Elige una licencia, define el modo y DriveMind te traerá 30 preguntas reales desde core-service."
        />
      ) : null}

      {activeTest ? <TestQuestionsCard test={activeTest} answers={answers} onSelect={handleAnswerSelect} /> : null}

      {activeTest ? (
        <Card as="section" className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="m-0 text-xl text-white">Entrega del examen</h3>
              <p className="mt-1 mb-0 text-sm text-[#9fb2cc]">
                Respondidas {answeredCount}/{activeTest.questions.length} preguntas. Las que dejes en blanco figurarán como sin responder y no sumarán como fallo.
              </p>
            </div>

            <Button type="button" onClick={handleSubmitTest} disabled={submitTestMutation.isPending}>
              {submitTestMutation.isPending ? 'Corrigiendo…' : 'Enviar respuestas'}
            </Button>
          </div>
        </Card>
      ) : null}

      {result ? <TestResultCard result={result} topics={topicsQuery.data ?? []} /> : null}
    </div>
  )
}

function TestQuestionsCard({
  test,
  answers,
  onSelect,
}: {
  test: GeneratedTest
  answers: Record<number, TestOptionLabel | undefined>
  onSelect: (questionId: number, selectedLabel: TestOptionLabel) => void
}) {
  return (
    <div className="grid gap-4">
      {test.questions.map((question, index) => (
        <Card as="article" className="grid gap-4" key={question.id}>
          <div>
            <p className="m-0 text-sm font-semibold text-[#7bd0ff]">Pregunta {index + 1}</p>
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

function TestResultCard({ result, topics }: { result: TestResult; topics: Topic[] }) {
  return (
    <Card as="section" className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="m-0 text-[0.78rem] font-bold tracking-[0.16em] uppercase text-[#7bd0ff]">Resultado</p>
          <h3 className="mt-2 mb-1 text-2xl text-white">{result.passed ? 'Aprobado' : 'No aprobado'}</h3>
          <p className="m-0 text-sm text-[#9fb2cc]">Core-service devolvió la corrección del examen enviado.</p>
        </div>

        <div className="rounded-2xl border border-[rgba(141,177,229,0.12)] bg-[rgba(8,17,32,0.9)] px-5 py-4 text-right">
          <span className="block text-sm text-[#9fb2cc]">Score</span>
          <strong className="text-3xl text-white">{result.score ?? 0}</strong>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ResultMetric label="Correctas" value={String(result.correct_count)} />
        <ResultMetric label="Incorrectas" value={String(result.wrong_count)} />
        <ResultMetric label="Estado" value={result.passed ? 'Aprobado' : 'Fallado'} />
      </div>

      {result.by_topic.length > 0 ? (
        <div className="grid gap-3">
          <h4 className="m-0 text-lg text-white">Desglose por tema</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {result.by_topic.map((topic) => (
              <div
                key={topic.topic_id}
                className="rounded-2xl border border-[rgba(141,177,229,0.12)] bg-[rgba(8,17,32,0.9)] p-4"
              >
                <strong className="block text-white">{getTopicName(topics, topic.topic_id)}</strong>
                <p className="mt-2 mb-0 text-sm text-[#9fb2cc]">
                  {topic.correct} correctas · {topic.wrong} incorrectas · {formatAccuracy(topic.accuracy_pct)} de precisión
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
