import { useState, useEffect } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { X, Plus, Globe, Link as LinkIcon, Star, Image as ImageIcon, Building2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import { useEmployees } from '@/hooks/useEmployees'
import { useAuthStore } from '@/store/auth.store'
import LocationPicker from '@/components/map/LocationPicker'
import WorkingHoursInput, { DEFAULT_WORKING_HOURS, DAYS } from '@/components/customers/WorkingHoursInput'
import type { CustomerWithEmployee, CustomerStatus, SocialLink, SocialPlatform, StoreImage, WorkingHours } from '@/types/app.types'
import type { Json } from '@/types/database.types'
import { cn } from '@/utils/cn'

function parseCoordinates(val: string): { lat: number; lng: number } | null {
  const parts = val.split(',')
  if (parts.length !== 2) return null
  const lat = parseFloat(parts[0].trim())
  const lng = parseFloat(parts[1].trim())
  if (isNaN(lat) || isNaN(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

function isValidUrl(val: string): boolean {
  try {
    new URL(val.startsWith('http') ? val : `https://${val}`)
    return true
  } catch {
    return false
  }
}

const PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'website', 'linkedin', 'custom']

const socialLinkSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'website', 'linkedin', 'custom']),
  url: z.string().min(1).refine(isValidUrl, { message: 'invalidUrl' }),
  label: z.string().optional(),
})

const storeImageSchema = z.object({
  url: z.string().min(1).refine(isValidUrl, { message: 'invalidUrl' }),
  is_main: z.boolean(),
})

const schema = z.object({
  business_name: z.string().min(1),
  owner_name: z.string().min(1),
  phone: z.string().min(1),
  city: z.string().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['new', 'visited', 'interested', 'approved', 'rejected', 'follow_up']),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
  coordinates: z.string().optional().refine(
    (val) => !val?.trim() || parseCoordinates(val) !== null,
    'Invalid format. Use: latitude, longitude (e.g. 32.4646, 35.2967). Latitude: −90 to 90, Longitude: −180 to 180.'
  ),
  social_links: z.array(socialLinkSchema).optional(),
  cover_images: z.array(storeImageSchema).optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  customer?: CustomerWithEmployee | null
}

type TabId = 'basic' | 'location' | 'social'

const CATEGORIES = ['retail', 'restaurant', 'services', 'healthcare', 'education', 'technology', 'manufacturing', 'other']
const STATUSES: CustomerStatus[] = ['new', 'visited', 'interested', 'approved', 'rejected', 'follow_up']

const PLATFORM_STYLES: Record<SocialPlatform, { bg: string; text: string; abbr: string }> = {
  facebook:  { bg: 'bg-blue-600',  text: 'text-white', abbr: 'Fb' },
  instagram: { bg: 'bg-pink-500',  text: 'text-white', abbr: 'Ig' },
  tiktok:    { bg: 'bg-gray-900',  text: 'text-white', abbr: 'Tt' },
  linkedin:  { bg: 'bg-blue-700',  text: 'text-white', abbr: 'Li' },
  website:   { bg: 'bg-gray-100 dark:bg-gray-600', text: 'text-gray-600 dark:text-gray-200', abbr: '' },
  custom:    { bg: 'bg-gray-100 dark:bg-gray-600', text: 'text-gray-500 dark:text-gray-300', abbr: '' },
}

function PlatformIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === 'website') return <Globe className="w-4 h-4 text-gray-500" />
  if (platform === 'custom') return <LinkIcon className="w-4 h-4 text-gray-400" />
  const { bg, text, abbr } = PLATFORM_STYLES[platform]
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${bg} ${text}`}>
      {abbr}
    </span>
  )
}

function hasTabErrors(tab: TabId, errors: FieldErrors<FormData>): boolean {
  if (tab === 'basic') {
    return !!(errors.business_name || errors.owner_name || errors.phone || errors.status)
  }
  if (tab === 'location') {
    return !!errors.coordinates
  }
  if (tab === 'social') {
    return !!(errors.social_links || errors.cover_images)
  }
  return false
}

export default function CustomerFormDialog({ open, onClose, customer }: Props) {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const { data: employees } = useEmployees()
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS)
  const [activeTab, setActiveTab] = useState<TabId>('basic')

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'new', social_links: [], cover_images: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'social_links' })
  const { fields: coverFields, append: appendCover, remove: removeCover } = useFieldArray({ control, name: 'cover_images' })

  useEffect(() => {
    if (!open) return
    setActiveTab('basic')
    if (customer) {
      reset({
        business_name: customer.business_name,
        owner_name: customer.owner_name,
        phone: customer.phone,
        city: customer.city ?? '',
        area: customer.area ?? '',
        address: customer.address ?? '',
        category: customer.category ?? '',
        status: customer.status,
        assigned_to: customer.assigned_to ?? '',
        notes: customer.notes ?? '',
        coordinates: customer.latitude && customer.longitude
          ? `${customer.latitude}, ${customer.longitude}`
          : '',
        social_links: (customer.social_links as SocialLink[] | null) ?? [],
        cover_images: (customer.cover_images as StoreImage[] | null) ?? [],
      })
      setLocation(
        customer.latitude && customer.longitude
          ? { lat: customer.latitude, lng: customer.longitude }
          : null
      )
      setWorkingHours(
        customer.working_hours ? (customer.working_hours as unknown as WorkingHours) : DEFAULT_WORKING_HOURS
      )
    } else {
      reset({ status: 'new', assigned_to: '', social_links: [], cover_images: [] })
      setLocation(null)
      setWorkingHours(DEFAULT_WORKING_HOURS)
    }
  }, [open, customer, reset])

  const watchedCoords = watch('coordinates')
  useEffect(() => {
    if (!watchedCoords?.trim()) return
    const parsed = parseCoordinates(watchedCoords)
    if (parsed) {
      setLocation(prev =>
        prev?.lat === parsed.lat && prev?.lng === parsed.lng ? prev : parsed
      )
    }
  }, [watchedCoords])

  function handleLocationChange(loc: { lat: number; lng: number } | null) {
    setLocation(loc)
    setValue('coordinates', loc ? `${loc.lat}, ${loc.lng}` : '', { shouldValidate: false })
  }

  function setMainCoverImage(index: number) {
    coverFields.forEach((_, i) => {
      setValue(`cover_images.${i}.is_main`, i === index, { shouldDirty: true })
    })
  }

  async function onSubmit(data: FormData) {
    if (DAYS.some(d => workingHours[d].open && workingHours[d].to <= workingHours[d].from)) return

    const { coordinates, social_links, cover_images, ...rest } = data
    const coords = parseCoordinates(coordinates ?? '')
    const payload = {
      ...rest,
      city: rest.city || null,
      area: rest.area || null,
      address: rest.address || null,
      category: rest.category || null,
      assigned_to: rest.assigned_to || null,
      notes: rest.notes || null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      ...(social_links?.length ? { social_links } : {}),
      cover_images: cover_images ?? [],
      working_hours: workingHours as unknown as Json,
    }

    try {
      if (customer) {
        await updateMutation.mutateAsync({ id: customer.id, data: payload })
      } else {
        await createMutation.mutateAsync({ ...payload, created_by: profile?.id })
      }
      onClose()
    } catch {
      // error handled by mutation's onError (toast)
    }
  }

  if (!open) return null

  const isPending = createMutation.isPending || updateMutation.isPending
  const watchedLinks = watch('social_links') ?? []
  const watchedImages = watch('cover_images') ?? []

  const TABS: { id: TabId; icon: typeof Building2; labelKey: string }[] = [
    { id: 'basic', icon: Building2, labelKey: 'customers.tabBasic' },
    { id: 'location', icon: MapPin, labelKey: 'customers.tabLocation' },
    { id: 'social', icon: Globe, labelKey: 'customers.tabSocial' },
  ]

  const TAB_ORDER: TabId[] = ['basic', 'location', 'social']
  const currentIndex = TAB_ORDER.indexOf(activeTab)
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < TAB_ORDER.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92dvh] flex flex-col z-10">

        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {customer ? t('customers.editCustomer') : t('customers.addCustomer')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0 px-1">
          {TABS.map(({ id, icon: Icon, labelKey }) => {
            const hasErrors = hasTabErrors(id, errors)
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t(labelKey)}</span>
                {hasErrors && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-2 inset-e-2" />
                )}
              </button>
            )
          })}
        </div>

        {/* Scrollable tab content */}
        <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">

            {/* Tab 1: Basic Info */}
            {activeTab === 'basic' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('customers.businessName')} error={errors.business_name?.message} required>
                    <input {...register('business_name')} className={inputClass} />
                  </Field>
                  <Field label={t('customers.ownerName')} error={errors.owner_name?.message} required>
                    <input {...register('owner_name')} className={inputClass} />
                  </Field>
                  <Field label={t('customers.phone')} error={errors.phone?.message} required>
                    <input {...register('phone')} type="tel" className={inputClass} />
                  </Field>
                  <Field label={t('customers.category')}>
                    <select {...register('category')} className={inputClass}>
                      <option value="">{t('common.all')}</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{t(`customers.categories.${c}`)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('customers.city')}>
                    <input {...register('city')} className={inputClass} />
                  </Field>
                  <Field label={t('customers.area')}>
                    <input {...register('area')} className={inputClass} />
                  </Field>
                </div>
                <Field label={t('customers.address')}>
                  <input {...register('address')} className={inputClass} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t('customers.status')}>
                    <select {...register('status')} className={inputClass}>
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{t(`customers.statuses.${s}`)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('customers.assignedTo')}>
                    <Controller
                      name="assigned_to"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className={inputClass}>
                          <option value="">{t('customers.unassigned')}</option>
                          {employees?.map(e => (
                            <option key={e.id} value={e.id}>{e.full_name}</option>
                          ))}
                        </select>
                      )}
                    />
                  </Field>
                </div>
                <Field label={t('customers.notes')}>
                  <textarea {...register('notes')} rows={3} className={inputClass} />
                </Field>
              </>
            )}

            {/* Tab 2: Location & Hours */}
            {activeTab === 'location' && (
              <>
                <Field label={`${t('map.coordinates')} (${t('common.optional')})`} error={errors.coordinates?.message}>
                  <input
                    {...register('coordinates')}
                    placeholder="32.46463, 35.29676"
                    className={inputClass}
                  />
                </Field>
                <LocationPicker value={location} onChange={handleLocationChange} height="280px" />
                <WorkingHoursInput value={workingHours} onChange={setWorkingHours} />
              </>
            )}

            {/* Tab 3: Social & Images */}
            {activeTab === 'social' && (
              <>
                {/* Cover Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('customers.coverImages')}
                    </span>
                    <button
                      type="button"
                      onClick={() => appendCover({ url: '', is_main: coverFields.length === 0 })}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-blue-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('customers.addImage')}
                    </button>
                  </div>
                  {coverFields.length > 0 ? (
                    <div className="space-y-2">
                      {coverFields.map((field, index) => {
                        const urlValue = watchedImages[index]?.url ?? ''
                        const isMain = watchedImages[index]?.is_main ?? false
                        const urlError = errors.cover_images?.[index]?.url?.message
                        return (
                          <div key={field.id} className="flex gap-2 items-start">
                            <div className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden shrink-0 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                              <ImagePreviewThumb url={urlValue} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <input
                                {...register(`cover_images.${index}.url`)}
                                placeholder="https://example.com/image.jpg"
                                className={`${inputClass} ${urlError ? 'border-red-400 focus:ring-red-400' : ''}`}
                              />
                              {urlError && <p className="text-red-500 text-xs mt-0.5">{t('customers.invalidUrl')}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => setMainCoverImage(index)}
                              title={t('customers.setAsMain')}
                              className={`mt-2 p-1.5 rounded transition-colors ${
                                isMain
                                  ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${isMain ? 'fill-yellow-500' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCover(index)}
                              className="mt-2 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t('customers.addImage')} →</p>
                  )}
                </div>

                {/* Social Links */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('customers.socialLinks')}
                    </span>
                    <button
                      type="button"
                      onClick={() => append({ platform: 'facebook', url: '', label: '' })}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-blue-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('customers.addLink')}
                    </button>
                  </div>
                  {fields.length > 0 ? (
                    <div className="space-y-2">
                      {fields.map((field, index) => {
                        const platform = watchedLinks[index]?.platform ?? field.platform
                        const urlError = errors.social_links?.[index]?.url?.message
                        return (
                          <div key={field.id} className="flex gap-2 items-start">
                            <div className="flex items-center justify-center mt-2">
                              <PlatformIcon platform={platform as SocialPlatform} />
                            </div>
                            <div className="w-36 shrink-0">
                              <select {...register(`social_links.${index}.platform`)} className={inputClass}>
                                {PLATFORMS.map(p => (
                                  <option key={p} value={p}>{t(`customers.platforms.${p}`)}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 min-w-0">
                              <input
                                {...register(`social_links.${index}.url`)}
                                placeholder="https://"
                                className={`${inputClass} ${urlError ? 'border-red-400 focus:ring-red-400' : ''}`}
                              />
                              {urlError && <p className="text-red-500 text-xs mt-0.5">{t('customers.invalidUrl')}</p>}
                            </div>
                            {platform === 'custom' && (
                              <div className="w-28 shrink-0">
                                <input
                                  {...register(`social_links.${index}.label`)}
                                  placeholder={t('customers.customLabel')}
                                  className={inputClass}
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="mt-2 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t('customers.addLink')} →</p>
                  )}
                </div>
              </>
            )}
          </div>
        </form>

        {/* Sticky footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            {canGoPrev && (
              <button
                type="button"
                onClick={() => setActiveTab(TAB_ORDER[currentIndex - 1])}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span className="hidden sm:inline">{t('common.back')}</span>
              </button>
            )}
            {canGoNext && (
              <button
                type="button"
                onClick={() => setActiveTab(TAB_ORDER[currentIndex + 1])}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="hidden sm:inline">{t('common.next')}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="customer-form"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isPending && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImagePreviewThumb({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  const valid = isValidUrl(url)

  useEffect(() => { setFailed(false) }, [url])

  if (!valid || failed) {
    return <ImageIcon className="w-5 h-5 text-gray-300 dark:text-gray-500" />
  }
  return (
    <img
      src={url}
      alt=""
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors'
