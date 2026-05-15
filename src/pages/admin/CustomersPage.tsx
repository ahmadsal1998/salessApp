import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Plus, Search, Edit2, Trash2, Eye, MapPin, User, Phone, UserCheck, SlidersHorizontal, X } from 'lucide-react'
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers'
import { useEmployees } from '@/hooks/useEmployees'
import { CustomerStatusBadge } from '@/components/common/StatusBadge'
import CustomerFormDialog from '@/components/customers/CustomerFormDialog'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Pagination from '@/components/common/Pagination'
import EmptyState from '@/components/common/EmptyState'
import { formatDate } from '@/utils/format'
import type { CustomerWithEmployee, CustomerStatus } from '@/types/app.types'
import { Users } from 'lucide-react'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 15

export default function CustomersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CustomerStatus | 'all'>('all')
  const [assignedTo, setAssignedTo] = useState<string | 'all'>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<CustomerWithEmployee | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filtersVisible, setFiltersVisible] = useState(false)

  const { data, isLoading } = useCustomers({ search, status, assignedTo, page, pageSize: PAGE_SIZE })
  const { data: employees } = useEmployees()
  const deleteMutation = useDeleteCustomer()

  const customers = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = search !== '' || status !== 'all' || assignedTo !== 'all'

  const STATUSES: (CustomerStatus | 'all')[] = ['all', 'new', 'visited', 'interested', 'approved', 'rejected', 'follow_up']

  function handleEdit(c: CustomerWithEmployee) {
    setEditCustomer(c)
    setFormOpen(true)
  }

  function handleAdd() {
    setEditCustomer(null)
    setFormOpen(true)
  }

  function clearFilters() {
    setSearch('')
    setStatus('all')
    setAssignedTo('all')
    setPage(1)
    setFiltersVisible(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    } catch {
      // error handled by mutation's onError toast
    }
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('customers.title')}</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('customers.addCustomer')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Mobile: search + filter toggle */}
        <div className="flex items-center gap-2 p-3 sm:hidden">
          <div className="relative flex-1">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full ps-9 pe-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setFiltersVisible(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors shrink-0',
              filtersVisible || (status !== 'all' || assignedTo !== 'all')
                ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {(status !== 'all' || assignedTo !== 'all') && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Desktop: always visible / Mobile: collapsible */}
        <div className={cn('flex flex-wrap gap-3 p-3', filtersVisible ? 'flex' : 'hidden sm:flex')}>
          {/* Search (desktop only — mobile has it above) */}
          <div className="relative flex-1 min-w-48 hidden sm:block">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full ps-9 pe-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as CustomerStatus | 'all'); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s === 'all' ? t('common.all') : t(`customers.statuses.${s}`)}
              </option>
            ))}
          </select>
          <select
            value={assignedTo}
            onChange={(e) => { setAssignedTo(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{t('common.all')} {t('employees.title')}</option>
            {employees?.map(e => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
              {t('common.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!isLoading && customers.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
          {t('common.total')}: {total}
        </p>
      )}

      {/* Card grid */}
      {isLoading ? (
        <CardSkeleton />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t(hasActiveFilters ? 'common.noFilterResults' : 'common.noData')}
          action={!hasActiveFilters ? (
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm">
              <Plus className="w-4 h-4" />{t('customers.addCustomer')}
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {customers.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
              onView={(id) => navigate(`/customers/${id}`)}
              t={t}
            />
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={PAGE_SIZE} total={total} />
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditCustomer(null) }}
        customer={editCustomer}
      />

      <ConfirmDialog
        open={!!deleteId}
        title={t('customers.confirmDelete')}
        description={t('customers.deleteWarning')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function CustomerCard({
  customer: c,
  onEdit,
  onDelete,
  onView,
  t,
}: {
  customer: CustomerWithEmployee
  onEdit: (c: CustomerWithEmployee) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
  t: TFunction
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Header: business name + status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{c.business_name}</h3>
          {(c.city || c.area) && (
            <p className="text-xs text-gray-400 mt-0.5 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {[c.city, c.area].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <CustomerStatusBadge status={c.status} />
      </div>

      {/* Body rows */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{c.owner_name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-mono">{c.phone}</span>
        </div>
      </div>

      {/* Footer: assigned + date + actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
        <div className="min-w-0">
          {(c as CustomerWithEmployee).assigned_employee ? (
            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-gray-400 shrink-0" />
              {(c as CustomerWithEmployee).assigned_employee!.full_name}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">{t('customers.unassigned')}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.created_at)}</p>
        </div>
        <div className="flex items-center gap-0.5 ms-2">
          <ActionBtn icon={Eye} onClick={() => onView(c.id)} title={t('common.view')} color="blue" />
          <ActionBtn icon={Edit2} onClick={() => onEdit(c)} title={t('common.edit')} color="yellow" />
          <ActionBtn icon={Trash2} onClick={() => onDelete(c.id)} title={t('common.delete')} color="red" />
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon: Icon, onClick, title, color }: { icon: typeof Eye; onClick: () => void; title: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20',
    yellow: 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/20',
    red: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20',
  }
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn('p-1.5 rounded-lg transition-colors', colors[color])}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse w-3/4" />
              <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/2" />
            </div>
            <div className="h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse w-16 shrink-0" />
          </div>
          <div className="space-y-2">
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-2/3" />
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/2" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/3" />
            <div className="flex gap-1">
              {[1,2,3].map(j => <div key={j} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700/60 animate-pulse" />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
