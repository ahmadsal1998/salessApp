import { Controller, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { RESULTS, type VisitFormValues } from './visitFormSchema'
import type { RejectionReason } from '@/types/app.types'

interface VisitFormFieldsProps {
  form: UseFormReturn<VisitFormValues>
  customers: { id: string; business_name: string; owner_name: string }[]
  reasons?: RejectionReason[]
  employees?: { id: string; full_name: string }[]
  showEmployeeField?: boolean
  disableCustomerField?: boolean
}

export function VisitFormFields({
  form,
  customers,
  reasons,
  employees,
  showEmployeeField = false,
  disableCustomerField = false,
}: VisitFormFieldsProps) {
  const { t } = useTranslation()
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form
  const result = watch('result')

  return (
    <div className="space-y-4">
      <FormField label={t('visits.customer')} required error={errors.customer_id?.message}>
        <Controller
          control={control}
          name="customer_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={disableCustomerField}>
              <SelectTrigger aria-invalid={!!errors.customer_id}>
                <SelectValue placeholder={t('visits.customer')} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.business_name} – {c.owner_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      {showEmployeeField && (
        <FormField label={t('visits.employee')} required error={errors.employee_id?.message}>
          <Controller
            control={control}
            name="employee_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.employee_id}>
                  <SelectValue placeholder={t('visits.employee')} />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      )}

      <FormField label={t('visits.visitDate')} required error={errors.visit_date?.message}>
        <Input {...register('visit_date')} type="datetime-local" aria-invalid={!!errors.visit_date} />
      </FormField>

      <FormField label={t('visits.result')} required error={errors.result?.message}>
        <Controller
          control={control}
          name="result"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESULTS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`visits.results.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      {result === 'rejected' && (
        <FormField label={t('visits.rejectionReason')} required error={errors.rejection_reason_id?.message}>
          <Controller
            control={control}
            name="rejection_reason_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.rejection_reason_id}>
                  <SelectValue placeholder={t('visits.rejectionReason')} />
                </SelectTrigger>
                <SelectContent>
                  {reasons?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.reason_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      )}

      {result === 'follow_up' && (
        <FormField label={t('visits.nextFollowUp')} error={errors.next_follow_up?.message}>
          <Input {...register('next_follow_up')} type="datetime-local" />
        </FormField>
      )}

      <FormField label={t('visits.notes')}>
        <Textarea {...register('notes')} rows={3} placeholder={t('common.optional')} />
      </FormField>
    </div>
  )
}
