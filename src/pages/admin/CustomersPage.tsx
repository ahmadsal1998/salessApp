import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Plus, Search, Edit2, Trash2, Eye, MapPin, User, Phone, UserCheck, SlidersHorizontal, X, MoreVertical, Tag } from 'lucide-react'
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers'
import { useEmployees } from '@/hooks/useEmployees'
import { useBusinessActivities } from '@/hooks/useBusinessActivities'
import { CustomerStatusBadge } from '@/components/common/StatusBadge'
import CustomerFormDialog from '@/components/customers/CustomerFormDialog'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Pagination from '@/components/common/Pagination'
import EmptyState from '@/components/common/EmptyState'
import BottomSheet from '@/components/ui/BottomSheet'
import StatusFilterChips from '@/components/ui/StatusFilterChips'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Skeleton } from '@/components/ui/Skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { formatDate } from '@/utils/format'
import { STATIC_CATEGORIES, getCategoryLabel } from '@/utils/category'
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
  const [category, setCategory] = useState<string | 'all'>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<CustomerWithEmployee | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filtersVisible, setFiltersVisible] = useState(false)

  const { data, isLoading } = useCustomers({ search, status, assignedTo, category, page, pageSize: PAGE_SIZE })
  const { data: employees } = useEmployees()
  const { data: businessActivities } = useBusinessActivities()
  const deleteMutation = useDeleteCustomer()

  const customers = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = search !== '' || status !== 'all' || assignedTo !== 'all' || category !== 'all'

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
    setCategory('all')
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
    <div className="space-y-4 pb-20 sm:pb-0">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-foreground">{t('customers.title')}</h1>
        <Button onClick={handleAdd} className="hidden sm:flex">
          <Plus className="size-4" />
          {t('customers.addCustomer')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-3 space-y-3">
        {/* Mobile: search + filter toggle */}
        <div className="flex items-center gap-2 sm:hidden">
          <div className="relative flex-1">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={t('customers.searchPlaceholder')}
              className="ps-9 h-12"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFiltersVisible(true)}
            className={cn(
              'relative h-12 w-12 shrink-0',
              (assignedTo !== 'all' || category !== 'all') && 'border-primary text-primary bg-primary/5'
            )}
          >
            <SlidersHorizontal className="size-4" />
            {(assignedTo !== 'all' || category !== 'all') && (
              <span className="absolute top-1.5 inset-e-1.5 size-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {/* Status chips — all viewports */}
        <StatusFilterChips
          value={status}
          onChange={(s) => { setStatus(s); setPage(1) }}
          statuses={STATUSES}
        />

        {/* Desktop: search + employee + category filter */}
        <div className="hidden sm:flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={t('customers.searchPlaceholder')}
              className="ps-9"
            />
          </div>
          <Select value={assignedTo} onValueChange={(v) => { setAssignedTo(v); setPage(1) }}>
            <SelectTrigger className="w-auto min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')} {t('employees.title')}</SelectItem>
              {employees?.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
            <SelectTrigger className="w-auto min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')} {t('customers.category')}</SelectItem>
              {STATIC_CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{t(`customers.categories.${c}`)}</SelectItem>
              ))}
              {businessActivities?.map(a => (
                <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="size-4" />
              {t('common.clear')}
            </Button>
          )}
        </div>
      </Card>

      {/* Mobile filter sheet — employee filter */}
      <BottomSheet open={filtersVisible} onClose={() => setFiltersVisible(false)} title={t('common.filter')}>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>{t('customers.filterByEmployee')}</Label>
            <Select value={assignedTo} onValueChange={(v) => { setAssignedTo(v); setPage(1) }}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')} {t('employees.title')}</SelectItem>
                {employees?.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('customers.filterByCategory')}</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')} {t('customers.category')}</SelectItem>
                {STATIC_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{t(`customers.categories.${c}`)}</SelectItem>
                ))}
                {businessActivities?.map(a => (
                  <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="flex-1 h-12">
                <X className="size-4" />
                {t('common.clear')}
              </Button>
            )}
            <Button onClick={() => setFiltersVisible(false)} className="flex-1 h-12">
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Results count */}
      {!isLoading && customers.length > 0 && (
        <p className="text-xs text-muted-foreground px-1">
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
            <Button onClick={handleAdd}>
              <Plus className="size-4" />{t('customers.addCustomer')}
            </Button>
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
        <Card>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={PAGE_SIZE} total={total} />
        </Card>
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

      {/* Mobile FAB */}
      <Button
        onClick={handleAdd}
        aria-label={t('customers.addCustomer')}
        size="icon"
        className="sm:hidden fixed bottom-6 inset-e-5 z-40 h-14 w-14 rounded-full shadow-lg shadow-primary/30 active:scale-95"
      >
        <Plus className="size-6" />
      </Button>
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
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Card className="p-4 hover:border-border/70 transition-colors">
      {/* Header: business name + status + mobile menu trigger */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm truncate">{c.business_name}</h3>
            <CustomerStatusBadge status={c.status} className="shrink-0" />
          </div>
          {(c.city || c.area) && (
            <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              {[c.city, c.area].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMenuOpen(true)}
          aria-label={t('common.actions')}
          className="sm:hidden shrink-0 -me-1.5 -mt-1 text-muted-foreground"
        >
          <MoreVertical className="size-4" />
        </Button>
      </div>

      {/* Body rows */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="size-3.5 shrink-0" />
          <span className="truncate">{c.owner_name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="size-3.5 shrink-0" />
          <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="font-mono hover:text-primary transition-colors">
            {c.phone}
          </a>
        </div>
        {c.category && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tag className="size-3.5 shrink-0" />
            <span className="truncate">{getCategoryLabel(c.category, t)}</span>
          </div>
        )}
      </div>

      {/* Footer: assigned + date + desktop actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="min-w-0">
          {(c as CustomerWithEmployee).assigned_employee ? (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <UserCheck className="size-3 shrink-0" />
              {(c as CustomerWithEmployee).assigned_employee!.full_name}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">{t('customers.unassigned')}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(c.created_at)}</p>
        </div>
        <div className="hidden sm:flex items-center ms-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('common.actions')}>
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(c.id)}>
                <Eye className="size-4" />
                {t('common.view')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(c)}>
                <Edit2 className="size-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem destructive onClick={() => onDelete(c.id)}>
                <Trash2 className="size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile action sheet */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={c.business_name}>
        <div className="p-2">
          <SheetAction icon={Eye} label={t('common.view')} onClick={() => { setMenuOpen(false); onView(c.id) }} />
          <SheetAction icon={Edit2} label={t('common.edit')} onClick={() => { setMenuOpen(false); onEdit(c) }} />
          <SheetAction icon={Trash2} label={t('common.delete')} onClick={() => { setMenuOpen(false); onDelete(c.id) }} danger />
        </div>
      </BottomSheet>
    </Card>
  )
}

function SheetAction({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Eye
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 min-h-12 rounded-lg text-sm font-medium transition-colors',
        danger
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-secondary'
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  )
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full shrink-0" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  )
}
