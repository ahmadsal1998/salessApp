import { useTranslation } from 'react-i18next'
import { Menu, Moon, Sun, Globe, LogOut, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { authService } from '@/services/auth.service'
import { applyDirection } from '@/i18n'
import { cn } from '@/utils/cn'
import { useState } from 'react'

const routeTitles: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/customers': 'nav.customers',
  '/employees': 'nav.employees',
  '/visits': 'nav.visits',
  '/reports': 'nav.reports',
  '/map': 'nav.mapView',
  '/settings': 'nav.settings',
  '/my-customers': 'nav.myCustomers',
  '/add-visit': 'nav.addVisit',
  '/follow-ups': 'nav.followUps',
  '/map-nav': 'nav.mapNavigation',
}

export default function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, clear } = useAuthStore()
  const { toggleSidebar, language, setLanguage, darkMode, toggleDarkMode } = useUiStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const currentKey = Object.entries(routeTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1]

  function toggleLang() {
    const next = language === 'en' ? 'ar' : 'en'
    setLanguage(next)
    i18n.changeLanguage(next)
    applyDirection(next)
  }

  async function handleLogout() {
    await authService.signOut()
    clear()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 shrink-0 z-30">
      {/* Hamburger — hidden on mobile for sales role (BottomNav handles navigation) */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
          profile?.role === 'sales' && 'hidden lg:flex'
        )}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-gray-900 dark:text-white flex-1 truncate">
        {currentKey ? t(currentKey) : ''}
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Toggle language"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
            {language === 'en' ? 'AR' : 'EN'}
          </span>
        </button>

        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className={cn(
            'p-2 rounded-lg transition-colors',
            darkMode
              ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
          title="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-28 truncate">
              {profile?.full_name}
            </span>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div
                className={cn(
                  'absolute top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20',
                  'inset-e-0'
                )}
              >
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  {t('common.profile')}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
