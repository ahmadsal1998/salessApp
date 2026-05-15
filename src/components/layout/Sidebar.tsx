import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Users, UserCheck, CalendarCheck, BarChart2,
  Map, Settings, X, BarChart3, Navigation, ClipboardList, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { cn } from '@/utils/cn'

const adminNav = [
  { key: 'nav.dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { key: 'nav.customers', icon: Users, to: '/customers' },
  { key: 'nav.employees', icon: UserCheck, to: '/employees' },
  { key: 'nav.visits', icon: CalendarCheck, to: '/visits' },
  { key: 'nav.reports', icon: BarChart2, to: '/reports' },
  { key: 'nav.mapView', icon: Map, to: '/map' },
  { key: 'nav.settings', icon: Settings, to: '/settings' },
]

const salesNav = [
  { key: 'nav.myCustomers', icon: ClipboardList, to: '/my-customers' },
  { key: 'nav.addVisit', icon: CalendarCheck, to: '/add-visit' },
  { key: 'nav.followUps', icon: ClipboardList, to: '/follow-ups' },
  { key: 'nav.mapNavigation', icon: Navigation, to: '/map-nav' },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUiStore()

  const isSales = profile?.role === 'sales'
  const navItems = isSales ? salesNav : adminNav

  return (
    <>
      {/* Mobile overlay — sales role uses BottomNav instead of sidebar on mobile */}
      {sidebarOpen && !isSales && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile for sales role (BottomNav takes over) */}
      <aside
        className={cn(
          isSales ? 'hidden lg:flex lg:flex-col' : 'flex flex-col',
          'fixed inset-y-0 inset-s-0 z-50 bg-white dark:bg-gray-900 border-e border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:rtl:translate-x-0',
          sidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-64 ltr:-translate-x-full rtl:translate-x-full lg:w-16 lg:translate-x-0 lg:rtl:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200 dark:border-gray-800 shrink-0 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className={cn('min-w-0 flex-1 transition-all duration-300', !sidebarOpen && 'lg:hidden')}>
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
              {t('auth.appName')}
            </p>
            <p className="text-xs text-gray-400 truncate">{t('auth.appTagline')}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ms-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map(({ key, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              title={!sidebarOpen ? t(key) : undefined}
              onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary dark:text-blue-400 dark:bg-primary/15 shadow-sm ring-1 ring-primary/20 before:absolute before:inset-y-1 before:inset-s-0 before:w-0.5 before:rounded-full before:bg-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={cn('truncate transition-all duration-300', !sidebarOpen && 'lg:hidden')}>
                {t(key)}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Desktop collapse toggle */}
        <div className="hidden lg:flex px-2 py-2 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? t('common.collapse') : t('common.expand')}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight
              className={cn(
                'w-5 h-5 shrink-0 transition-transform duration-300',
                sidebarOpen ? 'ltr:rotate-180 rtl:rotate-0' : 'ltr:rotate-0 rtl:rotate-180'
              )}
            />
            {sidebarOpen && <span className="text-xs truncate">{t('common.collapse')}</span>}
          </button>
        </div>

        {/* User info */}
        {profile && (
          <div className={cn(
            'p-3 border-t border-gray-200 dark:border-gray-800 shrink-0',
            !sidebarOpen && 'lg:flex lg:justify-center'
          )}>
            <div className={cn(
              'flex items-center gap-3 px-2 py-2',
              !sidebarOpen && 'lg:px-0 lg:justify-center'
            )}>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {profile.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className={cn('min-w-0', !sidebarOpen && 'lg:hidden')}>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{profile.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
