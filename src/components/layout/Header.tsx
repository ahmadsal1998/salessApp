import { useTranslation } from 'react-i18next'
import { Menu, Moon, Sun, Globe, LogOut, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { authService } from '@/services/auth.service'
import { applyDirection } from '@/i18n'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      {/* Hamburger — hidden on mobile for sales role (BottomNav handles navigation) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(profile?.role === 'sales' && 'hidden lg:inline-flex')}
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" />
      </Button>

      {/* Page title */}
      <h1 className="flex-1 truncate text-base font-semibold text-foreground">
        {currentKey ? t(currentKey) : ''}
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Language toggle */}
        <Button variant="ghost" size="sm" onClick={toggleLang} title="Toggle language" className="gap-1.5">
          <Globe className="size-4" />
          <span className="hidden text-xs font-semibold uppercase tracking-wider sm:inline">
            {language === 'en' ? 'AR' : 'EN'}
          </span>
        </Button>

        {/* Dark mode */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className={cn(
            darkMode && 'text-amber-500 hover:bg-amber-500/10 hover:text-amber-500'
          )}
          title="Toggle dark mode"
        >
          {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">
                  {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-28 truncate text-sm font-medium text-foreground sm:block">
                {profile?.full_name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="px-2 pb-1 pt-1">
              <p className="truncate text-sm font-medium normal-case text-foreground">{profile?.full_name}</p>
              <p className="truncate text-xs font-normal normal-case text-muted-foreground">{profile?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="size-4" />
              {t('common.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem destructive onClick={handleLogout}>
              <LogOut className="size-4" />
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
