import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

const RANK_STYLES = [
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-secondary text-secondary-foreground',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
]
const DEFAULT_RANK_STYLE = 'bg-secondary text-muted-foreground'

interface RankedListItemProps {
  rank: number
  name: string
  /** 0-100, drives the progress bar fill */
  rate: number
  /** Text shown at the end of the progress bar (e.g. "3/5" or "60%") */
  rateLabel: ReactNode
  /** Optional trailing stat block — used by ReportsPage for visits/approved counts */
  right?: ReactNode
  compact?: boolean
}

export function RankedListItem({ rank, name, rate, rateLabel, right, compact = false }: RankedListItemProps) {
  const rankStyle = RANK_STYLES[rank - 1] ?? DEFAULT_RANK_STYLE
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        !compact && 'rounded-xl border border-border p-3 transition-colors hover:bg-secondary/50'
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full font-bold',
          compact ? 'size-7 text-xs' : 'size-8 text-sm',
          rankStyle
        )}
      >
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all duration-500', compact ? 'bg-emerald-500' : 'bg-primary')}
              style={{ width: `${rate}%` }}
            />
          </div>
          <span
            className={cn(
              'shrink-0 text-xs tabular-nums',
              compact ? 'text-muted-foreground' : 'font-medium text-primary'
            )}
          >
            {rateLabel}
          </span>
        </div>
      </div>
      {right && <div className="flex shrink-0 items-center gap-4 text-center text-xs">{right}</div>}
    </div>
  )
}
