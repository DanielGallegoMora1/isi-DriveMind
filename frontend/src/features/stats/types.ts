export type StatsSummary = {
  total_tests: number
  passed_tests: number
  failed_tests: number
  accuracy_pct: number
}

export type StatsByTopic = {
  topic_id: number
  correct: number
  wrong: number
  accuracy_pct: number
}

export type StatsHistoryItem = {
  test_id: number
  created_at: string
  passed: boolean
  score: number | null
  correct_count: number
  wrong_count: number
  accuracy_pct: number
  permit_code: string | null
  topic_id: number | null
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

export type StatsResponse = {
  summary: StatsSummary
  by_topic: StatsByTopic[]
  history: StatsHistoryItem[]
  trend: StatsTrendItem[]
  failed_distribution: FailedDistributionItem[]
}
