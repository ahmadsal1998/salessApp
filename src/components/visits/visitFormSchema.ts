import { z } from 'zod'

export const RESULTS = ['approved', 'interested', 'follow_up', 'rejected'] as const

export const visitFormSchema = z
  .object({
    customer_id: z.string().min(1, 'Required'),
    employee_id: z.string().min(1, 'Required'),
    visit_date: z.string().min(1),
    result: z.enum(RESULTS),
    rejection_reason_id: z.string().optional(),
    notes: z.string().optional(),
    next_follow_up: z.string().optional(),
  })
  .refine((d) => d.result !== 'rejected' || !!d.rejection_reason_id, {
    message: 'Rejection reason required',
    path: ['rejection_reason_id'],
  })

export type VisitFormValues = z.infer<typeof visitFormSchema>

export function localDateTimeNow(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
