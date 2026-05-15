import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types/app.types'

interface Props {
  role: UserRole
  children: React.ReactNode
}

export function RoleRoute({ role, children }: Props) {
  const { profile } = useAuthStore()

  if (!profile) return null

  if (profile.role !== role) {
    const fallback = profile.role === 'admin' ? '/dashboard' : '/my-customers'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
