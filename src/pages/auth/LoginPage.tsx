import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, BarChart3 } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { applyDirection } from '@/i18n'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { setSession, setProfile } = useAuthStore()
  const { language, setLanguage } = useUiStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function toggleLang() {
    const next = language === 'en' ? 'ar' : 'en'
    setLanguage(next)
    i18n.changeLanguage(next)
    applyDirection(next)
  }

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const { session } = await authService.signIn(data.email, data.password)
      if (!session) throw new Error('No session')
      const profile = await authService.getProfile(session.user.id)
      setSession(session)
      setProfile(profile)
      navigate(profile.role === 'admin' ? '/dashboard' : '/my-customers', { replace: true })
    } catch {
      setError(t('auth.loginError'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Language Toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-4 end-4 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
      >
        {language === 'en' ? 'عربي' : 'English'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-4 shadow-lg">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('auth.appName')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('auth.appTagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('auth.loginTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('auth.loginSubtitle')}</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-primary hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('auth.loggingIn')}
                </>
              ) : (
                t('auth.loginButton')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
