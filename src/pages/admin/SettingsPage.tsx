import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, ToggleLeft, ToggleRight, UserCircle, AlertOctagon } from 'lucide-react'
import { useRejectionReasons, useCreateRejectionReason, useUpdateRejectionReason } from '@/hooks/useRejectionReasons'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { RejectionReason } from '@/types/app.types'
import { cn } from '@/utils/cn'

const reasonSchema = z.object({ reason_en: z.string().min(1), reason_ar: z.string().min(1) })
type ReasonForm = z.infer<typeof reasonSchema>

const profileSchema = z.object({ full_name: z.string().min(2), phone: z.string().optional() })
type ProfileForm = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const { t } = useTranslation()
  const { profile, setProfile } = useAuthStore()
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false)
  const [editingReason, setEditingReason] = useState<RejectionReason | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const { data: reasons } = useRejectionReasons(false)
  const createReason = useCreateRejectionReason()
  const updateReason = useUpdateRejectionReason()

  const { register: regReason, handleSubmit: handleReason, reset: resetReason, formState: { errors: reasonErrors } } = useForm<ReasonForm>({ resolver: zodResolver(reasonSchema) })
  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' },
  })

  async function onReasonSubmit(data: ReasonForm) {
    if (editingReason) {
      await updateReason.mutateAsync({ id: editingReason.id, updates: data })
    } else {
      await createReason.mutateAsync(data)
    }
    setReasonDialogOpen(false)
    setEditingReason(null)
    resetReason()
  }

  function openEdit(r: RejectionReason) {
    setEditingReason(r)
    resetReason({ reason_en: r.reason_en, reason_ar: r.reason_ar })
    setReasonDialogOpen(true)
  }

  async function onProfileSubmit(data: ProfileForm) {
    if (!profile) return
    setSavingProfile(true)
    try {
      const updated = await authService.updateProfile(profile.id, data)
      setProfile(updated)
      toast.success(t('success.profileUpdated'))
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>

      {/* Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-gray-400" />
          {t('settings.profile')}
        </h2>
        <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('employees.fullName')} error={profileErrors.full_name?.message}>
              <input {...regProfile('full_name')} className={inp} />
            </Field>
            <Field label={t('employees.phone')} error={profileErrors.phone?.message}>
              <input {...regProfile('phone')} type="tel" className={inp} />
            </Field>
          </div>
          <div>
            <button type="submit" disabled={savingProfile} className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2 transition-colors">
              {savingProfile && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {t('settings.updateProfile')}
            </button>
          </div>
        </form>
      </div>

      {/* Rejection Reasons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-gray-400" />
            {t('settings.rejectionReasons')}
          </h2>
          <button
            onClick={() => { setEditingReason(null); resetReason({ reason_en: '', reason_ar: '' }); setReasonDialogOpen(true) }}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('settings.addReason')}
          </button>
        </div>
        <div className="space-y-2">
          {reasons?.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.reason_en}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate" dir="rtl">{r.reason_ar}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 ms-3">
                <button
                  onClick={() => openEdit(r)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateReason.mutateAsync({ id: r.id, updates: { is_active: !r.is_active } })}
                  className={cn('p-1.5 rounded-lg transition-colors', r.is_active ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')}
                >
                  {r.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reason dialog */}
      {reasonDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReasonDialogOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingReason ? t('settings.editReason') : t('settings.addReason')}</h2>
              <button onClick={() => setReasonDialogOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleReason(onReasonSubmit)} className="space-y-4">
              <Field label={t('settings.reasonEn')} error={reasonErrors.reason_en?.message} required>
                <input {...regReason('reason_en')} className={inp} />
              </Field>
              <Field label={t('settings.reasonAr')} error={reasonErrors.reason_ar?.message} required>
                <input {...regReason('reason_ar')} dir="rtl" className={inp} />
              </Field>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setReasonDialogOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">{t('common.cancel')}</button>
                <button type="submit" disabled={createReason.isPending || updateReason.isPending} className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2 transition-colors">
                  {(createReason.isPending || updateReason.isPending) && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
