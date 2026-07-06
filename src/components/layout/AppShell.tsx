import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { applyDirection } from '@/i18n'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { cn } from '@/utils/cn'

export default function AppShell() {
  const { profile } = useAuthStore()
  const { language, darkMode } = useUiStore()
  const isSales = profile?.role === 'sales'
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    applyDirection(language)
    i18n.changeLanguage(language)
  }, [language, i18n])

  // Redirect to role home when landing on "/"
  useEffect(() => {
    if (!profile) return
    if (window.location.pathname === '/') {
      navigate(profile.role === 'admin' ? '/dashboard' : '/my-customers', { replace: true })
    }
  }, [profile, navigate])

  return (
    <div className={cn('fixed inset-0 flex overflow-hidden bg-muted')}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
        <Header />
        <main
          className={cn(
            'flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin',
            isSales && 'pb-24 lg:pb-6'
          )}
        >
          <Outlet />
        </main>
      </div>
      {isSales && <BottomNav />}
    </div>
  )
}
