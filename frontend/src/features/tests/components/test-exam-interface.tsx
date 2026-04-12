import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Card } from '../../../components/ui/card'
import type { GeneratedTest, TestMode, TestOptionLabel, TestResult, Topic } from '../types'

type TestExamInterfaceProps = {
  answeredCount: number
  selectedAnswers: Record<number, TestOptionLabel | undefined>
  result: TestResult | null
  test: GeneratedTest
  testLabel: string
  topics: Topic[]
  onAnswerSelect: (questionId: number, selectedLabel: TestOptionLabel) => void
  onBackToModeSelection: () => void
  onChangePermit: () => void
  onStartAnotherTest: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

const optionLabelMap: Record<TestOptionLabel, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
}

function formatAccuracy(value: number) {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value)}%`
}

function getTopicName(topics: Topic[], topicId: number) {
  const topic = topics.find((item) => item.id === topicId)
  return topic ? `Tema ${topic.topic_number}. ${topic.name}` : `Tema ${topicId}`
}

function getModeBadge(mode: TestMode, testLabel: string) {
  switch (mode) {
    case 'TOPIC':
      return testLabel
    case 'FAILED':
      return 'Preguntas falladas'
    case 'RANDOM':
      return 'Test aleatorio'
    case 'PERMIT':
    default:
      return 'Test por licencia'
  }
}

export function TestExamInterface({
  answeredCount,
  selectedAnswers,
  result,
  test,
  testLabel,
  topics,
  onAnswerSelect,
  onBackToModeSelection,
  onChangePermit,
  onStartAnotherTest,
  onSubmit,
  isSubmitting,
}: TestExamInterfaceProps) {
  const [activeQuestionId, setActiveQuestionId] = useState(test.questions[0]?.id ?? 0)

  useEffect(() => {
    setActiveQuestionId(test.questions[0]?.id ?? 0)
  }, [test.id, test.questions])

  const activeQuestionIndex = Math.max(test.questions.findIndex((question) => question.id === activeQuestionId), 0)
  const activeQuestion = test.questions[activeQuestionIndex]
  const progressValue = test.questions.length > 0 ? (answeredCount / test.questions.length) * 100 : 0

  const questionStatuses = useMemo(
    () =>
      test.questions.map((question) => ({
        ...question,
        isActive: question.id === activeQuestionId,
        isAnswered: Boolean(selectedAnswers[question.id]),
      })),
    [activeQuestionId, selectedAnswers, test.questions],
  )

  function goToQuestion(nextQuestionId: number) {
    const questionExists = test.questions.some((question) => question.id === nextQuestionId)
    if (!questionExists) {
      return
    }

    setActiveQuestionId(nextQuestionId)
  }

  if (!activeQuestion) {
    return null
  }

  return (
    <section className="grid gap-6 text-[#1E3A5F]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToModeSelection}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-transparent px-1 py-1 text-sm font-semibold text-[#2C5F8A] transition-colors duration-200 hover:text-[#1E3A5F]"
        >
          <ArrowLeftIcon />
          <span>Volver a tipos de test</span>
        </button>

        <button
          type="button"
          onClick={onChangePermit}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-transparent px-1 py-1 text-sm font-semibold text-[#2C5F8A] transition-colors duration-200 hover:text-[#1E3A5F]"
        >
          <span>Cambiar permiso</span>
        </button>
      </div>

      <header className="grid gap-4 rounded-[16px] border border-white/70 bg-white/90 px-5 py-4 shadow-[0_18px_40px_-28px_rgba(30,58,95,0.28)] backdrop-blur md:grid-cols-[minmax(0,220px)_1fr_minmax(0,220px)] md:items-center md:px-6">
        <div className="grid gap-2">
          <span className="inline-flex w-fit rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase text-[#2453d0]">
            {getModeBadge(test.mode, testLabel)}
          </span>
          {test.topic_id ? (
            <span className="text-sm font-semibold text-[#2E7D5B]">{getTopicName(topics, test.topic_id)}</span>
          ) : null}
        </div>

        <div className="grid gap-2">
          <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-[#DCE6F0]">
            <div
              className="h-full rounded-full bg-[#2C5F8A] transition-[width] duration-300 ease-out"
              style={{ width: `${Math.max(progressValue, 8)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-medium text-[#6A7E95]">
            <span>Progreso del examen</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#F5F7FA] px-4 py-3 md:justify-self-end">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.16em] text-[#6A7E95]">Preguntas</p>
            <p className="m-0 mt-1 text-lg font-semibold text-[#1E3A5F]">{test.questions.length}</p>
          </div>
          <div className="h-10 w-px bg-[#D7E0EA]" />
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.16em] text-[#6A7E95]">Estado</p>
            <p className="m-0 mt-1 text-sm font-semibold text-[#1E3A5F]">{answeredCount}/{test.questions.length} respondidas</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card as="article" className="rounded-[16px] p-5 md:p-7">
          <div className="grid gap-6">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-[#EAF1F7] px-4 py-2 text-sm font-semibold text-[#1E3A5F]">
                Pregunta {activeQuestionIndex + 1} de {test.questions.length}
              </span>
              <span className="rounded-full bg-[#EDF7F1] px-4 py-2 text-sm font-semibold text-[#2E7D5B]">
                {getTopicName(topics, activeQuestion.topic_id)}
              </span>
            </div>

            <div className="grid gap-4">
              <h1 className="m-0 max-w-[20ch] text-[clamp(1.8rem,3vw,2.35rem)] leading-tight font-semibold text-[#1E3A5F]">
                {activeQuestion.statement}
              </h1>
              <p className="m-0 max-w-[62ch] text-sm leading-6 text-[#6A7E95]">
                Leé con calma y marcá la respuesta correcta. Podés moverte entre preguntas desde el panel derecho en cualquier momento.
              </p>
            </div>

            {activeQuestion.requires_image ? (
              <div className="relative overflow-hidden rounded-[16px] border border-[#DCE6F0] bg-[linear-gradient(135deg,#edf4fb_0%,#f8fbfe_100%)] p-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(44,95,138,0.18),transparent_42%)]" />
                <div className="relative grid gap-2">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2C5F8A] shadow-[0_12px_30px_-22px_rgba(30,58,95,0.35)]">
                    <span className="size-2 rounded-full bg-[#F59E0B]" />
                    Pregunta con imagen de apoyo
                  </span>
                  <p className="m-0 text-sm text-[#4E6378]">{activeQuestion.image_description ?? 'El backend indica soporte visual para esta pregunta.'}</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3">
              {activeQuestion.options.map((option) => {
                const isSelected = selectedAnswers[activeQuestion.id] === option.label

                return (
                  <button
                    key={option.id}
                    aria-label={`${optionLabelMap[option.label]} ${option.text}`}
                    className={clsx(
                      'flex w-full items-start gap-4 rounded-[16px] border px-4 py-4 text-left transition-all duration-200',
                      isSelected
                        ? 'border-[#2C5F8A] bg-[#EEF4F9] shadow-[0_18px_35px_-28px_rgba(44,95,138,0.6)]'
                        : 'border-[#D7E0EA] bg-white hover:-translate-y-0.5 hover:border-[#B8CADD] hover:bg-[#FAFCFE] hover:shadow-[0_20px_40px_-32px_rgba(30,58,95,0.4)]',
                    )}
                    onClick={() => onAnswerSelect(activeQuestion.id, option.label)}
                    type="button"
                  >
                    <span
                      className={clsx(
                        'mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200',
                        isSelected ? 'bg-[#2C5F8A] text-white' : 'bg-[#F1F5F9] text-[#1E3A5F]',
                      )}
                    >
                      {optionLabelMap[option.label]}
                    </span>
                    <span className="pt-1 text-base font-medium text-[#1E3A5F]">{option.text}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E3EAF2] pt-2">
              <button
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E8EDF3] px-5 py-3 text-sm font-semibold text-[#8B9CB0] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-100"
                disabled={activeQuestionIndex === 0}
                onClick={() => goToQuestion(test.questions[activeQuestionIndex - 1]?.id ?? activeQuestion.id)}
                type="button"
              >
                Anterior
              </button>

              <button
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2C5F8A] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_35px_-24px_rgba(44,95,138,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#244f73] disabled:cursor-not-allowed disabled:bg-[#9db8cd]"
                disabled={activeQuestionIndex === test.questions.length - 1}
                onClick={() => goToQuestion(test.questions[activeQuestionIndex + 1]?.id ?? activeQuestion.id)}
                type="button"
              >
                Siguiente
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </Card>

        <Card as="aside" className="rounded-[16px] p-5 md:p-6">
          <div className="grid gap-6">
            <div>
              <h2 className="m-0 text-xl font-semibold text-[#1E3A5F]">Mapa de preguntas</h2>
              <p className="m-0 mt-2 text-sm leading-6 text-[#6A7E95]">
                Saltá entre bloques, revisá las preguntas respondidas y detectá rápido las que incluyen apoyo visual.
              </p>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {questionStatuses.map((question, index) => (
                <button
                  key={question.id}
                  className={clsx(
                    'relative inline-flex aspect-square items-center justify-center rounded-[14px] border text-sm font-semibold transition-all duration-200',
                    question.isActive
                      ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white shadow-[0_18px_30px_-24px_rgba(30,58,95,0.85)]'
                      : question.isAnswered
                        ? 'border-[#BFD0E1] bg-[#EEF4F9] text-[#1E3A5F] hover:border-[#2C5F8A] hover:text-[#2C5F8A]'
                        : 'border-[#E1E8F0] bg-[#F3F6F9] text-[#6A7E95] hover:border-[#C8D5E2] hover:text-[#1E3A5F]',
                  )}
                  onClick={() => goToQuestion(question.id)}
                  type="button"
                >
                  {index + 1}
                  {question.requires_image ? (
                    <span
                      aria-label="Con imagen"
                      className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-[#F59E0B] ring-2 ring-white"
                    />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="grid gap-3 rounded-[16px] bg-[#F5F7FA] p-4 text-sm text-[#5D7288]">
              <LegendItem colorClass="bg-[#EEF4F9]" label="Respondida" markerClass="border border-[#BFD0E1]" />
              <LegendItem colorClass="bg-[#F3F6F9]" label="Sin responder" markerClass="border border-[#E1E8F0]" />
              <LegendItem colorClass="bg-[#FFF4DE]" label="Con imagen" markerClass="bg-[#F59E0B]" />
            </div>

            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2E7D5B] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_35px_-24px_rgba(46,125,91,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#276b4d] disabled:cursor-not-allowed disabled:bg-[#97c7b1]"
              disabled={isSubmitting}
              onClick={onSubmit}
              type="button"
            >
              <span aria-hidden="true">⚑</span>
              <span>{isSubmitting ? 'Corrigiendo…' : 'Finalizar test'}</span>
            </button>

            <button
              type="button"
              onClick={onStartAnotherTest}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8e3ee] bg-white px-5 py-3 text-sm font-semibold text-[#1E3A5F] transition-colors duration-200 hover:bg-[#f7fafd]"
            >
              Generar otro test
            </button>
          </div>
        </Card>
      </div>

      {result ? <TestResultCard result={result} topics={topics} /> : null}
    </section>
  )
}

function LegendItem({
  colorClass,
  label,
  markerClass,
}: {
  colorClass: string
  label: string
  markerClass: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={clsx('inline-flex size-8 items-center justify-center rounded-[10px]', colorClass)}>
        <span className={clsx('size-3 rounded-full', markerClass)} />
      </span>
      <span>{label}</span>
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

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
    </svg>
  )
}
