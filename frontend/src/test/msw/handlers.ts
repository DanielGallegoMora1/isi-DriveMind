import { http, HttpResponse } from 'msw'

type AiConversation = {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

type AiMessage = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

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

const initialAiConversations: AiConversation[] = [
  {
    id: 'conv-1',
    user_id: 'user-1',
    title: 'Normativa sobre adelantamientos',
    created_at: '2026-04-12T09:00:00Z',
    updated_at: '2026-04-12T09:02:00Z',
  },
]

const initialAiMessages: AiMessage[] = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    role: 'user',
    content: '¿Cuándo está prohibido adelantar en carretera?',
    created_at: '2026-04-12T09:01:00Z',
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    role: 'assistant',
    content: 'Está prohibido adelantar cuando la maniobra compromete la visibilidad, invade zonas señalizadas o pone en riesgo a otros usuarios.',
    created_at: '2026-04-12T09:02:00Z',
  },
]

let aiConversationCounter = 2
let aiMessageCounter = 3
let aiConversations = cloneAiConversations(initialAiConversations)
let aiMessages = cloneAiMessages(initialAiMessages)

export function resetAiAssistantMockState() {
  aiConversationCounter = 2
  aiMessageCounter = 3
  aiConversations = cloneAiConversations(initialAiConversations)
  aiMessages = cloneAiMessages(initialAiMessages)
}

export function setAiAssistantMockState(conversations: AiConversation[], messages: AiMessage[]) {
  aiConversationCounter = conversations.length + 1
  aiMessageCounter = messages.length + 1
  aiConversations = cloneAiConversations(conversations)
  aiMessages = cloneAiMessages(messages)
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
    const answersByQuestionId = new Map(payload.answers.map((answer) => [answer.question_id, answer.selected_label]))
    const totalQuestions = 30
    const correctCount = Array.from({ length: totalQuestions }, (_, index) => index + 1).filter(
      (questionId) => answersByQuestionId.get(questionId) === 'b',
    ).length
    const wrongCount = Array.from({ length: totalQuestions }, (_, index) => index + 1).filter((questionId) => {
      const selectedLabel = answersByQuestionId.get(questionId)
      return selectedLabel != null && selectedLabel !== 'b'
    }).length

    return HttpResponse.json({
      test_id: 77,
      correct_count: correctCount,
      wrong_count: wrongCount,
      passed: wrongCount <= 3,
      score: Math.round((correctCount / totalQuestions) * 100),
      review_items: Array.from({ length: totalQuestions }, (_, index) => ({
        question_id: index + 1,
        selected_label: answersByQuestionId.get(index + 1) ?? null,
        is_answered: answersByQuestionId.has(index + 1),
        correct_label: 'b',
        is_correct: answersByQuestionId.get(index + 1) === 'b',
      })),
      by_topic: [
        {
          topic_id: 101,
          correct: correctCount,
          wrong: wrongCount,
          accuracy_pct: (correctCount / totalQuestions) * 100,
        },
      ],
    })
  }),
  http.get('/core-api/v1/stats', () => HttpResponse.json(statsResponse)),
  http.get('/ai-api/v1/ai/conversations', () => {
    const items = [...aiConversations].sort((left, right) => right.updated_at.localeCompare(left.updated_at))
    return HttpResponse.json({ items, total: items.length, limit: 20, offset: 0 })
  }),
  http.post('/ai-api/v1/ai/conversations', async ({ request }) => {
    const payload = (await request.json()) as { title?: string | null }
    const timestamp = `2026-04-12T09:${String(aiConversationCounter + 1).padStart(2, '0')}:00Z`
    const conversation: AiConversation = {
      id: `conv-${aiConversationCounter}`,
      user_id: 'user-1',
      title: payload.title ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    }

    aiConversationCounter += 1
    aiConversations = [conversation, ...aiConversations]

    return HttpResponse.json({ conversation }, { status: 201 })
  }),
  http.get('/ai-api/v1/ai/conversations/:conversationId', ({ params }) => {
    const conversationId = String(params.conversationId)
    const conversation = aiConversations.find((item) => item.id === conversationId)

    if (!conversation) {
      return HttpResponse.json({ detail: 'conversation_not_found' }, { status: 404 })
    }

    const messages = aiMessages.filter((message) => message.conversation_id === conversationId)
    return HttpResponse.json({ conversation, messages })
  }),
  http.post('/ai-api/v1/ai/messages', async ({ request }) => {
    const payload = (await request.json()) as { conversation_id: string; content: string }
    const conversation = aiConversations.find((item) => item.id === payload.conversation_id)

    if (!conversation) {
      return HttpResponse.json({ detail: 'conversation_not_found' }, { status: 404 })
    }

    const userTimestamp = `2026-04-12T10:${String(aiMessageCounter).padStart(2, '0')}:00Z`
    const assistantTimestamp = `2026-04-12T10:${String(aiMessageCounter + 1).padStart(2, '0')}:00Z`

    const message: AiMessage = {
      id: `msg-${aiMessageCounter}`,
      conversation_id: payload.conversation_id,
      role: 'user',
      content: payload.content,
      created_at: userTimestamp,
    }

    const assistantMessage: AiMessage = {
      id: `msg-${aiMessageCounter + 1}`,
      conversation_id: payload.conversation_id,
      role: 'assistant',
      content: `Respuesta del asistente: ${payload.content}`,
      created_at: assistantTimestamp,
    }

    aiMessageCounter += 2
    aiMessages = [...aiMessages, message, assistantMessage]
    aiConversations = aiConversations.map((item) =>
      item.id === payload.conversation_id ? { ...item, updated_at: assistantTimestamp } : item,
    )

    return HttpResponse.json(
      {
        message,
        assistant_reply: assistantMessage.content,
      },
      { status: 201 },
    )
  }),
]

function cloneAiConversations(conversations: AiConversation[]) {
  return conversations.map((conversation) => ({ ...conversation }))
}

function cloneAiMessages(messages: AiMessage[]) {
  return messages.map((message) => ({ ...message }))
}
