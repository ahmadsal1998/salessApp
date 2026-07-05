import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  size?: 'default' | 'compact'
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action, size = 'default' }: Props) {
  const compact = size === 'compact'
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 text-center', compact ? 'py-8' : 'py-16')}>
      <div className={cn(
        'mb-4 flex items-center justify-center rounded-2xl bg-muted ring-1 ring-border',
        compact ? 'size-11' : 'size-16'
      )}>
        <Icon className={cn('text-muted-foreground', compact ? 'size-5' : 'size-8')} />
      </div>
      <h3 className={cn('mb-1 font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
