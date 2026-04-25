import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { TestExamInterface } from './test-exam-interface'
import { I18nProvider } from '../../i18n'
import type { GeneratedTest, TestResultReviewItem, Topic } from '../types'

const topics: Topic[] = [{ id: 101, permit_id: 4, topic_number: 1, name: 'Señales' }]

const test: GeneratedTest = {
  id: 77,
  user_id: 1,
  mode: 'RANDOM',
  permit_id: 4,
  topic_id: 101,
  num_questions: 2,
  created_at: '2026-04-13T10:00:00Z',
  questions: [
    {
      id: 1,
      external_id: 'EXT-1',
      topic_id: 101,
      statement: 'Pregunta 1',
      difficulty: 1,
      requires_image: false,
      image_description: null,
      options: [
        { id: 11, label: 'a', text: 'Opción A1' },
        { id: 12, label: 'b', text: 'Opción B1' },
        { id: 13, label: 'c', text: 'Opción C1' },
      ],
    },
    {
      id: 2,
      external_id: 'EXT-2',
      topic_id: 101,
      statement: 'Pregunta 2',
      difficulty: 1,
      requires_image: false,
      image_description: null,
      options: [
        { id: 21, label: 'a', text: 'Opción A2' },
        { id: 22, label: 'b', text: 'Opción B2' },
        { id: 23, label: 'c', text: 'Opción C2' },
      ],
    },
  ],
}

const reviewItems: TestResultReviewItem[] = [
  { question_id: 1, selected_label: 'a', correct_label: 'b', is_correct: false, is_answered: true },
  { question_id: 2, selected_label: null, correct_label: 'c', is_correct: false, is_answered: false },
]

function renderExamInterface(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>)
}

describe('TestExamInterface review mode', () => {
  it('shows review copy in English when the language is en', () => {
    render(
      <I18nProvider initialLanguage="en">
        <TestExamInterface
          activeQuestionId={2}
          answeredCount={1}
          elapsedSeconds={125}
          isReviewMode
          isSubmitting={false}
          onAnswerSelect={() => {}}
          onBackToModeSelection={() => {}}
          onChangePermit={() => {}}
          onQuestionChange={() => {}}
          onStartAnotherTest={() => {}}
          onSubmit={() => {}}
          reviewItems={reviewItems}
          selectedAnswers={{ 1: 'a' }}
          test={test}
          testLabel="Random test"
          topics={topics}
        />
      </I18nProvider>,
    )

    expect(screen.getByText(/Unanswered · does not count as a mistake/i)).toBeInTheDocument()
    expect(screen.getByText('Answer review')).toBeInTheDocument()
  })

  it('resalta la opción correcta, distingue sin responder y marca el mapa por estado', () => {
    renderExamInterface(
      <TestExamInterface
        activeQuestionId={1}
        answeredCount={1}
        elapsedSeconds={125}
        isReviewMode
        isSubmitting={false}
        onAnswerSelect={() => {}}
        onBackToModeSelection={() => {}}
        onChangePermit={() => {}}
        onQuestionChange={() => {}}
        onStartAnotherTest={() => {}}
        onSubmit={() => {}}
        reviewItems={reviewItems}
        selectedAnswers={{ 1: 'a' }}
        test={test}
        testLabel="Test aleatorio"
        topics={topics}
      />,
    )

    expect(screen.getByRole('button', { name: /A Opción A1/i })).toHaveClass('border-[#D14343]', 'bg-[#FFF1F1]')
    expect(screen.getByRole('button', { name: /B Opción B1/i })).toHaveClass('border-[#2E7D5B]', 'bg-[#EDF7F1]')

    const questionButtons = screen.getAllByRole('button', { name: /^[12]$/ })
    expect(questionButtons[0]).toHaveClass('border-[#A52F2F]', 'bg-[#D14343]')
    expect(questionButtons[1]).toHaveClass('border-[#F1D18A]', 'bg-[#FFF7E6]')
  })

  it('muestra un aviso cuando la pregunta revisada quedó sin responder', () => {
    renderExamInterface(
      <TestExamInterface
        activeQuestionId={2}
        answeredCount={1}
        elapsedSeconds={125}
        isReviewMode
        isSubmitting={false}
        onAnswerSelect={() => {}}
        onBackToModeSelection={() => {}}
        onChangePermit={() => {}}
        onQuestionChange={() => {}}
        onStartAnotherTest={() => {}}
        onSubmit={() => {}}
        reviewItems={reviewItems}
        selectedAnswers={{ 1: 'a' }}
        test={test}
        testLabel="Test aleatorio"
        topics={topics}
      />,
    )

    expect(screen.getByText(/Sin responder · no suma como fallo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /C Opción C2/i })).toHaveClass('border-[#2E7D5B]', 'bg-[#EDF7F1]')
  })
})
