import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { statusColors, visitResultColors } from '@/utils/status'
import type { CustomerStatus, VisitResult } from '@/types/app.types'

interface CustomerStatusBadgeProps {
  status: CustomerStatus
  className?: string
}

export function CustomerStatusBadge({ status, className }: CustomerStatusBadgeProps) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusColors[status],
        className
      )}
    >
      {t(`customers.statuses.${status}`)}
    </span>
  )
}

interface VisitResultBadgeProps {
  result: VisitResult
  className?: string
}

export function VisitResultBadge({ result, className }: VisitResultBadgeProps) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        visitResultColors[result],
        className
      )}
    >
      {t(`visits.results.${result}`)}
    </span>
  )
}
