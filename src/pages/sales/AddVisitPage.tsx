import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateVisit } from '@/hooks/useVisits'
import { useRejectionReasons } from '@/hooks/useRejectionReasons'
import { useAssignedCustomers } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/auth.store'
import { CheckCircle } from 'lucide-react'

const schema = z.object({
  customer_id: z.string().min(1, 'Required'),
  visit_date: z.string().min(1),
  result: z.enum(['approved', 'interested', 'follow_up', 'rejected']),
  rejection_reason_id: z.string().optional(),
  notes: z.string().optional(),
  next_follow_up: z.string().optional(),
}).refine(d => d.result !== 'rejected' || !!d.rejection_reason_id, {
  message: 'Rejection reason required',
  path: ['rejection_reason_id'],
})
type FormData = z.infer<typeof schema>

const RESULTS = ['approved', 'interested', 'follow_up', 'rejected'] as const

export default function AddVisitPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const createMutation = useCreateVisit()
  const { data: reasons } = useRejectionReasons()
  const { data: customersData } = useAssignedCustomers(profile?.id, { pageSize: 500 })
  const customers = customersData?.data ?? []
  const [done, setDone] = useState(false)

  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visit_date: localNow, result: 'interested' },
  })

  const result = watch('result')

  async function onSubmit(data: FormData) {
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
    setTimeout(() => { reset(); setDone(false) }, 2000)
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('nav.addVisit')}</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {done ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900 dark:text-white">{t('success.visitAdded')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t('visits.customer')} error={errors.customer_id?.message} required>
              <select {...register('customer_id')} className={inp}>
                <option value="">— {t('visits.customer')} —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name} – {c.owner_name}</option>
                ))}
              </select>
            </Field>
            <Field label={t('visits.visitDate')} error={errors.visit_date?.message} required>
              <input {...register('visit_date')} type="datetime-local" className={inp} />
            </Field>
            <Field label={t('visits.result')} error={errors.result?.message} required>
              <select {...register('result')} className={inp}>
                {RESULTS.map(r => <option key={r} value={r}>{t(`visits.results.${r}`)}</option>)}
              </select>
            </Field>
            {result === 'rejected' && (
              <Field label={t('visits.rejectionReason')} error={errors.rejection_reason_id?.message} required>
                <select {...register('rejection_reason_id')} className={inp}>
                  <option value="">— {t('visits.rejectionReason')} —</option>
                  {reasons?.map(r => <option key={r.id} value={r.id}>{r.reason_en}</option>)}
                </select>
              </Field>
            )}
            {result === 'follow_up' && (
              <Field label={t('visits.nextFollowUp')} error={errors.next_follow_up?.message}>
                <input {...register('next_follow_up')} type="datetime-local" className={inp} />
              </Field>
            )}
            <Field label={t('visits.notes')}>
              <textarea {...register('notes')} rows={3} className={inp} placeholder={t('common.optional')} />
            </Field>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-blue-700 text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {createMutation.isPending && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {t('visits.addVisit')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}{required && <span className="text-red-500 ms-0.5">*</span>}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors'
