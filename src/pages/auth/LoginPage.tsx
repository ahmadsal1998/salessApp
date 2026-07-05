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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'

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
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
      {/* Language Toggle */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={toggleLang}
        className="absolute top-4 end-4"
      >
        {language === 'en' ? 'عربي' : 'English'}
      </Button>

      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-(--shadow-card)">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('auth.appName')}</h1>
          <p className="text-muted-foreground mt-1">{t('auth.appTagline')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('auth.loginTitle')}</CardTitle>
            <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label={t('auth.email')} htmlFor="email" error={errors.email?.message}>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                />
              </FormField>

              <FormField label={t('auth.password')} htmlFor="password" error={errors.password?.message}>
                <div className="relative">
                  <Input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? t('common.close') : t('common.view')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>

              <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
                {isSubmitting ? t('auth.loggingIn') : t('auth.loginButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
