import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, UserCircle, AlertOctagon } from 'lucide-react'
import { useRejectionReasons, useCreateRejectionReason, useUpdateRejectionReason } from '@/hooks/useRejectionReasons'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { RejectionReason } from '@/types/app.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { Switch } from '@/components/ui/Switch'
import EmptyState from '@/components/common/EmptyState'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/Dialog'

const reasonSchema = z.object({ reason_en: z.string().min(1), reason_ar: z.string().min(1) })
type ReasonForm = z.infer<typeof reasonSchema>

const profileSchema = z.object({ full_name: z.string().min(2), phone: z.string().optional() })
type ProfileForm = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const { t } = useTranslation()
  const { profile, setProfile } = useAuthStore()
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false)
  const [editingReason, setEditingReason] = useState<RejectionReason | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<RejectionReason | null>(null)
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

  function openAdd() {
    setEditingReason(null)
    resetReason({ reason_en: '', reason_ar: '' })
    setReasonDialogOpen(true)
  }

  function requestToggle(r: RejectionReason) {
    // Only confirm when deactivating; re-activating is non-destructive.
    if (r.is_active) {
      setDeactivateTarget(r)
    } else {
      updateReason.mutate({ id: r.id, updates: { is_active: true } })
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return
    await updateReason.mutateAsync({ id: deactivateTarget.id, updates: { is_active: false } })
    setDeactivateTarget(null)
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
      <h1 className="text-xl font-bold text-foreground">{t('settings.title')}</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-muted-foreground" />
            {t('settings.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('employees.fullName')} error={profileErrors.full_name?.message}>
                <Input {...regProfile('full_name')} aria-invalid={!!profileErrors.full_name} />
              </FormField>
              <FormField label={t('employees.phone')} error={profileErrors.phone?.message}>
                <Input {...regProfile('phone')} type="tel" />
              </FormField>
            </div>
            <div>
              <Button type="submit" loading={savingProfile}>
                {t('settings.updateProfile')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Rejection Reasons */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-muted-foreground" />
            {t('settings.rejectionReasons')}
          </CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            {t('settings.addReason')}
          </Button>
        </CardHeader>
        <CardContent>
          {reasons && reasons.length === 0 ? (
            <EmptyState icon={AlertOctagon} title={t('common.noData')} size="compact" />
          ) : (
            <div className="space-y-2">
              {reasons?.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.reason_en}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate" dir="rtl">{r.reason_ar}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ms-3">
                    <button
                      onClick={() => openEdit(r)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                      aria-label={t('common.edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <Switch
                      checked={r.is_active}
                      onCheckedChange={() => requestToggle(r)}
                      aria-label={r.is_active ? t('common.active') : t('common.inactive')}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reason dialog */}
      <Dialog open={reasonDialogOpen} onOpenChange={(open) => { setReasonDialogOpen(open); if (!open) setEditingReason(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReason ? t('settings.editReason') : t('settings.addReason')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReason(onReasonSubmit)}>
            <DialogBody className="space-y-4">
              <FormField label={t('settings.reasonEn')} error={reasonErrors.reason_en?.message} required>
                <Input {...regReason('reason_en')} aria-invalid={!!reasonErrors.reason_en} />
              </FormField>
              <FormField label={t('settings.reasonAr')} error={reasonErrors.reason_ar?.message} required>
                <Input {...regReason('reason_ar')} dir="rtl" aria-invalid={!!reasonErrors.reason_ar} />
              </FormField>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReasonDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={createReason.isPending || updateReason.isPending}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deactivateTarget}
        title={t('settings.confirmDeactivateReason')}
        confirmLabel={t('common.confirm')}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
        loading={updateReason.isPending}
      />
    </div>
  )
}
