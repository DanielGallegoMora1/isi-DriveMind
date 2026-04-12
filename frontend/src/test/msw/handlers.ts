import { http, HttpResponse } from 'msw'

const permitResponse = [
  { id: 1, code: 'B', name: 'Turismos' },
]

const topicResponse = [
  { id: 101, permit_id: 1, topic_number: 1, name: 'Señales' },
]

function createGeneratedTestResponse(mode: 'PERMIT' | 'TOPIC' | 'RANDOM' | 'FAILED' = 'PERMIT', topicId: number | null = null) {
  return {
    id: 77,
    user_id: 1,
    mode,
    permit_id: 1,
    topic_id: topicId,
    num_questions: 30,
    created_at: '2026-04-12T10:15:30Z',
    questions: Array.from({ length: 30 }, (_, index) => ({
      id: index + 1,
      external_id: `EXT-${index + 1}`,
      topic_id: topicId ?? 101,
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
}

const statsResponse = {
  summary: {
    total_tests: 10,
    pass_rate_pct: 80,
    accuracy_pct: 80.5,
    current_streak_days: 6,
  },
  history: [
    {
      test_id: 77,
      created_at: '2026-04-11T10:15:30Z',
      passed: true,
      score: 87,
      correct_count: 26,
      wrong_count: 4,
      accuracy_pct: 86.7,
      permit_code: 'B',
      topic_id: 101,
    },
    {
      test_id: 78,
      created_at: '2026-04-10T09:00:00Z',
      passed: false,
      score: 73,
      correct_count: 22,
      wrong_count: 8,
      accuracy_pct: 73.3,
      permit_code: 'B',
      topic_id: null,
    },
  ],
  goal: {
    progress_pct: 76,
    target_accuracy_pct: 90,
    current_accuracy_pct: 80.5,
  },
}

export const handlers = [
  http.get('/core-api/v1/permits', () => HttpResponse.json({ items: permitResponse })),
  http.get('/core-api/v1/topics', () => HttpResponse.json({ items: topicResponse })),
  http.post('/core-api/v1/tests/generate', async ({ request }) => {
    const payload = (await request.json()) as { mode?: 'PERMIT' | 'TOPIC' | 'RANDOM' | 'FAILED'; topic_id?: number }
    return HttpResponse.json(createGeneratedTestResponse(payload.mode ?? 'PERMIT', payload.topic_id ?? null))
  }),
  http.get('/core-api/v1/tests/77', () => HttpResponse.json(createGeneratedTestResponse())),
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
