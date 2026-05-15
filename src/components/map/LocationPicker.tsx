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
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('customers.pickLocation')}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X className="w-3 h-3" />
              {t('common.clear')}
            </button>
          )}
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={locating}
            className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
              'border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-60'
            )}
          >
            <Navigation className="w-3 h-3" />
            {locating ? t('map.locating') : t('map.currentLocation')}
          </button>
        </div>
      </div>

      {locationError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-700 dark:text-amber-400">{locationError}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">
              {t('map.clickToSetManually')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={locating}
            className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 shrink-0 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {t('map.retry')}
          </button>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height }}>
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
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {t('customers.locationSet')}: {value.lat}, {value.lng}
        </p>
      ) : (
        <p className="text-xs text-gray-400">{t('map.clickMarker')}</p>
      )}
    </div>
  )
}
