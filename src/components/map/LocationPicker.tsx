import { useState, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'
import { MapPin, Navigation, X, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LatLng {
  lat: number
  lng: number
}

interface Props {
  value?: LatLng | null
  onChange: (loc: LatLng | null) => void
  height?: string
}

function MapClickHandler({ onLocationPick }: { onLocationPick: (loc: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onLocationPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function MapCenterUpdater({ target }: { target: LatLng | null | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.setView([target.lat, target.lng], Math.max(map.getZoom(), 14), { animate: true })
    }
  }, [target?.lat, target?.lng, map])
  return null
}

export default function LocationPicker({ value, onChange, height = '300px' }: Props) {
  const { t } = useTranslation()
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const defaultCenter: [number, number] = value
    ? [value.lat, value.lng]
    : [24.7136, 46.6753] // Riyadh as default

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('map.locationUnavailable'))
      return
    }
    setLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        setLocationError(null)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(t('map.locationPermissionDenied'))
        } else if (err.code === err.TIMEOUT) {
          setLocationError(t('map.locationTimeout'))
        } else {
          // POSITION_UNAVAILABLE — covers kCLErrorLocationUnknown and similar
          setLocationError(t('map.locationErrorUnknown'))
        }
      },
      {
        timeout: 12000,
        maximumAge: 0,
        enableHighAccuracy: true,
      }
    )
  }, [onChange, t])

  const handleMapPick = useCallback((loc: LatLng) => {
    onChange(loc)
    setLocationError(null)
  }, [onChange])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {t('customers.pickLocation')}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80"
            >
              <X className="size-3" />
              {t('common.clear')}
            </button>
          )}
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={locating}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
              'border-primary text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-60'
            )}
          >
            <Navigation className="size-3" />
            {locating ? t('map.locating') : t('map.currentLocation')}
          </button>
        </div>
      </div>

      {locationError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-amber-700 dark:text-amber-400">{locationError}</p>
            <p className="mt-0.5 text-xs text-amber-600/70 dark:text-amber-500/70">
              {t('map.clickToSetManually')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={locating}
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600 transition-colors hover:text-amber-800 disabled:opacity-50 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <RefreshCw className="size-3" />
            {t('map.retry')}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={value ? 14 : 12}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapCenterUpdater target={value} />
          <MapClickHandler onLocationPick={handleMapPick} />
          {value && <Marker position={[value.lat, value.lng]} />}
        </MapContainer>
      </div>

      {value ? (
        <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <MapPin className="size-3" />
          {t('customers.locationSet')}: {value.lat}, {value.lng}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{t('map.clickMarker')}</p>
      )}
    </div>
  )
}
