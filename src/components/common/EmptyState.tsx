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
        'rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 ring-1 ring-gray-200 dark:ring-gray-700',
        compact ? 'w-11 h-11' : 'w-16 h-16'
      )}>
        <Icon className={cn('text-gray-400', compact ? 'w-5 h-5' : 'w-8 h-8')} />
      </div>
      <h3 className={cn('font-semibold text-gray-900 dark:text-white mb-1', compact ? 'text-sm' : 'text-base')}>{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-1 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
