import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useCreateVisit } from '@/hooks/useVisits'
import { useRejectionReasons } from '@/hooks/useRejectionReasons'
import { useEmployees } from '@/hooks/useEmployees'
import { useCustomers } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/auth.store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { VisitFormFields } from '@/components/visits/VisitFormFields'
import { visitFormSchema, localDateTimeNow, type VisitFormValues } from '@/components/visits/visitFormSchema'

interface Props {
  open: boolean
  onClose: () => void
  preselectedCustomerId?: string
}

export default function VisitFormDialog({ open, onClose, preselectedCustomerId }: Props) {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const createMutation = useCreateVisit()
  const { data: reasons } = useRejectionReasons()
  const { data: employees } = useEmployees()
  const { data: customersData } = useCustomers({ pageSize: 500 })
  const customers = customersData?.data ?? []

  const localNow = localDateTimeNow()

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      customer_id: preselectedCustomerId ?? '',
      employee_id: profile?.id ?? '',
      visit_date: localNow,
      result: 'interested',
    },
  })

  const { handleSubmit, reset } = form

  useEffect(() => {
    if (open) {
      reset({
        customer_id: preselectedCustomerId ?? '',
        employee_id: profile?.id ?? '',
        visit_date: localDateTimeNow(),
        result: 'interested',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedCustomerId, profile, reset])

  async function onSubmit(data: VisitFormValues) {
    await createMutation.mutateAsync({
      customer_id: data.customer_id,
      employee_id: data.employee_id,
      visit_date: new Date(data.visit_date).toISOString(),
      result: data.result,
      rejection_reason_id: data.result === 'rejected' ? data.rejection_reason_id || null : null,
      notes: data.notes || null,
      next_follow_up: data.next_follow_up ? new Date(data.next_follow_up).toISOString() : null,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('visits.addVisit')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <DialogBody>
            <VisitFormFields
              form={form}
              customers={customers}
              reasons={reasons}
              employees={employees}
              showEmployeeField={profile?.role === 'admin'}
              disableCustomerField={!!preselectedCustomerId}
            />
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
