import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Users, UserCheck, CalendarCheck, BarChart2,
  Map, Settings, X, Navigation, ClipboardList, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { cn } from '@/utils/cn'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { LogoMark } from '@/components/icons/LogoMark'

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
  const { sidebarOpen, setSidebarOpen, language } = useUiStore()

  const isSales = profile?.role === 'sales'
  const navItems = isSales ? salesNav : adminNav
  const tooltipSide = language === 'ar' ? 'left' : 'right'

  return (
    <>
      {/* Mobile overlay — sales role uses BottomNav instead of sidebar on mobile */}
      {sidebarOpen && !isSales && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] animate-fade-in lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile for sales role (BottomNav takes over) */}
      <aside
        className={cn(
          isSales ? 'hidden lg:flex lg:flex-col' : 'flex flex-col',
          'fixed inset-y-0 inset-s-0 z-50 border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
          'lg:relative lg:translate-x-0 lg:rtl:translate-x-0',
          sidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-64 ltr:-translate-x-full rtl:translate-x-full lg:w-16 lg:translate-x-0 lg:rtl:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 overflow-hidden border-b border-sidebar-border px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LogoMark className="size-5" />
          </div>
          <div className={cn('min-w-0 flex-1 transition-all duration-300', !sidebarOpen && 'lg:hidden')}>
            <p className="truncate text-sm font-bold text-foreground">
              {t('auth.appName')}
            </p>
            <p className="truncate text-xs text-muted-foreground">{t('auth.appTagline')}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ms-auto rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin px-2 py-4">
          {navItems.map(({ key, icon: Icon, to }) => {
            const link = (
              <NavLink
                key={to}
                to={to}
                onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    !sidebarOpen && 'lg:justify-center',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 before:absolute before:inset-y-1 before:inset-s-0 before:w-0.5 before:rounded-full before:bg-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )
                }
              >
                <Icon className="size-5 shrink-0" />
                <span className={cn('truncate transition-all duration-300', !sidebarOpen && 'lg:hidden')}>
                  {t(key)}
                </span>
              </NavLink>
            )
            if (sidebarOpen) return link
            return (
              <Tooltip key={to} delayDuration={300}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side={tooltipSide} className="hidden lg:block">
                  {t(key)}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Desktop collapse toggle */}
        <div className="hidden shrink-0 border-t border-sidebar-border px-2 py-2 lg:flex">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? t('common.collapse') : t('common.expand')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight
              className={cn(
                'size-5 shrink-0 transition-transform duration-300',
                sidebarOpen ? 'ltr:rotate-180 rtl:rotate-0' : 'ltr:rotate-0 rtl:rotate-180'
              )}
            />
            {sidebarOpen && <span className="truncate text-xs">{t('common.collapse')}</span>}
          </button>
        </div>

        {/* User info */}
        {profile && (
          <div className={cn(
            'shrink-0 border-t border-sidebar-border p-3',
            !sidebarOpen && 'lg:flex lg:justify-center'
          )}>
            <div className={cn(
              'flex items-center gap-3 px-2 py-2',
              !sidebarOpen && 'lg:justify-center lg:px-0'
            )}>
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-sm">
                  {profile.full_name?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className={cn('min-w-0', !sidebarOpen && 'lg:hidden')}>
                <p className="truncate text-sm font-medium text-foreground">{profile.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
