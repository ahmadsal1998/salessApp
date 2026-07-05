import { Globe, Link as LinkIcon } from 'lucide-react'
import type { SocialPlatform } from '@/types/app.types'

export const PLATFORM_STYLES: Record<SocialPlatform, { bg: string; text: string; abbr: string }> = {
  facebook: { bg: 'bg-blue-600', text: 'text-white', abbr: 'Fb' },
  instagram: { bg: 'bg-pink-500', text: 'text-white', abbr: 'Ig' },
  tiktok: { bg: 'bg-gray-900', text: 'text-white', abbr: 'Tt' },
  linkedin: { bg: 'bg-blue-700', text: 'text-white', abbr: 'Li' },
  website: { bg: 'bg-muted', text: 'text-muted-foreground', abbr: '' },
  custom: { bg: 'bg-muted', text: 'text-muted-foreground', abbr: '' },
}

export function PlatformIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === 'website') return <Globe className="size-4 text-muted-foreground" />
  if (platform === 'custom') return <LinkIcon className="size-4 text-muted-foreground" />
  const { bg, text, abbr } = PLATFORM_STYLES[platform]
  return (
    <span className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold ${bg} ${text}`}>
      {abbr}
    </span>
  )
}
