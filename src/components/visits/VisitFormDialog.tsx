import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useCreateVisit } from '@/hooks/useVisits'
import { useRejectionReasons } from '@/hooks/useRejectionReasons'
import { useEmployees } from '@/hooks/useEmployees'
import { useCustomers } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/auth.store'

const schema = z.object({
  customer_id: z.string().min(1, 'Required'),
  employee_id: z.string().min(1, 'Required'),
  visit_date: z.string().min(1),
  result: z.enum(['approved', 'interested', 'follow_up', 'rejected']),
  rejection_reason_id: z.string().optional(),
  notes: z.string().optional(),
  next_follow_up: z.string().optional(),
}).refine(
  (d) => d.result !== 'rejected' || (d.rejection_reason_id && d.rejection_reason_id.length > 0),
  { message: 'Rejection reason required', path: ['rejection_reason_id'] }
)

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  preselectedCustomerId?: string
}

const RESULTS = ['approved', 'interested', 'follow_up', 'rejected'] as const

export default function VisitFormDialog({ open, onClose, preselectedCustomerId }: Props) {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const createMutation = useCreateVisit()
  const { data: reasons } = useRejectionReasons()
  const { data: employees } = useEmployees()
  const { data: customersData } = useCustomers({ pageSize: 500 })
  const customers = customersData?.data ?? []

  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: preselectedCustomerId ?? '',
      employee_id: profile?.id ?? '',
      visit_date: localNow,
      result: 'interested',
    },
  })

  const result = watch('result')

  useEffect(() => {
    if (open) {
      reset({
        customer_id: preselectedCustomerId ?? '',
        employee_id: profile?.id ?? '',
        visit_date: localNow,
        result: 'interested',
      })
    }
  }, [open, preselectedCustomerId, profile, reset, localNow])

  async function onSubmit(data: FormData) {
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('visits.addVisit')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <Field label={t('visits.customer')} error={errors.customer_id?.message} required>
            <select
              {...register('customer_id')}
              disabled={!!preselectedCustomerId}
              className={inputClass}
            >
              <option value="">— {t('visits.customer')} —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.business_name} – {c.owner_name}</option>
              ))}
            </select>
          </Field>

          {profile?.role === 'admin' && (
            <Field label={t('visits.employee')} error={errors.employee_id?.message} required>
              <select {...register('employee_id')} className={inputClass}>
                <option value="">— {t('visits.employee')} —</option>
                {employees?.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label={t('visits.visitDate')} error={errors.visit_date?.message} required>
            <input {...register('visit_date')} type="datetime-local" className={inputClass} />
          </Field>

          <Field label={t('visits.result')} error={errors.result?.message} required>
            <select {...register('result')} className={inputClass}>
              {RESULTS.map(r => (
                <option key={r} value={r}>{t(`visits.results.${r}`)}</option>
              ))}
            </select>
          </Field>

          {result === 'rejected' && (
            <Field label={t('visits.rejectionReason')} error={errors.rejection_reason_id?.message} required>
              <select {...register('rejection_reason_id')} className={inputClass}>
                <option value="">— {t('visits.rejectionReason')} —</option>
                {reasons?.map(r => (
                  <option key={r.id} value={r.id}>{r.reason_en}</option>
                ))}
              </select>
            </Field>
          )}

          {result === 'follow_up' && (
            <Field label={t('visits.nextFollowUp')} error={errors.next_follow_up?.message}>
              <input {...register('next_follow_up')} type="datetime-local" className={inputClass} />
            </Field>
          )}

          <Field label={t('visits.notes')}>
            <textarea {...register('notes')} rows={3} className={inputClass} placeholder={t('common.optional')} />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2 transition-colors"
            >
              {createMutation.isPending && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors'
