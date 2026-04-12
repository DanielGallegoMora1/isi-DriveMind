import { env } from '../../../config/env'
import { requestJson } from '../../../lib/http'
import type { GenerateTestInput, GeneratedTest, Permit, SubmitAnswer, TestResult, Topic } from '../types'

const coreBaseUrl = `${env.coreServiceUrl}/v1`

export function getPermits(token: string) {
  return requestJson<Permit[]>(`${coreBaseUrl}/permits`, {
    method: 'GET',
    token,
  })
}

export function getTopics(token: string, permitCode: string) {
  const searchParams = new URLSearchParams({ permit_code: permitCode })

  return requestJson<Topic[]>(`${coreBaseUrl}/topics?${searchParams.toString()}`, {
    method: 'GET',
    token,
  })
}

export function generateTest(token: string, input: GenerateTestInput) {
  return requestJson<GeneratedTest>(`${coreBaseUrl}/tests/generate`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      permit_code: input.permit_code,
      mode: input.mode,
      topic_id: input.topic_id,
      count: input.count ?? 30,
    }),
  })
}

export function getTestById(token: string, testId: number) {
  return requestJson<GeneratedTest>(`${coreBaseUrl}/tests/${testId}`, {
    method: 'GET',
    token,
  })
}

export function submitTest(token: string, testId: number, answers: SubmitAnswer[]) {
  return requestJson<TestResult>(`${coreBaseUrl}/tests/${testId}/submit`, {
    method: 'POST',
    token,
    body: JSON.stringify({ answers }),
  })
}
