import { useQuery } from '@tanstack/react-query'
import { getStats } from '../api/stats.api'

export function useStats(token: string | null) {
  return useQuery({
    queryKey: ['core', 'stats', token],
    queryFn: () => getStats(token ?? ''),
    enabled: Boolean(token),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  })
}
