import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, SlidersHorizontal, X, UserCheck, Calendar, AlertCircle, Clock } from 'lucide-react'
import { useVisits } from '@/hooks/useVisits'
import { useEmployees } from '@/hooks/useEmployees'
import { VisitResultBadge } from '@/components/common/StatusBadge'
import VisitFormDialog from '@/components/visits/VisitFormDialog'
import Pagination from '@/components/common/Pagination'
import EmptyState from '@/components/common/EmptyState'
import { formatDateTime } from '@/utils/format'
import type { VisitResult } from '@/types/app.types'
import { CalendarX } from 'lucide-react'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 15

export default function VisitsPage() {
  const { t } = useTranslation()
  const [employeeId, setEmployeeId] = useState<string>('all')
  const [result, setResult] = useState<VisitResult | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [filtersVisible, setFiltersVisible] = useState(false)

  const { data, isLoading } = useVisits({ employeeId, result, dateFrom, dateTo, page, pageSize: PAGE_SIZE })
  const { data: employees } = useEmployees()

  const visits = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = employeeId !== 'all' || result !== 'all' || !!dateFrom || !!dateTo

  const RESULTS: (VisitResult | 'all')[] = ['all', 'approved', 'interested', 'follow_up', 'rejected']

  function clearFilters() {
    setEmployeeId('all')
    setResult('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    setFiltersVisible(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('visits.title')}</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('visits.addVisit')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Mobile toggle */}
        <div className="flex items-center justify-between p-3 sm:hidden">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.filter')}</span>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                <X className="w-3.5 h-3.5" />{t('common.clear')}
              </button>
            )}
            <button
              onClick={() => setFiltersVisible(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                filtersVisible || hasActiveFilters
                  ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className={cn('flex flex-wrap gap-3 p-3', filtersVisible ? 'flex' : 'hidden sm:flex')}>
          <select value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setPage(1) }} className={selectCls}>
            <option value="all">{t('common.all')} {t('employees.title')}</option>
            {employees?.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <select value={result} onChange={(e) => { setResult(e.target.value as VisitResult | 'all'); setPage(1) }} className={selectCls}>
            {RESULTS.map(r => (
              <option key={r} value={r}>{r === 'all' ? t('common.all') : t(`visits.results.${r}`)}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 shrink-0">{t('reports.from')}</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className={selectCls} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 shrink-0">{t('reports.to')}</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className={selectCls} />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" />{t('common.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!isLoading && visits.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
          {t('common.total')}: {total}
        </p>
      )}

      {/* Card grid */}
      {isLoading ? (
        <VisitCardSkeleton />
      ) : visits.length === 0 ? (
        <EmptyState icon={CalendarX} title={t(hasActiveFilters ? 'common.noFilterResults' : 'common.noData')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {visits.map(v => <VisitCard key={v.id} visit={v} />)}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={PAGE_SIZE} total={total} />
        </div>
      )}

      <VisitFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}

function VisitCard({ visit: v }: { visit: ReturnType<typeof useVisits>['data'] extends { data: (infer T)[] } | undefined ? T : never }) {
  const customer = v.customer as { business_name: string; owner_name: string } | undefined
  const employee = v.employee as { full_name: string } | undefined
  const rejection = v.rejection_reason as { reason_en: string } | null
  const isRejected = v.result === 'rejected'
  const hasFollowUp = !!v.next_follow_up

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Header: customer + result badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{customer?.business_name}</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{customer?.owner_name}</p>
        </div>
        <VisitResultBadge result={v.result} />
      </div>

      {/* Body */}
      <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{employee?.full_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{formatDateTime(v.visit_date)}</span>
        </div>
        {isRejected && rejection && (
          <div className="flex items-start gap-1.5 mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <span className="text-red-600 dark:text-red-400 leading-snug">{rejection.reason_en}</span>
          </div>
        )}
        {hasFollowUp && (
          <div className="flex items-center gap-1.5 mt-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
            <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="text-orange-600 dark:text-orange-400">{formatDateTime(v.next_follow_up)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function VisitCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse w-3/4" />
              <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/2" />
            </div>
            <div className="h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse w-20 shrink-0" />
          </div>
          <div className="space-y-2">
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-2/3" />
            <div className="h-3 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

const selectCls = 'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary'
