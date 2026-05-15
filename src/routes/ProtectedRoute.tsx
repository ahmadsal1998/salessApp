import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import PageLoader from '@/components/common/PageLoader'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { session, isLoading } = useAuthStore()

  if (isLoading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}
