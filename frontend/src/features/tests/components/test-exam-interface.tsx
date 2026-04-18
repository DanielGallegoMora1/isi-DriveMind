import { useMemo } from 'react'
import { clsx } from 'clsx'
import { Card } from '../../../components/ui/card'
import { ArrowLeftIcon } from '../../../components/icons'
import { formatElapsedTime, getModeBadge } from '../test-session-helpers'
import type { GeneratedTest, TestOptionLabel, TestResultReviewItem, Topic } from '../types'

type TestExamInterfaceProps = {
  activeQuestionId: number
  answeredCount: number
  elapsedSeconds: number
  isReviewMode?: boolean
  selectedAnswers: Record<number, TestOptionLabel | undefined>
  test: GeneratedTest
  testLabel: string
  topics: Topic[]
  onAnswerSelect: (questionId: number, selectedLabel: TestOptionLabel) => void
  onBackToDashboard?: () => void
  onBackToModeSelection: () => void
  onBackToResult?: () => void
  onChangePermit: () => void
  onQuestionChange: (questionId: number) => void
  onStartAnotherTest: () => void
  onSubmit: () => void
  isSubmitting: boolean
  reviewItems?: TestResultReviewItem[]
}

const optionLabelMap: Record<TestOptionLabel, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
}

function getTopicName(topics: Topic[], topicId: number) {
  const topic = topics.find((item) => item.id === topicId)
  return topic ? `Tema ${topic.topic_number}. ${topic.name}` : `Tema ${topicId}`
}

function getReviewOptionClasses(reviewState: 'correct' | 'incorrect' | 'neutral', isSelected: boolean) {
  if (reviewState === 'correct') {
    return {
      button: 'border-[#2E7D5B] bg-[#EDF7F1] shadow-[0_18px_35px_-28px_rgba(46,125,91,0.45)]',
      badge: 'bg-[#2E7D5B] text-white',
    }
  }

  if (reviewState === 'incorrect') {
    return {
      button: 'border-[#D14343] bg-[#FFF1F1] shadow-[0_18px_35px_-28px_rgba(209,67,67,0.35)]',
      badge: 'bg-[#D14343] text-white',
    }
  }

  return {
    button: isSelected
      ? 'border-[#2C5F8A] bg-[#EEF4F9] shadow-[0_18px_35px_-28px_rgba(44,95,138,0.6)]'
      : 'border-[#D7E0EA] bg-white',
    badge: isSelected ? 'bg-[#2C5F8A] text-white' : 'bg-[#F1F5F9] text-[#1E3A5F]',
  }
}

function getQuestionMapClasses(
  isReviewMode: boolean,
  isActive: boolean,
  isAnswered: boolean,
  reviewState: 'correct' | 'incorrect' | 'unanswered' | 'neutral',
) {
  if (isReviewMode && reviewState === 'correct') {
    return isActive
      ? 'border-[#1D5F45] bg-[#2E7D5B] text-white shadow-[0_18px_30px_-24px_rgba(46,125,91,0.9)]'
      : 'border-[#9CCCAF] bg-[#EDF7F1] text-[#1D5F45] hover:border-[#2E7D5B] hover:bg-[#E1F1E7]'
  }

  if (isReviewMode && reviewState === 'incorrect') {
    return isActive
      ? 'border-[#A52F2F] bg-[#D14343] text-white shadow-[0_18px_30px_-24px_rgba(209,67,67,0.9)]'
      : 'border-[#F0B7B7] bg-[#FFF1F1] text-[#A52F2F] hover:border-[#D14343] hover:bg-[#FFE4E4]'
  }

  if (isReviewMode && reviewState === 'unanswered') {
    return isActive
      ? 'border-[#B7791F] bg-[#D69E2E] text-white shadow-[0_18px_30px_-24px_rgba(214,158,46,0.9)]'
      : 'border-[#F1D18A] bg-[#FFF7E6] text-[#9A640D] hover:border-[#D69E2E] hover:bg-[#FFF2D2]'
  }

  if (isActive) {
    return isAnswered
      ? 'border-[#10263E] bg-[#10263E] text-white shadow-[0_18px_30px_-24px_rgba(16,38,62,0.95)]'
      : 'border-[#1E3A5F] bg-[#1E3A5F] text-white shadow-[0_18px_30px_-24px_rgba(30,58,95,0.85)]'
  }

  return isAnswered
    ? 'border-[#7E97B2] bg-[#B7C9DB] text-[#10263E] hover:border-[#2C5F8A] hover:bg-[#A8BED4] hover:text-[#10263E]'
    : 'border-[#E1E8F0] bg-[#F3F6F9] text-[#6A7E95] hover:border-[#C8D5E2] hover:text-[#1E3A5F]'
}

export function TestExamInterface({
  activeQuestionId,
  answeredCount,
  elapsedSeconds,
  isReviewMode = false,
  selectedAnswers,
  test,
  testLabel,
  topics,
  onAnswerSelect,
  onBackToDashboard,
  onBackToModeSelection,
  onBackToResult,
  onChangePermit,
  onQuestionChange,
  onStartAnotherTest,
  onSubmit,
  isSubmitting,
  reviewItems = [],
}: TestExamInterfaceProps) {
  const activeQuestionIndex = Math.max(test.questions.findIndex((question) => question.id === activeQuestionId), 0)
  const activeQuestion = test.questions[activeQuestionIndex]
  const progressValue = test.questions.length > 0 ? (answeredCount / test.questions.length) * 100 : 0
  const hasPreviousQuestion = activeQuestionIndex > 0
  const isLastQuestion = activeQuestionIndex === test.questions.length - 1

  const reviewItemsByQuestionId = useMemo(
    () =>
      reviewItems.reduce<Record<number, TestResultReviewItem>>((accumulator, item) => {
        accumulator[item.question_id] = item
        return accumulator
      }, {}),
    [reviewItems],
  )

  const questionStatuses = useMemo(
    () =>
      test.questions.map((question) => {
        const reviewState: 'correct' | 'incorrect' | 'unanswered' | 'neutral' =
          reviewItemsByQuestionId[question.id] && reviewItemsByQuestionId[question.id]?.is_answered === false
            ? 'unanswered'
            : reviewItemsByQuestionId[question.id]?.is_correct
              ? 'correct'
              : reviewItemsByQuestionId[question.id]
                ? 'incorrect'
                : 'neutral'

        return {
          ...question,
          isActive: question.id === activeQuestionId,
          isAnswered: Boolean(selectedAnswers[question.id]),
          reviewState,
        }
      }),
    [activeQuestionId, reviewItemsByQuestionId, selectedAnswers, test.questions],
  )

  function goToQuestion(nextQuestionId: number) {
    const questionExists = test.questions.some((question) => question.id === nextQuestionId)
    if (!questionExists) {
      return
    }

    onQuestionChange(nextQuestionId)
  }

  if (!activeQuestion) {
    return null
  }

  const activeReviewItem = reviewItemsByQuestionId[activeQuestion.id]
  const isActiveQuestionUnanswered = isReviewMode && activeReviewItem?.is_answered === false

  return (
    <section className="grid gap-6 text-[#1E3A5F]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={isReviewMode ? onBackToResult : onBackToModeSelection}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-transparent px-1 py-1 text-sm font-semibold text-[#2C5F8A] transition-colors duration-200 hover:text-[#1E3A5F]"
        >
          <ArrowLeftIcon />
          <span>{isReviewMode ? 'Volver al resultado' : 'Volver a los tipos de test'}</span>
        </button>

        <button
          type="button"
          onClick={isReviewMode ? onBackToDashboard : onChangePermit}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-transparent px-1 py-1 text-sm font-semibold text-[#2C5F8A] transition-colors duration-200 hover:text-[#1E3A5F]"
        >
          <span>{isReviewMode ? 'Ir al dashboard' : 'Cambiar permiso'}</span>
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

        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#F5F7FA] px-4 py-3 md:min-w-[180px] md:justify-self-end">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.16em] text-[#6A7E95]">Tiempo</p>
            <p className="m-0 mt-1 text-lg font-semibold text-[#1E3A5F]">{formatElapsedTime(elapsedSeconds)}</p>
          </div>
          <span className="text-xs font-semibold text-[#6A7E95]">{answeredCount}/{test.questions.length}</span>
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
              {isActiveQuestionUnanswered ? (
                <p className="m-0 inline-flex w-fit items-center gap-2 rounded-full bg-[#FFF7E6] px-3 py-1 text-sm font-semibold text-[#9A640D]">
                  <span className="size-2 rounded-full bg-[#D69E2E]" />
                  Sin responder · no suma como fallo
                </p>
              ) : null}
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
                const reviewItem = reviewItemsByQuestionId[activeQuestion.id]
                const isSelected = selectedAnswers[activeQuestion.id] === option.label
                const reviewState = isReviewMode
                  ? reviewItem?.correct_label === option.label
                    ? 'correct'
                    : reviewItem?.selected_label === option.label && reviewItem.is_correct === false
                      ? 'incorrect'
                      : 'neutral'
                  : 'neutral'
                const reviewClasses = getReviewOptionClasses(reviewState, isSelected)

                return (
                  <button
                    key={option.id}
                    aria-label={`${optionLabelMap[option.label]} ${option.text}`}
                    aria-pressed={isSelected}
                    className={clsx(
                      'flex w-full items-start gap-4 rounded-[16px] border px-4 py-4 text-left transition-all duration-200',
                      isReviewMode
                        ? reviewClasses.button
                        : isSelected
                          ? 'border-[#2C5F8A] bg-[#EEF4F9] shadow-[0_18px_35px_-28px_rgba(44,95,138,0.6)]'
                          : 'border-[#D7E0EA] bg-white hover:-translate-y-0.5 hover:border-[#B8CADD] hover:bg-[#FAFCFE] hover:shadow-[0_20px_40px_-32px_rgba(30,58,95,0.4)]',
                    )}
                    disabled={isReviewMode}
                    onClick={() => onAnswerSelect(activeQuestion.id, option.label)}
                    type="button"
                  >
                    <span
                      className={clsx(
                        'mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200',
                        isReviewMode ? reviewClasses.badge : isSelected ? 'bg-[#2C5F8A] text-white' : 'bg-[#F1F5F9] text-[#1E3A5F]',
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
                className={clsx(
                  'inline-flex min-h-12 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200',
                  hasPreviousQuestion
                    ? 'cursor-pointer border border-[#C6D6E6] bg-white text-[#1E3A5F] shadow-[0_16px_30px_-28px_rgba(30,58,95,0.45)] hover:-translate-y-0.5 hover:border-[#2C5F8A] hover:bg-[#F5F9FC] hover:text-[#244f73]'
                    : 'cursor-not-allowed border border-[#E3EAF2] bg-[#E8EDF3] text-[#8B9CB0]',
                )}
                disabled={!hasPreviousQuestion}
                onClick={() => goToQuestion(test.questions[activeQuestionIndex - 1]?.id ?? activeQuestion.id)}
                type="button"
              >
                Anterior
              </button>

              <button
                className={clsx(
                  'inline-flex min-h-12 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_35px_-24px_rgba(44,95,138,0.9)] transition-all duration-200',
                  isReviewMode
                    ? 'bg-[#1E3A5F] hover:-translate-y-0.5 hover:bg-[#16314f]'
                    : isLastQuestion
                    ? 'bg-[#2E7D5B] hover:-translate-y-0.5 hover:bg-[#276b4d] disabled:cursor-not-allowed disabled:bg-[#97c7b1]'
                    : 'bg-[#2C5F8A] hover:-translate-y-0.5 hover:bg-[#244f73]',
                )}
                disabled={!isReviewMode && isLastQuestion && isSubmitting}
                onClick={() => {
                  if (isReviewMode) {
                    if (isLastQuestion) {
                      onBackToResult?.()
                      return
                    }

                    goToQuestion(test.questions[activeQuestionIndex + 1]?.id ?? activeQuestion.id)
                    return
                  }

                  if (isLastQuestion) {
                    onSubmit()
                    return
                  }

                  goToQuestion(test.questions[activeQuestionIndex + 1]?.id ?? activeQuestion.id)
                }}
                type="button"
              >
                {isReviewMode ? (isLastQuestion ? 'Volver al resultado' : 'Siguiente') : isLastQuestion ? (isSubmitting ? 'Corrigiendo…' : 'Finalizar test') : 'Siguiente'}
                <span aria-hidden="true">{isReviewMode && isLastQuestion ? '↩' : isLastQuestion ? '⚑' : '→'}</span>
              </button>
            </div>
          </div>
        </Card>

        <Card as="aside" className="rounded-[16px] p-5 md:p-6">
          <div className="grid gap-6">
            <div>
              <h2 className="m-0 text-xl font-semibold text-[#1E3A5F]">{isReviewMode ? 'Revisión de respuestas' : 'Mapa de preguntas'}</h2>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {questionStatuses.map((question, index) => (
                <button
                  key={question.id}
                  className={clsx(
                    'relative inline-flex aspect-square items-center justify-center rounded-[14px] border text-sm font-semibold transition-all duration-200',
                    getQuestionMapClasses(isReviewMode, question.isActive, question.isAnswered, question.reviewState),
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

            {isReviewMode ? (
              <div className="flex flex-wrap gap-3 text-xs font-semibold text-[#5F7287]">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] px-3 py-1 text-[#1D5F45]">
                  <span className="size-2 rounded-full bg-[#2E7D5B]" /> Correcta
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF1F1] px-3 py-1 text-[#A52F2F]">
                  <span className="size-2 rounded-full bg-[#D14343]" /> Incorrecta
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E6] px-3 py-1 text-[#9A640D]">
                  <span className="size-2 rounded-full bg-[#D69E2E]" /> Sin responder
                </span>
              </div>
            ) : null}

            {isReviewMode ? (
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1E3A5F] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_35px_-24px_rgba(30,58,95,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#16314f]"
                onClick={onBackToResult}
                type="button"
              >
                <span aria-hidden="true">↩</span>
                <span>Volver al resultado</span>
              </button>
            ) : (
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2E7D5B] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_35px_-24px_rgba(46,125,91,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#276b4d] disabled:cursor-not-allowed disabled:bg-[#97c7b1]"
                disabled={isSubmitting}
                onClick={onSubmit}
                type="button"
              >
                <span aria-hidden="true">⚑</span>
                <span>{isSubmitting ? 'Corrigiendo…' : 'Finalizar test'}</span>
              </button>
            )}

            {isReviewMode ? null : (
              <button
                type="button"
                onClick={onStartAnotherTest}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8e3ee] bg-white px-5 py-3 text-sm font-semibold text-[#1E3A5F] transition-colors duration-200 hover:bg-[#f7fafd]"
              >
                Generar otro test
              </button>
            )}
          </div>
        </Card>
      </div>

    </section>
  )
}

