import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersService } from '@/services/customers.service'
import type { CustomerFilters } from '@/types/app.types'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customersService.getCustomers(filters),
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersService.getCustomerById(id!),
    enabled: !!id,
  })
}

export function useAssignedCustomers(employeeId: string | undefined, filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: ['assigned-customers', employeeId, filters],
    queryFn: () => customersService.getAssignedCustomers(employeeId!, filters),
    enabled: !!employeeId,
  })
}

export function useCustomersForMap(employeeId?: string) {
  return useQuery({
    queryKey: ['customers-map', employeeId],
    queryFn: () => customersService.getAllForMap(employeeId),
  })
}

export function useFollowUpCustomers(employeeId?: string) {
  return useQuery({
    queryKey: ['follow-ups', employeeId],
    queryFn: () => customersService.getFollowUps(employeeId),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: CustomerInsert) => customersService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-map'] })
      toast.success(t('success.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) =>
      customersService.updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
      queryClient.invalidateQueries({ queryKey: ['customers-map'] })
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      toast.success(t('success.updated'))
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => customersService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-map'] })
      toast.success(t('success.deleted'))
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
