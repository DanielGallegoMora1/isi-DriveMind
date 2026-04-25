import { env } from '../../../config/env'
import { requestJson } from '../../../lib/http'
import type { StatsResponse } from '../types'

const coreBaseUrl = `${env.coreServiceUrl}/v1`

export function getStats(token: string) {
  return requestJson<StatsResponse>(`${coreBaseUrl}/stats`, {
    method: 'GET',
    cache: 'no-store',
    token,
  })
}
