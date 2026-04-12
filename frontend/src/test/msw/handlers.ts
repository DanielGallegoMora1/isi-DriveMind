import { http, HttpResponse } from 'msw'

const permitResponse = [
  { id: 1, code: 'B', name: 'Turismos' },
]

const topicResponse = [
  { id: 101, permit_id: 1, topic_number: 1, name: 'Señales' },
]

const generatedTestResponse = {
  id: 77,
  user_id: 1,
  mode: 'PERMIT',
  permit_id: 1,
  topic_id: null,
  num_questions: 30,
  created_at: '2026-04-12T10:15:30Z',
  questions: Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    external_id: `EXT-${index + 1}`,
    topic_id: 101,
    statement: `Pregunta ${index + 1}`,
    difficulty: 1,
    requires_image: false,
    image_description: null,
    options: [
      { id: index * 3 + 1, label: 'a', text: `Opción A ${index + 1}` },
      { id: index * 3 + 2, label: 'b', text: `Opción B ${index + 1}` },
      { id: index * 3 + 3, label: 'c', text: `Opción C ${index + 1}` },
    ],
  })),
}

const statsResponse = {
  summary: {
    total_tests: 10,
    passed_tests: 8,
    failed_tests: 2,
    accuracy_pct: 80.5,
  },
  by_topic: [],
  history: [],
  trend: [],
  failed_distribution: [],
}

export const handlers = [
  http.get('/core-api/v1/permits', () => HttpResponse.json({ items: permitResponse })),
  http.get('/core-api/v1/topics', () => HttpResponse.json({ items: topicResponse })),
  http.post('/core-api/v1/tests/generate', () => HttpResponse.json(generatedTestResponse)),
  http.get('/core-api/v1/tests/77', () => HttpResponse.json(generatedTestResponse)),
  http.post('/core-api/v1/tests/77/submit', async ({ request }) => {
    const payload = (await request.json()) as { answers: Array<{ question_id: number; selected_label: string }> }
    const wrongCount = payload.answers.filter((answer) => answer.selected_label !== 'b').length
    const correctCount = payload.answers.length - wrongCount

    return HttpResponse.json({
      test_id: 77,
      correct_count: correctCount,
      wrong_count: wrongCount,
      passed: wrongCount <= 3,
      score: Math.round((correctCount / payload.answers.length) * 100),
      by_topic: [
        {
          topic_id: 101,
          correct: correctCount,
          wrong: wrongCount,
          accuracy_pct: (correctCount / payload.answers.length) * 100,
        },
      ],
    })
  }),
  http.get('/core-api/v1/stats', () => HttpResponse.json(statsResponse)),
]
