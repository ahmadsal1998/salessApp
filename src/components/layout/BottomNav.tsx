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
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-16">
        {navItems.map(({ key, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors active:opacity-60',
                isActive
                  ? 'text-primary'
                  : 'text-gray-400 dark:text-gray-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'w-12 h-8 flex items-center justify-center rounded-2xl transition-all duration-200',
                    isActive && 'bg-primary/10 dark:bg-primary/15'
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
