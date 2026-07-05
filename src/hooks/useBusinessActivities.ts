import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessActivitiesService } from '@/services/business-activities.service'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useBusinessActivities(activeOnly = true) {
  return useQuery({
    queryKey: ['business-activities', activeOnly],
    queryFn: () => businessActivitiesService.getAll(activeOnly),
  })
}

export function useCreateBusinessActivity() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (name: string) => businessActivitiesService.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-activities'] })
      toast.success(t('success.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
