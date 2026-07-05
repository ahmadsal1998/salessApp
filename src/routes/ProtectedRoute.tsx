import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import PageLoader from '@/components/common/PageLoader'

interface Props {
  children: React.ReactNode
}

const STUCK_LOADING_TIMEOUT_MS = 10_000

export function ProtectedRoute({ children }: Props) {
  const { t } = useTranslation()
  const { session, isLoading } = useAuthStore()
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    if (!isLoading) return
    const timer = setTimeout(() => setStuck(true), STUCK_LOADING_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [isLoading])

  if (isLoading) {
    if (stuck) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('errors.generic')}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              {t('common.refresh')}
            </button>
          </div>
        </div>
      )
    }
    return <PageLoader />
  }
  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}
