import { useTranslation } from 'react-i18next'
import { useCustomersForMap } from '@/hooks/useCustomers'
import CustomerMap from '@/components/map/CustomerMap'
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('nav.mapView')}</h1>
        <span className="text-sm text-gray-500">
          {customers?.filter(c => c.latitude && c.longitude).length ?? 0} {t('customers.title').toLowerCase()} {t('map.allCustomers').toLowerCase()}
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {LEGEND.map(({ status, labelKey }) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ background: statusMapColors[status] }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">{t(labelKey)}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 min-h-96 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="h-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
            <p className="text-gray-400">{t('common.loading')}</p>
          </div>
        ) : (
          <CustomerMap customers={customers ?? []} adminView height="100%" />
        )}
      </div>
    </div>
  )
}
