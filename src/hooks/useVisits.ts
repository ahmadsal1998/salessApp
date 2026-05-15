import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { visitsService } from '@/services/visits.service'
import type { VisitFilters } from '@/types/app.types'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

type VisitInsert = Database['public']['Tables']['visits']['Insert']

export function useVisits(filters: VisitFilters = {}) {
  return useQuery({
    queryKey: ['visits', filters],
    queryFn: () => visitsService.getVisits(filters),
  })
}

export function useTodayVisitCount(employeeId?: string) {
  return useQuery({
    queryKey: ['today-visits', employeeId],
    queryFn: () => visitsService.getTodayVisitCount(employeeId),
  })
}

export function useVisitsLast30Days() {
  return useQuery({
    queryKey: ['visits-30days'],
    queryFn: () => visitsService.getVisitsLast30Days(),
  })
}

export function useRejectionBreakdown() {
  return useQuery({
    queryKey: ['rejection-breakdown'],
    queryFn: () => visitsService.getRejectionBreakdown(),
  })
}

export function useTopEmployees() {
  return useQuery({
    queryKey: ['top-employees'],
    queryFn: () => visitsService.getTopEmployees(),
  })
}

export function useCreateVisit() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: VisitInsert) => visitsService.createVisit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['today-visits'] })
      queryClient.invalidateQueries({ queryKey: ['visits-30days'] })
      queryClient.invalidateQueries({ queryKey: ['top-employees'] })
      queryClient.invalidateQueries({ queryKey: ['rejection-breakdown'] })
      toast.success(t('success.visitAdded'))
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
