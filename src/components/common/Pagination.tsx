import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'

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
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs tabular-nums text-muted-foreground">
        <span className="hidden sm:inline">{start}–{end} {t('common.of')} </span>
        {total} {t('common.rows')}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Button>

        {/* Numbered buttons — desktop only */}
        <div className="hidden items-center gap-1 sm:flex">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p = i + 1
            if (totalPages > 5 && page > 3) p = page - 2 + i
            if (p > totalPages) return null
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  'h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Mobile page indicator */}
        <span className="px-2 text-xs tabular-nums text-muted-foreground sm:hidden">
          {page} / {totalPages}
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  )
}
