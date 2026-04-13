import { render, screen } from '@testing-library/react'
import { TestResultScreen } from './test-result-screen'
import type { GeneratedTest, TestResult } from '../types'

const test: GeneratedTest = {
  id: 77,
  user_id: 1,
  mode: 'RANDOM',
  permit_id: 4,
  topic_id: 101,
  num_questions: 30,
  created_at: '2026-04-13T10:00:00Z',
  questions: Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    external_id: `EXT-${index + 1}`,
    topic_id: 101,
    statement: `Pregunta ${index + 1}`,
    difficulty: 1,
    requires_image: false,
    image_description: null,
    options: [],
  })),
}

function renderResult(result: TestResult) {
  return render(
    <TestResultScreen
      onBackToDashboard={() => {}}
      onReviewAnswers={() => {}}
      onStartAnotherTest={() => {}}
      answeredCount={28}
      elapsedSeconds={125}
      permitLabel="Permiso B"
      result={result}
      test={test}
      testLabel="Test aleatorio"
    />,
  )
}

describe('TestResultScreen', () => {
  it('muestra la nueva vista de aprobado con métricas y acciones', () => {
    renderResult({
      test_id: 77,
      correct_count: 28,
      wrong_count: 2,
      passed: true,
      score: 93,
      by_topic: [{ topic_id: 101, correct: 28, wrong: 2, accuracy_pct: 93.3 }],
      review_items: Array.from({ length: 30 }, (_, index) => ({
        question_id: index + 1,
        selected_label: index < 28 ? 'b' : null,
        correct_label: 'b',
        is_correct: index < 28,
        is_answered: index < 28,
      })),
    })

    expect(screen.getByRole('heading', { name: 'Test superado' })).toBeInTheDocument()
    expect(screen.getByText('Muy bien hecho, sigue así')).toBeInTheDocument()
    expect(screen.getByText('Aciertos')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText('Sin responder')).toBeInTheDocument()
    expect(screen.getAllByText('2')).toHaveLength(2)
    expect(screen.getByText('93,3%')).toBeInTheDocument()
    expect(screen.getByText(/Tiempo/, { selector: 'span' }).closest('p')).toHaveTextContent('Tiempo: 02:05')
    expect(screen.getByText(/Tipo de test/, { selector: 'span' }).closest('p')).toHaveTextContent('Tipo de test: Test aleatorio')
    expect(screen.getAllByText(/Permiso/, { selector: 'span' })[0].closest('p')).toHaveTextContent('Permiso: Permiso B')
    expect(screen.getByRole('button', { name: /revisar respuestas/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nuevo test/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('muestra la nueva vista de suspenso sin desglose por temas', () => {
    renderResult({
      test_id: 77,
      correct_count: 22,
      wrong_count: 8,
      passed: false,
      score: 73,
      by_topic: [{ topic_id: 101, correct: 22, wrong: 8, accuracy_pct: 73.3 }],
      review_items: Array.from({ length: 30 }, (_, index) => ({
        question_id: index + 1,
        selected_label: index < 22 ? 'b' : index < 24 ? null : 'a',
        correct_label: 'b',
        is_correct: index < 22,
        is_answered: index >= 24 || index < 22,
      })),
    })

    expect(screen.getByRole('heading', { name: 'Test no superado' })).toBeInTheDocument()
    expect(screen.getByText('No te desanimes, sigue practicando y mejorarás')).toBeInTheDocument()
    expect(screen.getByText('Fallos')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.queryByText('Desglose por tema')).not.toBeInTheDocument()
  })
})
