import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/types/app.types'
import { statusMapColors } from '@/utils/status'
import { Navigation } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// Fix default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createColoredIcon(color: string) {
  return L.divIcon({
    html: `
      <div style="
        width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
      "></div>
    `,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

function FitBounds({ customers }: { customers: Customer[] }) {
  const map = useMap()
  if (customers.length === 0) return null
  const valid = customers.filter(c => c.latitude && c.longitude)
  if (valid.length === 0) return null
  const bounds = L.latLngBounds(valid.map(c => [c.latitude!, c.longitude!]))
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  return null
}

interface Props {
  customers: Customer[]
  adminView?: boolean
  height?: string
}

export default function CustomerMap({ customers, adminView = true, height = '100%' }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const withLocation = customers.filter(c => c.latitude && c.longitude)

  function openInMaps(lat: number, lng: number) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={[24.7136, 46.6753]}
        zoom={10}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds customers={withLocation} />
        {withLocation.map((c) => (
          <Marker
            key={c.id}
            position={[c.latitude!, c.longitude!]}
            icon={createColoredIcon(statusMapColors[c.status])}
          >
            <Popup>
              <div className="min-w-48">
                <p className="font-semibold text-foreground">{c.business_name}</p>
                <p className="text-sm text-muted-foreground">{c.owner_name}</p>
                <p className="text-sm text-muted-foreground">{c.phone}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={() => openInMaps(c.latitude!, c.longitude!)}>
                    <Navigation className="size-3" />
                    {t('customers.navigateToLocation')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => navigate(adminView ? `/customers/${c.id}` : `/my-customers/${c.id}`)}
                  >
                    {t('common.view')}
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
