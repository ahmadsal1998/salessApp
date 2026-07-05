import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Search, Navigation, User, Phone, MapPin, Users } from 'lucide-react'
import { useAssignedCustomers } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/auth.store'
import { CustomerStatusBadge } from '@/components/common/StatusBadge'
import Pagination from '@/components/common/Pagination'
import EmptyState from '@/components/common/EmptyState'
import StatusFilterChips from '@/components/ui/StatusFilterChips'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import type { CustomerStatus, CustomerWithEmployee } from '@/types/app.types'

const PAGE_SIZE = 15
const STATUSES: (CustomerStatus | 'all')[] = ['all', 'new', 'visited', 'interested', 'approved', 'rejected', 'follow_up']

export default function MyCustomersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CustomerStatus | 'all'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAssignedCustomers(profile?.id, { search, status, page, pageSize: PAGE_SIZE })
  const customers = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = search !== '' || status !== 'all'

  function openNavigation(e: React.MouseEvent, lat: number, lng: number) {
    e.stopPropagation()
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">{t('nav.myCustomers')}</h1>

      {/* Filters */}
      <Card className="p-3 space-y-3">
        <div className="relative">
          <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder={t('customers.searchPlaceholder')}
            className="ps-9 h-12 sm:h-10"
          />
        </div>
        <StatusFilterChips
          value={status}
          onChange={(s) => { setStatus(s); setPage(1) }}
          statuses={STATUSES}
        />
      </Card>

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
        <Card>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={PAGE_SIZE} total={total} />
        </Card>
      )}
    </div>
  )
}

function SalesCustomerCard({
  customer: c,
  onView,
  onNavigate,
  t,
}: {
  customer: CustomerWithEmployee
  onView: () => void
  onNavigate: (e: React.MouseEvent) => void
  t: TFunction
}) {
  return (
    <Card
      onClick={onView}
      className="p-4 cursor-pointer hover:border-foreground/15 transition-colors"
    >
      {/* Header: business name + status */}
      <div className="mb-3">
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

      {/* Body */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{c.owner_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="size-3.5 text-muted-foreground shrink-0" />
          <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="font-mono hover:text-primary transition-colors">
            {c.phone}
          </a>
        </div>
      </div>

      {/* Navigation button */}
      {c.latitude && c.longitude && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={onNavigate}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <Navigation className="size-3.5" />
            {t('customers.navigateToLocation')}
          </button>
        </div>
      )}
    </Card>
  )
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full shrink-0" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  )
}
