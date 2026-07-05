import { useTranslation } from 'react-i18next'
import {
  Users, CheckCircle, XCircle, Clock, TrendingUp,
  CalendarCheck, Trophy, Building2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { customersService } from '@/services/customers.service'
import { useTodayVisitCount, useVisitsLast30Days, useRejectionBreakdown, useTopEmployees, useVisits } from '@/hooks/useVisits'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { formatDate } from '@/utils/format'
import { VisitResultBadge } from '@/components/common/StatusBadge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { RankedListItem } from '@/components/dashboard/RankedListItem'
import { useChartTheme } from '@/utils/chart-theme'
import { cn } from '@/utils/cn'

const KPI_COLOR_STYLES: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  green: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
  orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
  teal: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const chartTheme = useChartTheme()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => customersService.getDashboardStats(),
  })
  const { data: todayVisits = 0 } = useTodayVisitCount()
  const { data: visitsData = [], isLoading: visitsLoading } = useVisitsLast30Days()
  const { data: rejectionData = [], isLoading: rejectionLoading } = useRejectionBreakdown()
  const { data: topEmployees = [], isLoading: topEmployeesLoading } = useTopEmployees()
  const { data: recentVisitsData, isLoading: recentVisitsLoading } = useVisits({ page: 1, pageSize: 5 })
  const recentVisits = recentVisitsData?.data ?? []

  const total = stats?.total ?? 0
  const approved = stats?.approved ?? 0
  const conversionRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0'

  const pieData = [
    { name: t('customers.statuses.new'), value: stats?.new ?? 0 },
    { name: t('customers.statuses.visited'), value: stats?.visited ?? 0 },
    { name: t('customers.statuses.interested'), value: stats?.interested ?? 0 },
    { name: t('customers.statuses.approved'), value: stats?.approved ?? 0 },
    { name: t('customers.statuses.rejected'), value: stats?.rejected ?? 0 },
    { name: t('customers.statuses.follow_up'), value: stats?.follow_up ?? 0 },
  ].filter(d => d.value > 0)

  const kpis = [
    { label: t('dashboard.totalCustomers'), value: total, icon: Users, color: 'blue' },
    { label: t('dashboard.newCustomers'), value: stats?.new ?? 0, icon: Users, color: 'purple' },
    { label: t('dashboard.approvedCustomers'), value: approved, icon: CheckCircle, color: 'green' },
    { label: t('dashboard.rejectedCustomers'), value: stats?.rejected ?? 0, icon: XCircle, color: 'red' },
    { label: t('dashboard.followUps'), value: stats?.follow_up ?? 0, icon: Clock, color: 'orange' },
    { label: t('dashboard.conversionRate'), value: `${conversionRate}%`, icon: TrendingUp, color: 'teal' },
    { label: t('dashboard.todayVisits'), value: todayVisits, icon: CalendarCheck, color: 'indigo' },
  ]

  const tooltipStyle = {
    background: chartTheme.tooltipBg,
    border: `1px solid ${chartTheme.tooltipBorder}`,
    color: chartTheme.tooltipText,
    borderRadius: 8,
    fontSize: 12,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">{t('dashboard.title')}</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="flex items-start gap-3 p-4">
              <Skeleton className="size-10 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </Card>
          ))
        ) : (
          kpis.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="flex items-start gap-3 p-4">
              <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', KPI_COLOR_STYLES[color])}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visits over time */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-semibold text-foreground mb-4">{t('dashboard.visitsOverTime')}</h3>
          {visitsLoading ? (
            <Skeleton className="h-40 sm:h-52 w-full" />
          ) : (
            <div className="h-40 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartTheme.colors[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartTheme.colors[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: chartTheme.axis }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.axis }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="count" stroke={chartTheme.colors[0]} fill="url(#visitsGrad)" strokeWidth={2} name={t('dashboard.totalVisits')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Status pie */}
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4">{t('dashboard.customersByStatus')}</h3>
          {statsLoading ? (
            <Skeleton className="h-40 sm:h-52 w-full" />
          ) : pieData.length > 0 ? (
            <div className="h-40 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                    {pieData.map((_, i) => <Cell key={i} fill={chartTheme.colors[i % chartTheme.colors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 sm:h-52 flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
          )}
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rejection reasons */}
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4">{t('dashboard.rejectionReasons')}</h3>
          {rejectionLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : rejectionData.length > 0 ? (
            <div style={{ height: Math.max(160, rejectionData.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rejectionData} layout="vertical" margin={{ left: 0, right: 20 }}>
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

        {/* Top employees */}
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            {t('dashboard.topEmployees')}
          </h3>
          {topEmployeesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : topEmployees.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
          ) : (
            <div className="space-y-3">
              {topEmployees.map((e, i) => (
                <RankedListItem
                  key={e.employee.id}
                  compact
                  rank={i + 1}
                  name={e.employee.full_name}
                  rate={e.total > 0 ? (e.approved / e.total) * 100 : 0}
                  rateLabel={`${e.approved}/${e.total}`}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent visits */}
      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{t('visits.recentVisits')}</h3>
        </div>
        {recentVisitsLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="size-8 rounded-lg shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : recentVisits.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{t('common.noData')}</div>
        ) : (
          <div className="divide-y divide-border">
            {recentVisits.map(v => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3 gap-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{v.customer?.business_name}</p>
                    <p className="text-xs text-muted-foreground">{v.employee?.full_name} · {formatDate(v.visit_date)}</p>
                  </div>
                </div>
                <VisitResultBadge result={v.result} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
