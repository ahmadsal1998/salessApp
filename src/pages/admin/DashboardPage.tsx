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

const CHART_COLORS = ['#3b82f6', '#a855f7', '#eab308', '#22c55e', '#ef4444', '#f97316']

export default function DashboardPage() {
  const { t } = useTranslation()

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => customersService.getDashboardStats(),
  })
  const { data: todayVisits = 0 } = useTodayVisitCount()
  const { data: visitsData = [] } = useVisitsLast30Days()
  const { data: rejectionData = [] } = useRejectionBreakdown()
  const { data: topEmployees = [] } = useTopEmployees()
  const { data: recentVisitsData } = useVisits({ page: 1, pageSize: 5 })
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

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600',
    purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600',
    green: 'bg-green-50 dark:bg-green-950/20 text-green-600',
    red: 'bg-red-50 dark:bg-red-950/20 text-red-600',
    orange: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600',
    teal: 'bg-teal-50 dark:bg-teal-950/20 text-teal-600',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visits over time */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.visitsOverTime')}</h3>
          <div className="h-40 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#visitsGrad)" strokeWidth={2} name={t('dashboard.totalVisits')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status pie */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.customersByStatus')}</h3>
          {pieData.length > 0 ? (
            <div className="h-40 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 sm:h-52 flex items-center justify-center text-gray-400 text-sm">{t('common.noData')}</div>
          )}
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rejection reasons */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.rejectionReasons')}</h3>
          {rejectionData.length > 0 ? (
            <div style={{ height: Math.max(160, rejectionData.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rejectionData} layout="vertical" margin={{ left: 0, right: 20 }}>
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

        {/* Top employees */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            {t('dashboard.topEmployees')}
          </h3>
          {topEmployees.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">{t('common.noData')}</div>
          ) : (
            <div className="space-y-3">
              {topEmployees.map((e, i) => (
                <div key={e.employee.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.employee.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: e.total > 0 ? `${(e.approved / e.total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0 tabular-nums">{e.approved}/{e.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent visits */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('visits.recentVisits')}</h3>
        </div>
        {recentVisits.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">{t('common.noData')}</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentVisits.map(v => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3 gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{v.customer?.business_name}</p>
                    <p className="text-xs text-gray-500">{v.employee?.full_name} · {formatDate(v.visit_date)}</p>
                  </div>
                </div>
                <VisitResultBadge result={v.result} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
