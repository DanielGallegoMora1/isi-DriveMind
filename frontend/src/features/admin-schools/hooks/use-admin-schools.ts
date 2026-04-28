import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as adminSchoolsApi from '../api/admin-schools.api'
import type { CreateSchoolInput, SchoolsListFilters } from '../types'

const schoolsQueryRoot = ['auth', 'schools'] as const

export function useSchools(token: string | null, filters: SchoolsListFilters) {
  return useQuery({
    queryKey: [...schoolsQueryRoot, filters],
    queryFn: () => adminSchoolsApi.listSchools(token ?? '', filters),
    enabled: Boolean(token),
  })
}

export function useCreateSchool(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSchoolInput) => adminSchoolsApi.createSchool(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: schoolsQueryRoot })
    },
  })
}

export function useDeleteSchool(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (schoolId: string) => adminSchoolsApi.deleteSchool(token ?? '', schoolId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: schoolsQueryRoot })
    },
  })
}
