import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import type { CustomerStatus } from '@/types/app.types'

interface Props {
  value: CustomerStatus | 'all'
  onChange: (status: CustomerStatus | 'all') => void
  statuses: (CustomerStatus | 'all')[]
  className?: string
}

export default function StatusFilterChips({ value, onChange, statuses, className }: Props) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-none -mx-0.5 px-0.5', className)}>
      {statuses.map((s) => {
        const active = value === s
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {s === 'all' ? t('common.all') : t(`customers.statuses.${s}`)}
          </button>
        )
      })}
    </div>
  )
}
