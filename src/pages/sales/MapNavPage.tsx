import { useTranslation } from 'react-i18next'
import { useCustomersForMap } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/auth.store'
import CustomerMap from '@/components/map/CustomerMap'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { statusMapColors } from '@/utils/status'
import type { CustomerStatus } from '@/types/app.types'

const LEGEND: { status: CustomerStatus; labelKey: string }[] = [
  { status: 'new', labelKey: 'customers.statuses.new' },
  { status: 'visited', labelKey: 'customers.statuses.visited' },
  { status: 'interested', labelKey: 'customers.statuses.interested' },
  { status: 'approved', labelKey: 'customers.statuses.approved' },
  { status: 'rejected', labelKey: 'customers.statuses.rejected' },
  { status: 'follow_up', labelKey: 'customers.statuses.follow_up' },
]

export default function MapNavPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const { data: customers, isLoading } = useCustomersForMap(profile?.id)

  const mappedCount = customers?.filter(c => c.latitude && c.longitude).length ?? 0

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-foreground">{t('nav.mapNavigation')}</h1>
        <span className="text-sm text-muted-foreground">
          {mappedCount} {t('customers.title').toLowerCase()}
        </span>
      </div>

      {/* Legend */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGEND.map(({ status, labelKey }) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-full border-2 border-card shadow-sm shrink-0"
                style={{ background: statusMapColors[status] }}
              />
              <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex-1 min-h-96 rounded-xl overflow-hidden border border-border">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : (
          <CustomerMap customers={customers ?? []} adminView={false} height="100%" />
        )}
      </div>
    </div>
  )
}
