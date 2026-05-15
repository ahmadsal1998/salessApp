import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, User, Building2, Calendar, Navigation, ArrowLeft, Plus, Globe, Link as LinkIcon, CalendarX, Star, Clock, AlertCircle } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomers'
import { useVisits } from '@/hooks/useVisits'
import { CustomerStatusBadge, VisitResultBadge } from '@/components/common/StatusBadge'
import VisitFormDialog from '@/components/visits/VisitFormDialog'
import { formatDate, formatDateTime } from '@/utils/format'
import EmptyState from '@/components/common/EmptyState'
import { DAYS } from '@/components/customers/WorkingHoursInput'
import type { SocialLink, SocialPlatform, StoreImage, WorkingHours, DayKey } from '@/types/app.types'

export default function SalesCustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [visitOpen, setVisitOpen] = useState(false)

  const { data: customer, isPending } = useCustomer(id)
  const { data: visitsData } = useVisits({ customerId: id, pageSize: 50 })
  const visits = visitsData?.data ?? []

  function openNavigation() {
    if (customer?.latitude && customer?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`, '_blank')
    }
  }

  if (isPending) return (
    <div className="space-y-4 max-w-2xl">
      <div className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse w-32" />
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-6 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse w-1/2" />
            <div className="h-4 rounded-md bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/4" />
          </div>
          <div className="h-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse w-20 shrink-0" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 rounded bg-gray-100 dark:bg-gray-700/60 animate-pulse w-1/3" />
                <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
    </div>
  )
  if (!customer) return <div className="text-center py-16 text-gray-500">{t('errors.notFound')}</div>

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />{t('common.back')}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisitOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{t('visits.addVisit')}</span>
          </button>
          {customer.latitude && customer.longitude && (
            <button
              onClick={openNavigation}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t('customers.navigateToLocation')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{customer.business_name}</h2>
            <p className="text-gray-500 text-sm">{customer.category}</p>
          </div>
          <CustomerStatusBadge status={customer.status} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: User, label: t('customers.ownerName'), value: customer.owner_name },
            { icon: Phone, label: t('customers.phone'), value: customer.phone },
            { icon: Building2, label: t('customers.city'), value: [customer.city, customer.area].filter(Boolean).join(', ') || '—' },
            { icon: MapPin, label: t('customers.address'), value: customer.address || '—' },
            { icon: Calendar, label: t('customers.createdAt'), value: formatDate(customer.created_at) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
        {customer.notes && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p className="text-xs font-medium text-gray-500 mb-1">{t('common.notes')}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{customer.notes}</p>
          </div>
        )}

        <CoverImagesSection images={customer.cover_images as StoreImage[] | null} t={t} />
        <WorkingHoursSection hours={customer.working_hours as WorkingHours | null} t={t} />
        <SocialLinksSection links={customer.social_links as SocialLink[] | null} t={t} />
      </div>

      {/* Visit history */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('customers.visitHistory')}</h3>
          <span className="text-xs text-gray-500">{visits.length}</span>
        </div>
        {visits.length === 0 ? (
          <EmptyState icon={CalendarX} title={t('customers.noVisits')} />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {visits.map(v => (
              <div key={v.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <VisitResultBadge result={v.result} />
                  <span className="text-xs text-gray-400">{formatDateTime(v.visit_date)}</span>
                </div>
                {v.rejection_reason && (
                  <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{(v.rejection_reason as { reason_en: string })?.reason_en}</span>
                  </div>
                )}
                {v.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{v.notes}</p>}
                {v.next_follow_up && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 mt-1">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('visits.nextFollowUp')}: {formatDate(v.next_follow_up)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <VisitFormDialog open={visitOpen} onClose={() => setVisitOpen(false)} preselectedCustomerId={id} />
    </div>
  )
}

const PLATFORM_STYLES: Record<SocialPlatform, { bg: string; text: string; abbr: string }> = {
  facebook:  { bg: 'bg-blue-600',  text: 'text-white', abbr: 'Fb' },
  instagram: { bg: 'bg-pink-500',  text: 'text-white', abbr: 'Ig' },
  tiktok:    { bg: 'bg-gray-900',  text: 'text-white', abbr: 'Tt' },
  linkedin:  { bg: 'bg-blue-700',  text: 'text-white', abbr: 'Li' },
  website:   { bg: '', text: '', abbr: '' },
  custom:    { bg: '', text: '', abbr: '' },
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
    <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-200 dark:border-gray-700">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          {t('customers.workingHours')}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isOpenNow
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-600/60 dark:text-gray-400'
        }`}>
          {isOpenNow ? t('customers.openNow') : t('customers.closedNow')}
        </span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
        {DAYS.map(day => {
          const schedule = hours[day as DayKey]
          const isToday = day === todayKey
          return (
            <div
              key={day}
              className={`flex items-center justify-between px-3 py-2 text-xs ${
                isToday ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'
              }`}
            >
              <span className={`font-semibold w-8 shrink-0 ${
                isToday ? 'text-primary dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {t(`customers.days.${day}`)}
              </span>
              {schedule?.open ? (
                <span className={isToday ? 'text-primary dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-300'}>
                  {fmt12(schedule.from)} – {fmt12(schedule.to)}
                </span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 italic">{t('customers.closed')}</span>
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
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2">
        <img
          src={orderedImages[displayIdx]?.url}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {orderedImages[displayIdx]?.is_main && (
          <span className="absolute top-2 inset-s-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/90 text-yellow-900 text-xs font-semibold">
            <Star className="w-3 h-3 fill-yellow-900" />
            {t('customers.mainCover')}
          </span>
        )}
      </div>
      {orderedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {orderedImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                displayIdx === i
                  ? 'border-primary'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover bg-gray-100 dark:bg-gray-700"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              {img.is_main && (
                <span className="absolute bottom-0.5 inset-e-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 drop-shadow" />
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
    <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
      <p className="text-xs font-medium text-gray-500 mb-2">{t('customers.socialLinks')}</p>
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
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
