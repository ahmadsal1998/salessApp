import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Clock, Navigation, User, Phone } from 'lucide-react'
import { useFollowUpCustomers } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/auth.store'
import { CustomerStatusBadge } from '@/components/common/StatusBadge'
import EmptyState from '@/components/common/EmptyState'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/utils/format'
import { isBefore, startOfDay } from 'date-fns'
import { cn } from '@/utils/cn'
import type { CustomerWithEmployee } from '@/types/app.types'

type Priority = 'overdue' | 'today' | 'upcoming'

const PRIORITY_BADGE_VARIANT = {
  overdue: 'destructive',
  today: 'warning',
  upcoming: 'info',
} as const

const PRIORITY_BORDER: Record<Priority, string> = {
  overdue: 'border-destructive/30',
  today: 'border-amber-300/60 dark:border-amber-500/30',
  upcoming: 'border-border',
}

function getPriority(c: CustomerWithEmployee, today: Date): Priority {
  const d = new Date(c.updated_at)
  if (isBefore(d, today)) return 'overdue'
  if (formatDate(d) === formatDate(today)) return 'today'
  return 'upcoming'
}

export default function FollowUpsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { data: customers, isLoading } = useFollowUpCustomers(
    profile?.role === 'sales' ? profile.id : undefined
  )

  const today = startOfDay(new Date())
  const detailPath = profile?.role === 'admin' ? '/customers' : '/my-customers'

  function openNav(e: React.MouseEvent, lat: number, lng: number) {
    e.stopPropagation()
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">{t('followUps.title')}</h1>

      {!isLoading && customers && customers.length > 0 && (
        <p className="text-xs text-muted-foreground px-1">
          {t('common.total')}: {customers.length}
        </p>
      )}

      {isLoading ? (
        <FollowUpSkeleton />
      ) : !customers?.length ? (
        <EmptyState icon={Clock} title={t('followUps.noFollowUps')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {customers.map(c => (
            <FollowUpCard
              key={c.id}
              customer={c}
              priority={getPriority(c, today)}
              onView={() => navigate(`${detailPath}/${c.id}`)}
              onNavigate={(e) => c.latitude && c.longitude ? openNav(e, c.latitude, c.longitude) : undefined}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FollowUpCard({
  customer: c,
  priority,
  onView,
  onNavigate,
  t,
}: {
  customer: CustomerWithEmployee
  priority: Priority
  onView: () => void
  onNavigate: (e: React.MouseEvent) => void
  t: TFunction
}) {
  return (
    <Card
      onClick={onView}
      className={cn(
        'p-4 border-2 cursor-pointer hover:shadow-(--shadow-popover) transition-shadow',
        PRIORITY_BORDER[priority]
      )}
    >
      {/* Header: badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Badge variant={PRIORITY_BADGE_VARIANT[priority]}>{t(`followUps.${priority}`)}</Badge>
        <CustomerStatusBadge status={c.status} />
      </div>

      {/* Business name */}
      <h3 className="font-semibold text-foreground text-sm truncate mb-2">{c.business_name}</h3>

      {/* Body */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{c.owner_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-mono">{c.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Clock className="size-3.5 shrink-0" />
          <span>{formatDate(c.updated_at)}</span>
        </div>
      </div>

      {/* Navigation */}
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

function FollowUpSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3 border-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </Card>
      ))}
    </div>
  )
}
