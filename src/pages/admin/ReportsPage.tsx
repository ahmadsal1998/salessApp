import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { visitsService } from '@/services/visits.service'
import { useRejectionBreakdown } from '@/hooks/useVisits'
import { useEmployees } from '@/hooks/useEmployees'
import { Download, Users } from 'lucide-react'
import { formatPercent } from '@/utils/format'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import EmptyState from '@/components/common/EmptyState'
import { cn } from '@/utils/cn'

export default function ReportsPage() {
  const { t } = useTranslation()
  const [employeeId, setEmployeeId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: employees } = useEmployees()
  const { data: rejectionData = [] } = useRejectionBreakdown()

  const hasActiveFilters = employeeId !== 'all' || !!dateFrom || !!dateTo

  const { data: reportData = [] } = useQuery({
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

  const sel = 'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t('reports.exportCSV')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3">
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className={sel}>
            <option value="all">{t('common.all')} {t('employees.title')}</option>
            {employees?.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 shrink-0">{t('reports.from')}</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={sel} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 shrink-0">{t('reports.to')}</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={sel} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Employee performance — ranked cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('reports.employeePerformance')}</h3>
          </div>
          {sortedData.length === 0 ? (
            <EmptyState size="compact" icon={Users} title={t(hasActiveFilters ? 'common.noFilterResults' : 'common.noData')} />
          ) : (
            <div className="p-4 space-y-3">
              {sortedData.map((row, i) => {
                const rate = row.total > 0 ? (row.approved / row.total) * 100 : 0
                const rankColor = i === 0
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : i === 1
                    ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    : i === 2
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                      : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                return (
                  <div key={row.employee.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0', rankColor)}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{row.employee.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs text-primary font-medium shrink-0 tabular-nums">{formatPercent(rate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs text-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{row.total}</p>
                        <p className="text-gray-400">{t('reports.visits')}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-green-600 dark:text-green-400 tabular-nums">{row.approved}</p>
                        <p className="text-gray-400">{t('reports.approved')}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Rejection chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('reports.rejectionAnalysis')}</h3>
          {rejectionData.length > 0 ? (
            <div style={{ height: Math.max(180, rejectionData.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rejectionData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="reason" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">{t('common.noData')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
