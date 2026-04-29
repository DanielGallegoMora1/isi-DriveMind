import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as studentsApi from '../api/students.api'
import type { CreateStudentInput, StudentsListFilters } from '../types'

const studentsQueryRoot = ['auth', 'students'] as const

export function useSchoolAdminStudents(token: string | null, filters: StudentsListFilters) {
  return useQuery({
    queryKey: [...studentsQueryRoot, filters],
    queryFn: () => studentsApi.listStudents(token ?? '', filters),
    enabled: Boolean(token),
  })
}

export function useCreateSchoolAdminStudent(token: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateStudentInput) => studentsApi.createStudent(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentsQueryRoot })
    },
  })
}
