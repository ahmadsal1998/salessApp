import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Users } from 'lucide-react'
import { useEmployees, useCreateEmployee, useUpdateEmployee } from '@/hooks/useEmployees'
import EmptyState from '@/components/common/EmptyState'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/Dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Profile } from '@/types/app.types'

const addSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
})
type AddForm = z.infer<typeof addSchema>

export default function EmployeesPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<Profile | null>(null)
  const { data: employees, isLoading } = useEmployees()
  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddForm>({
    resolver: zodResolver(addSchema),
  })

  const filtered = employees?.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  ) ?? []
  const hasActiveFilters = search !== ''

  async function handleCreate(data: AddForm) {
    await createMutation.mutateAsync({
      email: data.email,
      password: data.password,
      fullName: data.full_name,
      phone: data.phone,
    })
    setAddOpen(false)
    reset()
  }

  function requestToggle(emp: Profile) {
    // Only confirm when deactivating; re-activating is non-destructive.
    if (emp.is_active) {
      setToggleTarget(emp)
    } else {
      updateMutation.mutate({ id: emp.id, data: { is_active: true } })
    }
  }

  async function confirmToggle() {
    if (!toggleTarget) return
    await updateMutation.mutateAsync({ id: toggleTarget.id, data: { is_active: false } })
    setToggleTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-foreground">{t('employees.title')}</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" />
          {t('employees.addEmployee')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('employees.searchPlaceholder')}
          className="ps-9"
        />
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={t(hasActiveFilters ? 'common.noFilterResults' : 'common.noData')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <Card key={emp.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {emp.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                  </div>
                </div>
                <Switch
                  checked={emp.is_active}
                  onCheckedChange={() => requestToggle(emp)}
                  aria-label={emp.is_active ? t('common.active') : t('common.inactive')}
                  className="shrink-0"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {emp.phone && <span>{emp.phone}</span>}
                <Badge variant={emp.is_active ? 'success' : 'default'}>
                  {emp.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) reset() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('employees.addEmployee')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreate)}>
            <DialogBody className="space-y-4">
              <FormField label={t('employees.fullName')} error={errors.full_name?.message} required>
                <Input {...register('full_name')} aria-invalid={!!errors.full_name} />
              </FormField>
              <FormField label={t('employees.email')} error={errors.email?.message} required>
                <Input {...register('email')} type="email" aria-invalid={!!errors.email} />
              </FormField>
              <FormField label={t('employees.phone')} error={errors.phone?.message}>
                <Input {...register('phone')} type="tel" />
              </FormField>
              <FormField
                label={t('employees.setPassword')}
                error={errors.password?.message}
                required
                hint={t('employees.passwordInfo')}
              >
                <Input {...register('password')} type="password" aria-invalid={!!errors.password} />
              </FormField>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toggleTarget}
        title={t('employees.confirmDeactivate')}
        confirmLabel={t('common.confirm')}
        onConfirm={confirmToggle}
        onCancel={() => setToggleTarget(null)}
        loading={updateMutation.isPending}
      />
    </div>
  )
}
