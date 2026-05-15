import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, ToggleLeft, ToggleRight, X, Users } from 'lucide-react'
import { useEmployees, useCreateEmployee, useUpdateEmployee } from '@/hooks/useEmployees'
import EmptyState from '@/components/common/EmptyState'
import { cn } from '@/utils/cn'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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

  async function toggleActive(id: string, current: boolean) {
    await updateMutation.mutateAsync({ id, data: { is_active: !current } })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('employees.title')}</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('employees.addEmployee')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('employees.searchPlaceholder')}
          className="w-full ps-9 pe-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length: 6}).map((_,i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse w-24" />
                    <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-32" />
                  </div>
                </div>
                <div className="h-7 w-7 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-20" />
                <div className="h-5 rounded-full bg-gray-100 dark:bg-gray-700/60 animate-pulse w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={t(hasActiveFilters ? 'common.noFilterResults' : 'common.noData')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <div key={emp.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {emp.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{emp.full_name}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(emp.id, emp.is_active)}
                  className={cn('transition-colors', emp.is_active ? 'text-green-500' : 'text-gray-400')}
                >
                  {emp.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                {emp.phone && <span>{emp.phone}</span>}
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  emp.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {emp.is_active ? t('common.active') : t('common.inactive')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('employees.addEmployee')}</h2>
              <button onClick={() => setAddOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
              <Field label={t('employees.fullName')} error={errors.full_name?.message} required>
                <input {...register('full_name')} className={inp} />
              </Field>
              <Field label={t('employees.email')} error={errors.email?.message} required>
                <input {...register('email')} type="email" className={inp} />
              </Field>
              <Field label={t('employees.phone')} error={errors.phone?.message}>
                <input {...register('phone')} type="tel" className={inp} />
              </Field>
              <Field label={t('employees.setPassword')} error={errors.password?.message} required>
                <input {...register('password')} type="password" className={inp} />
              </Field>
              <p className="text-xs text-gray-400">{t('employees.passwordInfo')}</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">{t('common.cancel')}</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2 transition-colors">
                  {createMutation.isPending && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
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
