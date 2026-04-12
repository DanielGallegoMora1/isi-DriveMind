import { useMutation, useQuery } from '@tanstack/react-query'
import * as testsApi from '../api/tests.api'
import type { GenerateTestInput, SubmitAnswer } from '../types'

export function usePermits(token: string | null) {
  return useQuery({
    queryKey: ['core', 'permits'],
    queryFn: () => testsApi.getPermits(token ?? ''),
    enabled: Boolean(token),
  })
}

export function useTopics(token: string | null, permitCode: string, enabled: boolean) {
  return useQuery({
    queryKey: ['core', 'topics', permitCode],
    queryFn: () => testsApi.getTopics(token ?? '', permitCode),
    enabled: Boolean(token) && enabled && permitCode.length > 0,
  })
}

export function useGenerateTest(token: string | null) {
  return useMutation({
    mutationFn: (input: GenerateTestInput) => testsApi.generateTest(token ?? '', input),
  })
}

export function useTestDetails(token: string | null, testId: number | null) {
  return useQuery({
    queryKey: ['core', 'tests', testId],
    queryFn: () => testsApi.getTestById(token ?? '', testId ?? 0),
    enabled: Boolean(token) && testId !== null,
  })
}

export function useSubmitTest(token: string | null, testId: number | null) {
  return useMutation({
    mutationFn: (answers: SubmitAnswer[]) => testsApi.submitTest(token ?? '', testId ?? 0, answers),
  })
}
