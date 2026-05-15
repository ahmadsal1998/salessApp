import { useTranslation } from 'react-i18next'
import { Copy } from 'lucide-react'
import type { WorkingHours, DayKey, DaySchedule } from '@/types/app.types'

export const DAYS: DayKey[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
]

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  sunday:    { open: false, from: '09:00', to: '18:00' },
  monday:    { open: true,  from: '09:00', to: '18:00' },
  tuesday:   { open: true,  from: '09:00', to: '18:00' },
  wednesday: { open: true,  from: '09:00', to: '18:00' },
  thursday:  { open: true,  from: '09:00', to: '18:00' },
  friday:    { open: false, from: '09:00', to: '18:00' },
  saturday:  { open: false, from: '09:00', to: '18:00' },
}

// 30-min slots 00:00–23:30, stored and displayed as 24h "HH:MM"
const TIME_OPTIONS: { value: string; label: string }[] = (() => {
  const opts: { value: string; label: string }[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      opts.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` })
    }
  }
  return opts
})()

interface Props {
  value: WorkingHours
  onChange: (v: WorkingHours) => void
}

const selectClass = (error: boolean) =>
  `flex-1 min-w-0 text-xs py-1.5 px-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none ${
    error
      ? 'border-red-300 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'
      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
  }`

export default function WorkingHoursInput({ value, onChange }: Props) {
  const { t } = useTranslation()

  function updateDay(day: DayKey, patch: Partial<DaySchedule>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } })
  }

  function copyToAll(sourcDay: DayKey) {
    const { from, to } = value[sourcDay]
    const updated = { ...value }
    DAYS.forEach(d => { updated[d] = { ...updated[d], from, to } })
    onChange(updated)
  }

  const hasError = DAYS.some(d => value[d].open && value[d].to <= value[d].from)

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('customers.workingHours')}
      </p>

      <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">
        {DAYS.map(day => {
          const { open, from, to } = value[day]
          const timeError = open && to <= from
          return (
            <div
              key={day}
              className={`px-3 transition-colors ${
                open ? 'py-2.5 bg-white dark:bg-gray-800' : 'py-2 bg-gray-50/70 dark:bg-gray-800/40'
              }`}
            >
              {/* Row 1: day name + open/closed toggle */}
              <div className="flex items-center gap-2.5">
                <span className={`w-8 text-xs font-semibold shrink-0 ${
                  open ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {t(`customers.days.${day}`)}
                </span>

                <button
                  type="button"
                  onClick={() => updateDay(day, { open: !open })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors focus:outline-none ${
                    open ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                  aria-pressed={open}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    open ? 'translate-x-6 rtl:-translate-x-6 rtl:translate-x-1' : 'translate-x-1'
                  }`} />
                </button>

                <span className={`text-xs ${open ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                  {open ? t('customers.open') : t('customers.closed')}
                </span>
              </div>

              {/* Row 2: time pickers (visible when open) */}
              {open && (
                <div className="flex items-center gap-2 mt-2 ps-[42px]">
                  <select
                    value={from}
                    onChange={e => updateDay(day, { from: e.target.value })}
                    className={selectClass(timeError)}
                  >
                    {TIME_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  <span className="text-gray-300 dark:text-gray-600 shrink-0 select-none">–</span>

                  <select
                    value={to}
                    onChange={e => updateDay(day, { to: e.target.value })}
                    className={selectClass(timeError)}
                  >
                    {TIME_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => copyToAll(day)}
                    title={t('customers.copyToAll')}
                    className="shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hasError && (
        <p className="text-red-500 text-xs mt-1.5">{t('customers.invalidTimeRange')}</p>
      )}
    </div>
  )
}
