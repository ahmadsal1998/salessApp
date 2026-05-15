import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Navigation, SlidersHorizontal, X, User, Phone, MapPin } from 'lucide-react'
import { useAssignedCustomers } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/auth.store'
import { CustomerStatusBadge } from '@/components/common/StatusBadge'
import Pagination from '@/components/common/Pagination'
import EmptyState from '@/components/common/EmptyState'
import { Users } from 'lucide-react'
import type { CustomerStatus } from '@/types/app.types'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 15

export default function MyCustomersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CustomerStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [filtersVisible, setFiltersVisible] = useState(false)

  const { data, isLoading } = useAssignedCustomers(profile?.id, { search, status, page, pageSize: PAGE_SIZE })
  const customers = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = search !== '' || status !== 'all'

  const STATUSES: (CustomerStatus | 'all')[] = ['all', 'new', 'visited', 'interested', 'approved', 'rejected', 'follow_up']

  function openNavigation(e: React.MouseEvent, lat: number, lng: number) {
    e.stopPropagation()
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  function clearFilters() {
    setSearch('')
    setStatus('all')
    setPage(1)
    setFiltersVisible(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('nav.myCustomers')}</h1>

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
              filtersVisible || status !== 'all'
                ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {status !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
        </div>

        {/* Desktop: always visible / Mobile: collapsible */}
        <div className={cn('flex flex-wrap gap-3 p-3', filtersVisible ? 'flex' : 'hidden sm:flex')}>
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
              <option key={s} value={s}>{s === 'all' ? t('common.all') : t(`customers.statuses.${s}`)}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />{t('common.clear')}
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
        <EmptyState icon={Users} title={t(hasActiveFilters ? 'common.noFilterResults' : 'common.noData')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {customers.map(c => (
            <SalesCustomerCard
              key={c.id}
              customer={c}
              onView={() => navigate(`/my-customers/${c.id}`)}
              onNavigate={(e) => c.latitude && c.longitude ? openNavigation(e, c.latitude, c.longitude) : undefined}
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
    </div>
  )
}

type Customer = NonNullable<ReturnType<typeof useAssignedCustomers>['data']>['data'][number]

function SalesCustomerCard({
  customer: c,
  onView,
  onNavigate,
  t,
}: {
  customer: Customer
  onView: () => void
  onNavigate: (e: React.MouseEvent) => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <div
      onClick={onView}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
    >
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

      {/* Body */}
      <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{c.owner_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-mono">{c.phone}</span>
        </div>
      </div>

      {/* Navigation button */}
      {c.latitude && c.longitude && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
          <button
            onClick={onNavigate}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-blue-700 font-medium transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            {t('customers.navigateToLocation')}
          </button>
        </div>
      )}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse w-3/4" />
              <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/3" />
            </div>
            <div className="h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse w-16 shrink-0" />
          </div>
          <div className="space-y-2">
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-2/3" />
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
