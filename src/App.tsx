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
import { TooltipProvider } from '@/components/ui/Tooltip'
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
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          // Stale/invalid refresh token left over in localStorage — purge it
          // so the SDK's background auto-refresh stops retrying against it.
          await supabase.auth.signOut()
          setSession(null)
          setProfile(null)
          return
        }
        if (session) {
          try {
            const profile = await authService.getProfile(session.user.id)
            setSession(session)
            setProfile(profile)
          } catch {
            setSession(null)
          }
        }
      })
      .catch(() => {
        setSession(null)
        setProfile(null)
      })
      .finally(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Supabase docs: never call other supabase.* methods synchronously
        // inside this callback — during session restore on page load it runs
        // while the internal auth lock is still held, so a nested call (e.g.
        // getProfile()'s implicit getSession() for the auth header) deadlocks
        // waiting on the same lock forever. Deferring with setTimeout lets the
        // outer call release the lock first.
        // https://supabase.com/docs/reference/javascript/auth-onauthstatechange
        if (event === 'SIGNED_IN' && session) {
          setTimeout(async () => {
            try {
              const profile = await authService.getProfile(session.user.id)
              setSession(session)
              setProfile(profile)
            } catch {
              setSession(null)
              setProfile(null)
            }
          }, 0)
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
      <TooltipProvider delayDuration={200}>
        <AuthInitializer />
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
