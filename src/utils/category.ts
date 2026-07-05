import type { TFunction } from 'i18next'

export const STATIC_CATEGORIES = [
  'retail', 'restaurant', 'services', 'healthcare', 'education', 'technology', 'manufacturing', 'other',
] as const

export function getCategoryLabel(category: string | null | undefined, t: TFunction): string | null {
  if (!category) return null
  return (STATIC_CATEGORIES as readonly string[]).includes(category)
    ? t(`customers.categories.${category}`)
    : category
}
