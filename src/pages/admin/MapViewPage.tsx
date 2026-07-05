import { useTranslation } from 'react-i18next'
import { useCustomersForMap } from '@/hooks/useCustomers'
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

export default function MapViewPage() {
  const { t } = useTranslation()
  const { data: customers, isLoading } = useCustomersForMap()

  return (
    <div className="space-y-4 h-full flex flex-col">
      <Card className="p-4 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h1 className="text-xl font-bold text-foreground">{t('nav.mapView')}</h1>
          <span className="text-sm text-muted-foreground">
            {customers?.filter(c => c.latitude && c.longitude).length ?? 0} {t('customers.title').toLowerCase()} {t('map.allCustomers').toLowerCase()}
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {LEGEND.map(({ status, labelKey }) => (
            <div
              key={status}
              className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm shrink-0"
                style={{ background: statusMapColors[status] }}
              />
              <span className="text-xs font-medium text-muted-foreground">{t(labelKey)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Map */}
      <Card className="flex-1 min-h-96 overflow-hidden p-0">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-none flex items-center justify-center">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </Skeleton>
        ) : (
          <CustomerMap customers={customers ?? []} adminView height="100%" />
        )}
      </Card>
    </div>
  )
}
