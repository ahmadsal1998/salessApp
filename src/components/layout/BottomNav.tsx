import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClipboardList, CalendarCheck, Bell, Navigation } from 'lucide-react'
import { cn } from '@/utils/cn'

const navItems = [
  { key: 'nav.myCustomers', icon: ClipboardList, to: '/my-customers' },
  { key: 'nav.addVisit', icon: CalendarCheck, to: '/add-visit' },
  { key: 'nav.followUps', icon: Bell, to: '/follow-ups' },
  { key: 'nav.mapNavigation', icon: Navigation, to: '/map-nav' },
]

export default function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.07)] lg:hidden dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16 items-center">
        {navItems.map(({ key, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors active:opacity-60',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-2xl transition-all duration-200',
                    isActive && 'bg-primary/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-200',
                      isActive && 'scale-110'
                    )}
                  />
                </span>
                <span className="text-[10px] font-medium leading-none truncate max-w-[4.5rem] text-center">
                  {t(key)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
