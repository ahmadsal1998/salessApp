import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, Navigation, User, Phone } from 'lucide-react'
import { useFollowUpCustomers } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/auth.store'
import { CustomerStatusBadge } from '@/components/common/StatusBadge'
import EmptyState from '@/components/common/EmptyState'
import { formatDate } from '@/utils/format'
import { isBefore, startOfDay } from 'date-fns'
import { cn } from '@/utils/cn'

type Customer = NonNullable<ReturnType<typeof useFollowUpCustomers>['data']>[number]

function getPriorityInfo(c: Customer, today: Date, t: ReturnType<typeof useTranslation>['t']) {
  const d = new Date(c.updated_at)
  if (isBefore(d, today)) return {
    badge: <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t('followUps.overdue')}</span>,
    borderColor: 'border-red-200 dark:border-red-900/40',
  }
  if (formatDate(d) === formatDate(today)) return {
    badge: <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{t('followUps.today')}</span>,
    borderColor: 'border-yellow-200 dark:border-yellow-900/40',
  }
  return {
    badge: <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t('followUps.upcoming')}</span>,
    borderColor: 'border-gray-200 dark:border-gray-700',
  }
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
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('followUps.title')}</h1>

      {!isLoading && customers && customers.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
          {t('common.total')}: {customers.length}
        </p>
      )}

      {isLoading ? (
        <FollowUpSkeleton />
      ) : !customers?.length ? (
        <EmptyState icon={Clock} title={t('followUps.noFollowUps')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {customers.map(c => {
            const { badge, borderColor } = getPriorityInfo(c, today, t)
            return (
              <div
                key={c.id}
                onClick={() => navigate(`${detailPath}/${c.id}`)}
                className={cn(
                  'bg-white dark:bg-gray-800 rounded-xl border-2 p-4 hover:shadow-sm transition-all cursor-pointer',
                  borderColor
                )}
              >
                {/* Header: badges */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {badge}
                  <CustomerStatusBadge status={c.status} />
                </div>

                {/* Business name */}
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate mb-2">{c.business_name}</h3>

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
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDate(c.updated_at)}</span>
                  </div>
                </div>

                {/* Navigation */}
                {c.latitude && c.longitude && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <button
                      onClick={(e) => openNav(e, c.latitude!, c.longitude!)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-blue-700 font-medium transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {t('customers.navigateToLocation')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FollowUpSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse w-16" />
            <div className="h-5 rounded-full bg-gray-100 dark:bg-gray-700/60 animate-pulse w-14" />
          </div>
          <div className="h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse w-3/4" />
          <div className="space-y-2">
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-2/3" />
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/2" />
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
