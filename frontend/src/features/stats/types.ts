export type StatsSummary = {
  total_tests: number
  pass_rate_pct: number
  accuracy_pct: number
  current_streak_days: number
}

export type StatsByTopic = {
  topic_id: number
  correct: number
  wrong: number
  accuracy_pct: number
}

export type StatsHistoryItem = {
  test_id: number | string
  created_at: string
  passed: boolean
  score: number | null
  correct_count: number
  wrong_count: number
  accuracy_pct: number
  permit_code: string | null
  topic_id: number | string | null
}

export type StatsTrendItem = {
  period: string
  tests: number
  accuracy_pct: number
}

export type FailedDistributionItem = {
  topic_id: number
  wrong_count: number
}

export type StatsGoal = {
  progress_pct: number
  target_accuracy_pct: number
  current_accuracy_pct: number
}

export type StatsResponse = {
  summary: StatsSummary
  history: StatsHistoryItem[]
  goal: StatsGoal
  by_topic?: StatsByTopic[]
  trend?: StatsTrendItem[]
  failed_distribution?: FailedDistributionItem[]
}
