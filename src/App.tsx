import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from '@/routes'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { authService } from '@/services/auth.service'
import { applyDirection } from '@/i18n'
import '@/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function AuthInitializer() {
  const { setSession, setProfile, setLoading } = useAuthStore()
  const { language, darkMode } = useUiStore()

  // Apply persisted theme & language on first render
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    applyDirection(language)
  }, [language])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const profile = await authService.getProfile(session.user.id)
          setSession(session)
          setProfile(profile)
        } catch {
          setSession(null)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            const profile = await authService.getProfile(session.user.id)
            setSession(session)
            setProfile(profile)
          } catch {
            setSession(null)
            setProfile(null)
          }
        } else if (event === 'SIGNED_OUT' || !session) {
          setSession(null)
          setProfile(null)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setSession, setProfile, setLoading])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  )
}
