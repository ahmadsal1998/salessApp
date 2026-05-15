import type { CustomerStatus, VisitResult } from '@/types/app.types'

export const statusColors: Record<CustomerStatus, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  visited: 'bg-purple-100 text-purple-800 border-purple-200',
  interested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  follow_up: 'bg-orange-100 text-orange-800 border-orange-200',
}

export const statusMapColors: Record<CustomerStatus, string> = {
  new: '#3b82f6',
  visited: '#a855f7',
  interested: '#eab308',
  approved: '#22c55e',
  rejected: '#ef4444',
  follow_up: '#f97316',
}

export const visitResultColors: Record<VisitResult, string> = {
  approved: 'bg-green-100 text-green-800 border-green-200',
  interested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  follow_up: 'bg-orange-100 text-orange-800 border-orange-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}
