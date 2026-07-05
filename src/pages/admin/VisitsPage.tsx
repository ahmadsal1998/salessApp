import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, SlidersHorizontal, X, UserCheck, Calendar, AlertCircle, Clock, CalendarX } from 'lucide-react'
import { useVisits } from '@/hooks/useVisits'
import { useEmployees } from '@/hooks/useEmployees'
import { VisitResultBadge } from '@/components/common/StatusBadge'
import VisitFormDialog from '@/components/visits/VisitFormDialog'
import Pagination from '@/components/common/Pagination'
import EmptyState from '@/components/common/EmptyState'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { FormField } from '@/components/ui/FormField'
import BottomSheet from '@/components/ui/BottomSheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { formatDateTime } from '@/utils/format'
import type { VisitResult, VisitWithRelations } from '@/types/app.types'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 15
const RESULTS: (VisitResult | 'all')[] = ['all', 'approved', 'interested', 'follow_up', 'rejected']

export default function VisitsPage() {
  const { t } = useTranslation()
  const [employeeId, setEmployeeId] = useState<string>('all')
  const [result, setResult] = useState<VisitResult | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data, isLoading } = useVisits({ employeeId, result, dateFrom, dateTo, page, pageSize: PAGE_SIZE })
  const { data: employees } = useEmployees()

  const visits = data?.data ?? []
  const total = data?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = employeeId !== 'all' || result !== 'all' || !!dateFrom || !!dateTo

  function clearFilters() {
    setEmployeeId('all')
    setResult('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    setFiltersOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-foreground">{t('visits.title')}</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          {t('visits.addVisit')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-3 space-y-3">
        {/* Mobile: filter trigger */}
        <div className="flex items-center justify-between sm:hidden">
          <span className="text-sm font-medium text-foreground">{t('common.filter')}</span>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />{t('common.clear')}
              </button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFiltersOpen(true)}
              className={cn(
                'relative',
                hasActiveFilters && 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
              )}
            >
              <SlidersHorizontal className="size-4" />
              {hasActiveFilters && <span className="absolute top-1.5 inset-e-1.5 size-1.5 rounded-full bg-primary" />}
            </Button>
          </div>
        </div>

        {/* Desktop filter row */}
        <div className="hidden sm:flex flex-wrap items-center gap-3">
          <Select value={employeeId} onValueChange={(v) => { setEmployeeId(v); setPage(1) }}>
            <SelectTrigger className="w-auto min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')} {t('employees.title')}</SelectItem>
              {employees?.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={result} onValueChange={(v) => { setResult(v as VisitResult | 'all'); setPage(1) }}>
            <SelectTrigger className="w-auto min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESULTS.map(r => (
                <SelectItem key={r} value={r}>{r === 'all' ? t('common.all') : t(`visits.results.${r}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground shrink-0">{t('reports.from')}</span>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="w-auto" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground shrink-0">{t('reports.to')}</span>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="w-auto" />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />{t('common.clear')}
            </button>
          )}
        </div>
      </Card>

      {/* Mobile filter sheet */}
      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title={t('common.filter')}>
        <div className="p-5 space-y-4">
          <FormField label={t('visits.filterByEmployee')}>
            <Select value={employeeId} onValueChange={(v) => { setEmployeeId(v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')} {t('employees.title')}</SelectItem>
                {employees?.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label={t('visits.filterByResult')}>
            <Select value={result} onValueChange={(v) => { setResult(v as VisitResult | 'all'); setPage(1) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESULTS.map(r => (
                  <SelectItem key={r} value={r}>{r === 'all' ? t('common.all') : t(`visits.results.${r}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('reports.from')}>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
            </FormField>
            <FormField label={t('reports.to')}>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
            </FormField>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {hasActiveFilters && (
              <Button variant="outline" className="flex-1" onClick={clearFilters}>
                <X className="size-4" />{t('common.clear')}
              </Button>
            )}
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Results count */}
      {!isLoading && visits.length > 0 && (
        <p className="text-xs text-muted-foreground px-1">
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
        <Card>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} pageSize={PAGE_SIZE} total={total} />
        </Card>
      )}

      <VisitFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}

function VisitCard({ visit: v }: { visit: VisitWithRelations }) {
  const customer = v.customer
  const employee = v.employee
  const rejection = v.rejection_reason
  const isRejected = v.result === 'rejected'
  const hasFollowUp = !!v.next_follow_up

  return (
    <Card className="p-4 hover:border-foreground/15 transition-colors">
      {/* Header: customer + result badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{customer?.business_name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{customer?.owner_name}</p>
        </div>
        <VisitResultBadge result={v.result} />
      </div>

      {/* Body */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <UserCheck className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{employee?.full_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 text-muted-foreground shrink-0" />
          <span>{formatDateTime(v.visit_date)}</span>
        </div>
        {isRejected && rejection && (
          <div className="flex items-start gap-1.5 mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
            <span className="text-destructive leading-snug">{rejection.reason_en}</span>
          </div>
        )}
        {hasFollowUp && (
          <div className="flex items-center gap-1.5 mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">
            <Clock className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-amber-700 dark:text-amber-400">{formatDateTime(v.next_follow_up)}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function VisitCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  )
}
