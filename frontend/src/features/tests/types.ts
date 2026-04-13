export type TestMode = 'PERMIT' | 'TOPIC' | 'RANDOM' | 'FAILED'

export type Permit = {
  id: number
  code: string
  name: string
}

export type Topic = {
  id: number
  permit_id: number
  topic_number: number
  name: string
}

export type TestOptionLabel = 'a' | 'b' | 'c'

export type TestOption = {
  id: number
  label: TestOptionLabel
  text: string
}

export type TestQuestion = {
  id: number
  external_id: string
  topic_id: number
  statement: string
  difficulty: number | null
  requires_image: boolean
  image_description: string | null
  options: TestOption[]
}

export type GeneratedTest = {
  id: number
  user_id: number
  mode: TestMode
  permit_id: number | null
  topic_id: number | null
  num_questions: number
  created_at: string
  questions: TestQuestion[]
}

export type GenerateTestInput = {
  permit_code: string
  mode: TestMode
  topic_id?: number
  count?: number
}

export type SubmitAnswer = {
  question_id: number
  selected_label: TestOptionLabel
}

export type TopicResult = {
  topic_id: number
  correct: number
  wrong: number
  accuracy_pct: number
}

export type TestResultReviewItem = {
  question_id: number
  selected_label: TestOptionLabel | null
  is_answered: boolean
  correct_label: TestOptionLabel
  is_correct: boolean
}

export type TestResult = {
  test_id: number
  correct_count: number
  wrong_count: number
  passed: boolean
  score: number | null
  by_topic: TopicResult[]
  review_items: TestResultReviewItem[]
}
