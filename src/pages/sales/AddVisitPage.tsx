import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle } from 'lucide-react'
import { useCreateVisit } from '@/hooks/useVisits'
import { useRejectionReasons } from '@/hooks/useRejectionReasons'
import { useAssignedCustomers } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VisitFormFields } from '@/components/visits/VisitFormFields'
import { visitFormSchema, localDateTimeNow, type VisitFormValues } from '@/components/visits/visitFormSchema'

export default function AddVisitPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const createMutation = useCreateVisit()
  const { data: reasons } = useRejectionReasons()
  const { data: customersData } = useAssignedCustomers(profile?.id, { pageSize: 500 })
  const customers = customersData?.data ?? []
  const [done, setDone] = useState(false)

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      employee_id: profile?.id ?? '',
      visit_date: localDateTimeNow(),
      result: 'interested',
    },
  })

  const { handleSubmit, reset } = form

  async function onSubmit(data: VisitFormValues) {
    await createMutation.mutateAsync({
      customer_id: data.customer_id,
      employee_id: profile!.id,
      visit_date: new Date(data.visit_date).toISOString(),
      result: data.result,
      rejection_reason_id: data.result === 'rejected' ? data.rejection_reason_id || null : null,
      notes: data.notes || null,
      next_follow_up: data.next_follow_up ? new Date(data.next_follow_up).toISOString() : null,
    })
    setDone(true)
    setTimeout(() => {
      reset({ employee_id: profile?.id ?? '', visit_date: localDateTimeNow(), result: 'interested' })
      setDone(false)
    }, 2000)
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold text-foreground">{t('nav.addVisit')}</h1>

      <Card>
        <CardContent className="pt-4 sm:pt-6">
          {done ? (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto mb-3 size-12 text-emerald-500" />
              <p className="font-semibold text-foreground">{t('success.visitAdded')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <VisitFormFields form={form} customers={customers} reasons={reasons} showEmployeeField={false} />

              <Button type="submit" loading={createMutation.isPending} className="w-full">
                {t('visits.addVisit')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
