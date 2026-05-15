import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rejectionReasonsService } from '@/services/rejection-reasons.service'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useRejectionReasons(activeOnly = true) {
  return useQuery({
    queryKey: ['rejection-reasons', activeOnly],
    queryFn: () => rejectionReasonsService.getAll(activeOnly),
  })
}

export function useCreateRejectionReason() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ reason_en, reason_ar }: { reason_en: string; reason_ar: string }) =>
      rejectionReasonsService.create(reason_en, reason_ar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rejection-reasons'] })
      toast.success(t('success.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateRejectionReason() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: { reason_en?: string; reason_ar?: string; is_active?: boolean }
    }) => rejectionReasonsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rejection-reasons'] })
      toast.success(t('success.updated'))
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
