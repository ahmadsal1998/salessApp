import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, User, Building2, Calendar, Navigation, Edit2, ArrowLeft, Plus, CalendarX, Star, Clock, AlertCircle } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomers'
import { useVisits } from '@/hooks/useVisits'
import { CustomerStatusBadge, VisitResultBadge } from '@/components/common/StatusBadge'
import CustomerFormDialog from '@/components/customers/CustomerFormDialog'
import VisitFormDialog from '@/components/visits/VisitFormDialog'
import { PlatformIcon } from '@/components/customers/PlatformIcon'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatDateTime } from '@/utils/format'
import EmptyState from '@/components/common/EmptyState'
import { DAYS } from '@/components/customers/WorkingHoursInput'
import { cn } from '@/utils/cn'
import type { SocialLink, StoreImage, WorkingHours, DayKey } from '@/types/app.types'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [visitOpen, setVisitOpen] = useState(false)

  const { data: customer, isPending } = useCustomer(id)
  const { data: visitsData } = useVisits({ customerId: id, pageSize: 50 })
  const visits = visitsData?.data ?? []

  function openNavigation() {
    if (customer?.latitude && customer?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`, '_blank')
    }
  }

  if (isPending) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-9 w-32" />
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!customer) return <div className="text-center py-16 text-muted-foreground">{t('errors.notFound')}</div>

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Back + Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setVisitOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="size-4 shrink-0" />
            <span className="hidden sm:inline">{t('visits.addVisit')}</span>
          </Button>
          {customer.latitude && customer.longitude && (
            <Button onClick={openNavigation}>
              <Navigation className="size-4 shrink-0" />
              <span className="hidden sm:inline">{t('customers.navigateToLocation')}</span>
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Edit2 className="size-4 shrink-0" />
            <span className="hidden sm:inline">{t('common.edit')}</span>
          </Button>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">{customer.business_name}</h2>
            <p className="text-muted-foreground mt-0.5">{customer.category}</p>
          </div>
          <CustomerStatusBadge status={customer.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={User} label={t('customers.ownerName')} value={customer.owner_name} />
          <InfoRow icon={Phone} label={t('customers.phone')} value={customer.phone} />
          <InfoRow icon={Building2} label={t('customers.city')} value={[customer.city, customer.area].filter(Boolean).join(', ') || '—'} />
          <InfoRow icon={MapPin} label={t('customers.address')} value={customer.address || '—'} />
          <InfoRow icon={User} label={t('customers.assignedTo')} value={(customer as { assigned_employee?: { full_name: string } }).assigned_employee?.full_name || t('customers.unassigned')} />
          <InfoRow icon={Calendar} label={t('customers.createdAt')} value={formatDate(customer.created_at)} />
        </div>

        {customer.notes && (
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <p className="text-xs font-medium text-muted-foreground mb-1">{t('common.notes')}</p>
            <p className="text-sm text-foreground">{customer.notes}</p>
          </div>
        )}

        <CoverImagesSection images={customer.cover_images as StoreImage[] | null} t={t} />
        <WorkingHoursSection hours={customer.working_hours as WorkingHours | null} t={t} />
        <SocialLinksSection links={customer.social_links as SocialLink[] | null} t={t} />

        {customer.latitude && customer.longitude && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs font-medium text-primary flex items-center gap-1">
              <MapPin className="size-3" />
              {t('map.coordinates')}: {customer.latitude.toFixed(6)}, {customer.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </Card>

      {/* Visit History */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{t('customers.visitHistory')}</h3>
          <span className="text-xs text-muted-foreground">{visits.length} {t('visits.title').toLowerCase()}</span>
        </div>
        {visits.length === 0 ? (
          <EmptyState icon={CalendarX} title={t('customers.noVisits')} />
        ) : (
          <div className="divide-y divide-border">
            {visits.map((v) => (
              <div key={v.id} className="p-4 flex items-start justify-between gap-4 hover:bg-secondary/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <VisitResultBadge result={v.result} />
                    <span className="text-xs text-muted-foreground">{formatDateTime(v.visit_date)}</span>
                  </div>
                  {v.rejection_reason && (
                    <div className="flex items-start gap-1.5 text-xs text-destructive mt-1">
                      <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                      <span>{(v.rejection_reason as { reason_en: string })?.reason_en}</span>
                    </div>
                  )}
                  {v.notes && <p className="text-sm text-muted-foreground mt-1">{v.notes}</p>}
                  {v.next_follow_up && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
                      <Clock className="size-3.5 shrink-0" />
                      <span>{t('visits.nextFollowUp')}: {formatDate(v.next_follow_up)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{(v.employee as { full_name: string })?.full_name}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CustomerFormDialog open={editOpen} onClose={() => setEditOpen(false)} customer={customer} />
      <VisitFormDialog open={visitOpen} onClose={() => setVisitOpen(false)} preselectedCustomerId={id} />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function fmt12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

function WorkingHoursSection({ hours, t }: { hours: WorkingHours | null; t: (k: string) => string }) {
  if (!hours || !Object.keys(hours).length) return null

  const now = new Date()
  const todayKey = DAYS[now.getDay()] as DayKey
  const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const todaySchedule = hours[todayKey]
  const isOpenNow = !!todaySchedule?.open && cur >= todaySchedule.from && cur < todaySchedule.to

  return (
    <div className="mt-4 rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" />
          {t('customers.workingHours')}
        </span>
        <Badge variant={isOpenNow ? 'success' : 'default'}>
          {isOpenNow ? t('customers.openNow') : t('customers.closedNow')}
        </Badge>
      </div>

      {/* Day rows */}
      <div className="divide-y divide-border">
        {DAYS.map(day => {
          const schedule = hours[day as DayKey]
          const isToday = day === todayKey
          return (
            <div
              key={day}
              className={cn('flex items-center justify-between px-3 py-2 text-xs', isToday ? 'bg-primary/5' : 'bg-card')}
            >
              <span className={cn('font-semibold w-8 shrink-0', isToday ? 'text-primary' : 'text-muted-foreground')}>
                {t(`customers.days.${day}`)}
              </span>
              {schedule?.open ? (
                <span className={isToday ? 'text-primary font-medium' : 'text-foreground'}>
                  {fmt12(schedule.from)} – {fmt12(schedule.to)}
                </span>
              ) : (
                <span className="text-muted-foreground italic">{t('customers.closed')}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CoverImagesSection({ images, t }: { images: StoreImage[] | null; t: (k: string) => string }) {
  const [activeIdx, setActiveIdx] = useState(0)
  if (!images?.length) return null

  const mainIdx = images.findIndex(img => img.is_main)
  const displayIdx = activeIdx < images.length ? activeIdx : 0
  const orderedImages = mainIdx >= 0
    ? [images[mainIdx], ...images.filter((_, i) => i !== mainIdx)]
    : images

  return (
    <div className="mt-4">
      {/* Main image display */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted mb-2">
        <img
          src={orderedImages[displayIdx]?.url}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {orderedImages[displayIdx]?.is_main && (
          <span className="absolute top-2 inset-s-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-950 text-xs font-semibold">
            <Star className="size-3 fill-amber-950" />
            {t('customers.mainCover')}
          </span>
        )}
      </div>

      {/* Thumbnails — only show when more than one image */}
      {orderedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {orderedImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={cn(
                'relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors',
                displayIdx === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover bg-muted"
                onError={(e) => {
                  const el = e.target as HTMLImageElement
                  el.style.display = 'none'
                }}
              />
              {img.is_main && (
                <span className="absolute bottom-0.5 inset-e-0.5">
                  <Star className="size-3 fill-amber-400 text-amber-400 drop-shadow" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SocialLinksSection({ links, t }: { links: SocialLink[] | null; t: (k: string) => string }) {
  if (!links?.length) return null
  return (
    <div className="mt-4 p-3 rounded-lg bg-muted">
      <p className="text-xs font-medium text-muted-foreground mb-2">{t('customers.socialLinks')}</p>
      <div className="flex flex-wrap gap-2">
        {links.map((link, i) => {
          const href = link.url.startsWith('http') ? link.url : `https://${link.url}`
          const label = link.platform === 'custom' && link.label ? link.label : t(`customers.platforms.${link.platform}`)
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <PlatformIcon platform={link.platform} />
              {label}
            </a>
          )
        })}
      </div>
    </div>
  )
}
