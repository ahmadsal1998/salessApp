import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesService } from '@/services/employees.service'
import { authService } from '@/services/auth.service'
import type { Profile } from '@/types/app.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesService.getEmployees(),
  })
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => employeesService.getAllProfiles(),
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (params: { email: string; password: string; fullName: string; phone?: string }) =>
      authService.createEmployee(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success(t('success.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Profile, 'full_name' | 'phone' | 'is_active'>> }) =>
      employeesService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success(t('success.updated'))
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
