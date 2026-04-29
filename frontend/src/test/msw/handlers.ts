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

type School = {
  id: string
  name: string
  email: string
  tax_id: string | null
  address: string | null
  phone: string | null
  active: boolean
  created_at: string | null
  updated_at: string | null
}

type Student = {
  id: string
  email: string
  full_name: string
  document_id: string | null
  phone: string | null
  licenses: string[]
  active: boolean
  created_at: string | null
  updated_at: string | null
  tests_completed: number | null
  tests_this_week: number | null
  pass_rate_pct: number | null
  average_score: number | null
  last_activity_at: string | null
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
    passed_tests: 8,
    failed_tests: 2,
    pass_rate_pct: 80,
    accuracy_pct: 80.5,
    average_score: 82.4,
    current_streak_days: 6,
    best_streak_days: 9,
    last_activity_at: '2026-04-11T10:15:30Z',
    average_time_seconds: 545,
    total_time_seconds: 5450,
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
      test_type: 'TOPIC',
      duration_seconds: null,
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
      test_type: 'RANDOM',
      duration_seconds: null,
    },
    {
      test_id: 79,
      created_at: '2026-04-08T08:40:00Z',
      passed: true,
      score: 88,
      correct_count: 27,
      wrong_count: 3,
      accuracy_pct: 90,
      permit_code: 'B',
      topic_id: null,
      test_type: 'PERMIT',
      duration_seconds: null,
    },
  ],
  goal: {
    progress_pct: 76,
    target_accuracy_pct: 90,
    current_accuracy_pct: 80.5,
  },
  by_topic: [
    {
      topic_id: 101,
      topic_name: 'Señales',
      correct: 24,
      wrong: 3,
      accuracy_pct: 88.9,
    },
    {
      topic_id: 102,
      topic_name: 'Normas de circulación',
      correct: 18,
      wrong: 7,
      accuracy_pct: 72,
    },
    {
      topic_id: 103,
      topic_name: 'Seguridad vial',
      correct: 21,
      wrong: 4,
      accuracy_pct: 84,
    },
    {
      topic_id: 104,
      topic_name: 'Mecánica básica',
      correct: 15,
      wrong: 8,
      accuracy_pct: 65.2,
    },
  ],
  trend: [
    { period: '2026-04-07', tests: 1, accuracy_pct: 68, pass_rate_pct: 0 },
    { period: '2026-04-08', tests: 1, accuracy_pct: 90, pass_rate_pct: 100 },
    { period: '2026-04-09', tests: 2, accuracy_pct: 74, pass_rate_pct: 50 },
    { period: '2026-04-10', tests: 1, accuracy_pct: 73.3, pass_rate_pct: 0 },
    { period: '2026-04-11', tests: 2, accuracy_pct: 86.7, pass_rate_pct: 100 },
    { period: '2026-04-12', tests: 1, accuracy_pct: 88, pass_rate_pct: 100 },
    { period: '2026-04-13', tests: 2, accuracy_pct: 84, pass_rate_pct: 100 },
  ],
  failed_distribution: [
    { topic_id: 104, topic_name: 'Mecánica básica', wrong_count: 8 },
    { topic_id: 102, topic_name: 'Normas de circulación', wrong_count: 7 },
  ],
  test_type_distribution: [
    { test_type: 'PERMIT', tests: 4, percentage: 40 },
    { test_type: 'TOPIC', tests: 3, percentage: 30 },
    { test_type: 'RANDOM', tests: 2, percentage: 20 },
    { test_type: 'FAILED', tests: 1, percentage: 10 },
  ],
  weekly_activity: [
    { date: '2026-04-07', tests: 1 },
    { date: '2026-04-08', tests: 1 },
    { date: '2026-04-09', tests: 2 },
    { date: '2026-04-10', tests: 1 },
    { date: '2026-04-11', tests: 2 },
    { date: '2026-04-12', tests: 1 },
    { date: '2026-04-13', tests: 2 },
  ],
  insights: {
    strongest_topic: {
      topic_id: 101,
      topic_name: 'Señales',
      correct: 24,
      wrong: 3,
      accuracy_pct: 88.9,
    },
    improvement_area: {
      topic_id: 104,
      topic_name: 'Mecánica básica',
      correct: 15,
      wrong: 8,
      accuracy_pct: 65.2,
    },
    trend: {
      window_days: 7,
      recent_accuracy_pct: 84,
      previous_accuracy_pct: 71,
      change_pct_points: 13,
      direction: 'up',
    },
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

const initialSchools: School[] = [
  {
    id: 'school-centro',
    name: 'Autoescuela Centro',
    email: 'centro@school.test',
    tax_id: null,
    address: 'Calle Mayor 1',
    phone: null,
    active: true,
    created_at: '2026-04-12T09:00:00Z',
    updated_at: '2026-04-12T09:00:00Z',
  },
  {
    id: 'school-norte',
    name: 'Autoescuela Norte',
    email: 'norte@school.test',
    tax_id: null,
    address: 'Avenida Norte 7',
    phone: null,
    active: true,
    created_at: '2026-04-12T09:05:00Z',
    updated_at: '2026-04-12T09:05:00Z',
  },
]

const initialStudents: Student[] = [
  {
    id: 'student-1',
    email: 'lucia@drivemind.test',
    full_name: 'Lucía Pérez',
    document_id: '11111111A',
    phone: '+34 600 111 111',
    licenses: ['B'],
    active: true,
    created_at: '2025-09-10T09:00:00Z',
    updated_at: '2026-04-29T10:45:00Z',
    tests_completed: 42,
    tests_this_week: 38,
    pass_rate_pct: 92,
    average_score: 8.9,
    last_activity_at: '2026-04-29T10:45:00Z',
  },
  {
    id: 'student-2',
    email: 'sofia@drivemind.test',
    full_name: 'Sofía Navarro',
    document_id: '22222222B',
    phone: '+34 600 222 222',
    licenses: ['A1'],
    active: true,
    created_at: '2025-11-15T12:00:00Z',
    updated_at: '2026-04-28T18:20:00Z',
    tests_completed: 31,
    tests_this_week: 41,
    pass_rate_pct: 84,
    average_score: 8.4,
    last_activity_at: '2026-04-28T18:20:00Z',
  },
  {
    id: 'student-3',
    email: 'daniel@drivemind.test',
    full_name: 'Daniel Ortega',
    document_id: '33333333C',
    phone: '+34 600 333 333',
    licenses: ['B'],
    active: true,
    created_at: '2025-12-03T16:30:00Z',
    updated_at: '2026-04-26T09:30:00Z',
    tests_completed: 56,
    tests_this_week: 35,
    pass_rate_pct: 78,
    average_score: 7.8,
    last_activity_at: '2026-04-26T09:30:00Z',
  },
  {
    id: 'student-4',
    email: 'alba@drivemind.test',
    full_name: 'Alba Martín',
    document_id: '44444444D',
    phone: '+34 600 444 444',
    licenses: ['B'],
    active: true,
    created_at: '2026-01-17T08:10:00Z',
    updated_at: '2026-04-25T19:10:00Z',
    tests_completed: 24,
    tests_this_week: 56,
    pass_rate_pct: 74,
    average_score: 7.2,
    last_activity_at: '2026-04-25T19:10:00Z',
  },
  {
    id: 'student-5',
    email: 'hugo@drivemind.test',
    full_name: 'Hugo Serrano',
    document_id: '55555555E',
    phone: '+34 600 555 555',
    licenses: ['C'],
    active: true,
    created_at: '2026-02-20T11:45:00Z',
    updated_at: '2026-04-24T12:35:00Z',
    tests_completed: 19,
    tests_this_week: 48,
    pass_rate_pct: 86,
    average_score: 8.7,
    last_activity_at: '2026-04-24T12:35:00Z',
  },
  {
    id: 'student-6',
    email: 'nerea@drivemind.test',
    full_name: 'Nerea Gil',
    document_id: '66666666F',
    phone: null,
    licenses: ['B'],
    active: false,
    created_at: '2026-03-11T14:25:00Z',
    updated_at: '2026-04-20T17:00:00Z',
    tests_completed: 12,
    tests_this_week: 0,
    pass_rate_pct: 66,
    average_score: 6.4,
    last_activity_at: '2026-04-20T17:00:00Z',
  },
]

let aiConversationCounter = 2
let aiMessageCounter = 3
let aiConversations = cloneAiConversations(initialAiConversations)
let aiMessages = cloneAiMessages(initialAiMessages)
let schoolCounter = 3
let schools = cloneSchools(initialSchools)
let studentCounter = initialStudents.length + 1
let students = cloneStudents(initialStudents)

export function resetAiAssistantMockState() {
  aiConversationCounter = 2
  aiMessageCounter = 3
  aiConversations = cloneAiConversations(initialAiConversations)
  aiMessages = cloneAiMessages(initialAiMessages)
}

export function resetSchoolsMockState() {
  schoolCounter = 3
  schools = cloneSchools(initialSchools)
}

export function resetStudentsMockState() {
  studentCounter = initialStudents.length + 1
  students = cloneStudents(initialStudents)
}

export function setAiAssistantMockState(conversations: AiConversation[], messages: AiMessage[]) {
  aiConversationCounter = conversations.length + 1
  aiMessageCounter = messages.length + 1
  aiConversations = cloneAiConversations(conversations)
  aiMessages = cloneAiMessages(messages)
}

export const handlers = [
  http.get('/api/v1/auth/schools', ({ request }) => {
    const url = new URL(request.url)
    const nameFilter = url.searchParams.get('name')?.trim().toLowerCase()
    const activeFilter = url.searchParams.get('active')
    const limit = Number(url.searchParams.get('limit') ?? 20)
    const offset = Number(url.searchParams.get('offset') ?? 0)
    const filteredSchools = schools.filter((school) => {
      const matchesName = !nameFilter || school.name.toLowerCase().includes(nameFilter)
      const matchesActive = activeFilter == null || String(school.active) === activeFilter

      return matchesName && matchesActive
    })
    const items = filteredSchools.slice(offset, offset + limit)

    return HttpResponse.json({ items, total: filteredSchools.length, limit, offset })
  }),
  http.post('/api/v1/auth/schools', async ({ request }) => {
    const payload = (await request.json()) as { name: string; email: string; password: string; tax_id?: string; address?: string; phone?: string }
    const timestamp = '2026-04-12T10:00:00Z'
    const school: School = {
      id: `school-${schoolCounter}`,
      name: payload.name,
      email: payload.email,
      tax_id: payload.tax_id ?? null,
      address: payload.address ?? null,
      phone: payload.phone ?? null,
      active: true,
      created_at: timestamp,
      updated_at: timestamp,
    }

    schoolCounter += 1
    schools = [school, ...schools]

    return HttpResponse.json(
      {
        school,
        admin_user: {
          id: `school-admin-${school.id}`,
          email: payload.email,
          full_name: `${payload.name} Admin`,
          role: 'school_admin',
          school_id: school.id,
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp,
        },
      },
      { status: 201 },
    )
  }),
  http.delete('/api/v1/auth/schools/:schoolId', ({ params }) => {
    const schoolId = String(params.schoolId)
    const existingSchool = schools.find((school) => school.id === schoolId)

    if (!existingSchool) {
      return HttpResponse.json({ detail: 'school_not_found' }, { status: 404 })
    }

    schools = schools.map((school) => (school.id === schoolId ? { ...school, active: false } : school))

    return new HttpResponse(null, { status: 204 })
  }),
  http.get('/api/v1/auth/students', ({ request }) => {
    const url = new URL(request.url)
    const licenseFilter = url.searchParams.get('license')?.trim().toUpperCase()
    const activeFilter = url.searchParams.get('active')
    const limit = Number(url.searchParams.get('limit') ?? 100)
    const offset = Number(url.searchParams.get('offset') ?? 0)
    const filteredStudents = students.filter((student) => {
      const matchesLicense = !licenseFilter || student.licenses.includes(licenseFilter)
      const matchesActive = activeFilter == null || String(student.active) === activeFilter

      return matchesLicense && matchesActive
    })
    const items = filteredStudents.slice(offset, offset + limit)

    return HttpResponse.json({ items, total: filteredStudents.length, limit, offset })
  }),
  http.post('/api/v1/auth/students', async ({ request }) => {
    const payload = (await request.json()) as {
      email?: string
      full_name?: string
      password?: string
      licenses?: string[]
    }

    const normalizedEmail = payload.email?.trim().toLowerCase() ?? ''

    if (!normalizedEmail || !payload.full_name?.trim() || !payload.password || !payload.licenses?.length) {
      return HttpResponse.json({ detail: 'validation_error' }, { status: 422 })
    }

    if (students.some((student) => student.email.toLowerCase() === normalizedEmail)) {
      return HttpResponse.json({ detail: 'email_already_exists' }, { status: 409 })
    }

    await new Promise((resolve) => setTimeout(resolve, 60))

    const timestamp = `2026-04-29T12:${String(studentCounter).padStart(2, '0')}:00Z`
    const student: Student = {
      id: `student-${studentCounter}`,
      active: true,
      average_score: null,
      created_at: timestamp,
      document_id: null,
      email: normalizedEmail,
      full_name: payload.full_name.trim(),
      last_activity_at: null,
      licenses: payload.licenses.map((license) => license.trim().toUpperCase()).filter(Boolean),
      pass_rate_pct: null,
      phone: null,
      tests_completed: 0,
      tests_this_week: 0,
      updated_at: timestamp,
    }

    studentCounter += 1
    students = [student, ...students]

    return HttpResponse.json({ student }, { status: 201 })
  }),
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

function cloneSchools(items: School[]) {
  return items.map((school) => ({ ...school }))
}

function cloneStudents(items: Student[]) {
  return items.map((student) => ({ ...student, licenses: [...student.licenses] }))
}
