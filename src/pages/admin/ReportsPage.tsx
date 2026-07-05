import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { visitsService } from '@/services/visits.service'
import { useRejectionBreakdown } from '@/hooks/useVisits'
import { useEmployees } from '@/hooks/useEmployees'
import { Download, Users, X } from 'lucide-react'
import { formatPercent } from '@/utils/format'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import EmptyState from '@/components/common/EmptyState'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { RankedListItem } from '@/components/dashboard/RankedListItem'
import { useChartTheme } from '@/utils/chart-theme'

export default function ReportsPage() {
  const { t } = useTranslation()
  const chartTheme = useChartTheme()
  const [employeeId, setEmployeeId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: employees } = useEmployees()
  const { data: rejectionData = [], isLoading: rejectionLoading } = useRejectionBreakdown()

  const hasActiveFilters = employeeId !== 'all' || !!dateFrom || !!dateTo

  function clearFilters() {
    setEmployeeId('all')
    setDateFrom('')
    setDateTo('')
  }

  const { data: reportData = [], isLoading: reportLoading } = useQuery({
    queryKey: ['report', employeeId, dateFrom, dateTo],
    queryFn: () => visitsService.getReportData(
      employeeId !== 'all' ? employeeId : undefined,
      dateFrom || undefined,
      dateTo || undefined,
    ),
  })

  const sortedData = [...reportData].sort((a, b) => b.approved - a.approved)

  function exportCSV() {
    const header = [t('employees.fullName'), t('reports.visits'), t('reports.approved'), t('reports.rejected'), t('reports.conversionRate')]
    const rows = reportData.map(r => [
      r.employee.full_name,
      r.total,
      r.approved,
      r.rejected,
      formatPercent(r.total > 0 ? (r.approved / r.total) * 100 : 0),
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const tooltipStyle = {
    background: chartTheme.tooltipBg,
    border: `1px solid ${chartTheme.tooltipBorder}`,
    color: chartTheme.tooltipText,
    borderRadius: 8,
    fontSize: 12,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-foreground">{t('reports.title')}</h1>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4" />
          {t('reports.exportCSV')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-auto min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')} {t('employees.title')}</SelectItem>
              {employees?.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">{t('reports.from')}</span>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">{t('reports.to')}</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto" />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4" />
              {t('common.clear')}
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Employee performance — ranked cards */}
        <Card>
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">{t('reports.employeePerformance')}</h3>
          </div>
          {reportLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                  <div className="flex gap-4 shrink-0">
                    <Skeleton className="h-8 w-10" />
                    <Skeleton className="h-8 w-10" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedData.length === 0 ? (
            <EmptyState size="compact" icon={Users} title={t(hasActiveFilters ? 'common.noFilterResults' : 'common.noData')} />
          ) : (
            <div className="p-4 space-y-3">
              {sortedData.map((row, i) => {
                const rate = row.total > 0 ? (row.approved / row.total) * 100 : 0
                return (
                  <RankedListItem
                    key={row.employee.id}
                    rank={i + 1}
                    name={row.employee.full_name}
                    rate={rate}
                    rateLabel={formatPercent(rate)}
                    right={
                      <>
                        <div>
                          <p className="font-semibold text-foreground tabular-nums">{row.total}</p>
                          <p className="text-muted-foreground">{t('reports.visits')}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{row.approved}</p>
                          <p className="text-muted-foreground">{t('reports.approved')}</p>
                        </div>
                      </>
                    }
                  />
                )
              })}
            </div>
          )}
        </Card>

        {/* Rejection chart */}
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4">{t('reports.rejectionAnalysis')}</h3>
          {rejectionLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : rejectionData.length > 0 ? (
            <div style={{ height: Math.max(180, rejectionData.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rejectionData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: chartTheme.axis }} allowDecimals={false} />
                  <YAxis type="category" dataKey="reason" tick={{ fontSize: 10, fill: chartTheme.axis }} width={110} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill={chartTheme.colors[4 % chartTheme.colors.length]} radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
          )}
        </Card>
      </div>
    </div>
  )
}
