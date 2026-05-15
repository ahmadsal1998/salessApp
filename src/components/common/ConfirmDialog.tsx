import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  danger?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
  danger = true,
}: Props) {
  const { t } = useTranslation()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
        <div className="flex items-start gap-4">
          {danger && (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 flex items-center gap-2 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-blue-700'
            }`}
          >
            {loading && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
