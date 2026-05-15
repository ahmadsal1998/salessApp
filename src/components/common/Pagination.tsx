import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize: number
  total: number
}

export default function Pagination({ page, totalPages, onPageChange, pageSize, total }: Props) {
  const { t } = useTranslation()
  const start = Math.min((page - 1) * pageSize + 1, total)
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
        <span className="hidden sm:inline">{start}–{end} {t('common.of')} </span>
        {total} {t('common.rows')}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            page <= 1
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Numbered buttons — desktop only */}
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p = i + 1
            if (totalPages > 5 && page > 3) p = page - 2 + i
            if (p > totalPages) return null
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  'min-w-8 h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Mobile page indicator */}
        <span className="sm:hidden text-xs text-gray-600 dark:text-gray-400 px-2 tabular-nums">
          {page} / {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            page >= totalPages
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
