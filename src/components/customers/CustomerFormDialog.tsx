import { useState, useEffect } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Plus, Star, Image as ImageIcon, Building2, MapPin, Globe, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import { useBusinessActivities, useCreateBusinessActivity } from '@/hooks/useBusinessActivities'
import { useEmployees } from '@/hooks/useEmployees'
import { useAuthStore } from '@/store/auth.store'
import LocationPicker from '@/components/map/LocationPicker'
import WorkingHoursInput, { DEFAULT_WORKING_HOURS, DAYS } from '@/components/customers/WorkingHoursInput'
import { PlatformIcon } from '@/components/customers/PlatformIcon'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { FormField } from '@/components/ui/FormField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import type { CustomerWithEmployee, CustomerStatus, SocialLink, SocialPlatform, StoreImage, WorkingHours } from '@/types/app.types'
import type { Json } from '@/types/database.types'
import { STATIC_CATEGORIES } from '@/utils/category'

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

const CATEGORIES = STATIC_CATEGORIES
const STATUSES: CustomerStatus[] = ['new', 'visited', 'interested', 'approved', 'rejected', 'follow_up']

const NO_CATEGORY = '__none__'
const UNASSIGNED = '__unassigned__'

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
  const { data: businessActivities } = useBusinessActivities()
  const createActivityMutation = useCreateBusinessActivity()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS)
  const [activeTab, setActiveTab] = useState<TabId>('basic')
  const [addActivityOpen, setAddActivityOpen] = useState(false)
  const [newActivityName, setNewActivityName] = useState('')

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

  async function handleSaveActivity() {
    const name = newActivityName.trim()
    if (!name) return
    try {
      const created = await createActivityMutation.mutateAsync(name)
      setValue('category', created.name, { shouldDirty: true })
      setAddActivityOpen(false)
    } catch {
      // error handled by mutation's onError (toast)
    }
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {customer ? t('customers.editCustomer') : t('customers.addCustomer')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border px-5 py-3 shrink-0">
            <TabsList>
              {TABS.map(({ id, icon: Icon, labelKey }) => {
                const hasErrors = hasTabErrors(id, errors)
                return (
                  <TabsTrigger key={id} value={id} className="relative">
                    <Icon className="size-4 shrink-0" />
                    <span className="hidden sm:inline">{t(labelKey)}</span>
                    {hasErrors && (
                      <span className="absolute -top-0.5 -inset-e-0.5 size-1.5 rounded-full bg-destructive" />
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <DialogBody>
              {/* Tab 1: Basic Info */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t('customers.businessName')} error={errors.business_name?.message} required>
                    <Input {...register('business_name')} aria-invalid={!!errors.business_name} />
                  </FormField>
                  <FormField label={t('customers.ownerName')} error={errors.owner_name?.message} required>
                    <Input {...register('owner_name')} aria-invalid={!!errors.owner_name} />
                  </FormField>
                  <FormField label={t('customers.phone')} error={errors.phone?.message} required>
                    <Input {...register('phone')} type="tel" inputMode="tel" aria-invalid={!!errors.phone} />
                  </FormField>
                  <FormField label={t('customers.category')}>
                    <div className="flex gap-2">
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <Select
                            value={field.value?.trim() ? field.value : NO_CATEGORY}
                            onValueChange={(v) => field.onChange(v === NO_CATEGORY ? '' : v)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NO_CATEGORY}>{t('common.all')}</SelectItem>
                              {CATEGORIES.map(c => (
                                <SelectItem key={c} value={c}>{t(`customers.categories.${c}`)}</SelectItem>
                              ))}
                              {businessActivities?.map(a => (
                                <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => { setNewActivityName(''); setAddActivityOpen(true) }}
                        title={t('customers.addActivity')}
                        className="shrink-0"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </FormField>
                  <FormField label={t('customers.city')}>
                    <Input {...register('city')} />
                  </FormField>
                  <FormField label={t('customers.area')}>
                    <Input {...register('area')} />
                  </FormField>
                </div>
                <FormField label={t('customers.address')}>
                  <Input {...register('address')} />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t('customers.status')}>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => (
                              <SelectItem key={s} value={s}>{t(`customers.statuses.${s}`)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  <FormField label={t('customers.assignedTo')}>
                    <Controller
                      name="assigned_to"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.trim() ? field.value : UNASSIGNED}
                          onValueChange={(v) => field.onChange(v === UNASSIGNED ? '' : v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNASSIGNED}>{t('customers.unassigned')}</SelectItem>
                            {employees?.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                </div>
                <FormField label={t('customers.notes')}>
                  <Textarea {...register('notes')} rows={3} />
                </FormField>
              </TabsContent>

              {/* Tab 2: Location & Hours */}
              <TabsContent value="location" className="space-y-4">
                <FormField label={`${t('map.coordinates')} (${t('common.optional')})`} error={errors.coordinates?.message}>
                  <Input
                    {...register('coordinates')}
                    placeholder="32.46463, 35.29676"
                    aria-invalid={!!errors.coordinates}
                  />
                </FormField>
                <LocationPicker value={location} onChange={handleLocationChange} height="280px" />
                <WorkingHoursInput value={workingHours} onChange={setWorkingHours} />
              </TabsContent>

              {/* Tab 3: Social & Images */}
              <TabsContent value="social" className="space-y-5">
                {/* Cover Images */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {t('customers.coverImages')}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => appendCover({ url: '', is_main: coverFields.length === 0 })}
                      className="text-primary hover:text-primary"
                    >
                      <Plus className="size-3.5" />
                      {t('customers.addImage')}
                    </Button>
                  </div>
                  {coverFields.length > 0 ? (
                    <div className="space-y-2">
                      {coverFields.map((field, index) => {
                        const urlValue = watchedImages[index]?.url ?? ''
                        const isMain = watchedImages[index]?.is_main ?? false
                        const urlError = errors.cover_images?.[index]?.url?.message
                        return (
                          <div key={field.id} className="flex items-start gap-2">
                            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                              <ImagePreviewThumb url={urlValue} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <Input
                                {...register(`cover_images.${index}.url`)}
                                placeholder="https://example.com/image.jpg"
                                aria-invalid={!!urlError}
                              />
                              {urlError && <p className="mt-0.5 text-xs text-destructive">{t('customers.invalidUrl')}</p>}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setMainCoverImage(index)}
                              title={t('customers.setAsMain')}
                              className={isMain ? 'text-amber-500 hover:text-amber-500' : 'text-muted-foreground hover:text-amber-500'}
                            >
                              <Star className={isMain ? 'size-4 fill-amber-500' : 'size-4'} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeCover(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">{t('customers.addImage')} →</p>
                  )}
                </div>

                {/* Social Links */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {t('customers.socialLinks')}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => append({ platform: 'facebook', url: '', label: '' })}
                      className="text-primary hover:text-primary"
                    >
                      <Plus className="size-3.5" />
                      {t('customers.addLink')}
                    </Button>
                  </div>
                  {fields.length > 0 ? (
                    <div className="space-y-2">
                      {fields.map((field, index) => {
                        const platform = watchedLinks[index]?.platform ?? field.platform
                        const urlError = errors.social_links?.[index]?.url?.message
                        return (
                          <div key={field.id} className="flex items-start gap-2">
                            <div className="mt-2 flex items-center justify-center">
                              <PlatformIcon platform={platform as SocialPlatform} />
                            </div>
                            <div className="w-36 shrink-0">
                              <Controller
                                control={control}
                                name={`social_links.${index}.platform`}
                                render={({ field: platformField }) => (
                                  <Select value={platformField.value} onValueChange={platformField.onChange}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PLATFORMS.map(p => (
                                        <SelectItem key={p} value={p}>{t(`customers.platforms.${p}`)}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <Input
                                {...register(`social_links.${index}.url`)}
                                placeholder="https://"
                                aria-invalid={!!urlError}
                              />
                              {urlError && <p className="mt-0.5 text-xs text-destructive">{t('customers.invalidUrl')}</p>}
                            </div>
                            {platform === 'custom' && (
                              <div className="w-28 shrink-0">
                                <Input
                                  {...register(`social_links.${index}.label`)}
                                  placeholder={t('customers.customLabel')}
                                />
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => remove(index)}
                              className="mt-2 text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">{t('customers.addLink')} →</p>
                  )}
                </div>
              </TabsContent>
            </DialogBody>
          </form>
        </Tabs>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            {canGoPrev && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab(TAB_ORDER[currentIndex - 1])}
              >
                <ChevronLeft className="size-4 rtl:rotate-180" />
                <span className="hidden sm:inline">{t('common.back')}</span>
              </Button>
            )}
            {canGoNext && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab(TAB_ORDER[currentIndex + 1])}
              >
                <span className="hidden sm:inline">{t('common.next')}</span>
                <ChevronRight className="size-4 rtl:rotate-180" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="customer-form" loading={isPending}>
              {t('common.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('customers.addActivity')}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FormField label={t('customers.newActivityName')}>
              <Input
                autoFocus
                value={newActivityName}
                onChange={e => setNewActivityName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveActivity() } }}
                placeholder={t('customers.newActivityPlaceholder')}
              />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddActivityOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!newActivityName.trim()}
              loading={createActivityMutation.isPending}
              onClick={handleSaveActivity}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

function ImagePreviewThumb({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  const valid = isValidUrl(url)

  useEffect(() => { setFailed(false) }, [url])

  if (!valid || failed) {
    return <ImageIcon className="size-5 text-muted-foreground" />
  }
  return (
    <img
      src={url}
      alt=""
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}
