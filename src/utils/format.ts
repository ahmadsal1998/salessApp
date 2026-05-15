import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

export function formatDate(date: string | Date | null | undefined, locale = 'en'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, 'dd MMM yyyy', { locale: locale === 'ar' ? ar : enUS })
}

export function formatDateTime(date: string | Date | null | undefined, locale = 'en'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, 'dd MMM yyyy, HH:mm', { locale: locale === 'ar' ? ar : enUS })
}

export function formatRelative(date: string | Date | null | undefined, locale = 'en'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: locale === 'ar' ? ar : enUS })
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
