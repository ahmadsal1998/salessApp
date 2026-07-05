import { useTranslation } from 'react-i18next'
import { Copy } from 'lucide-react'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Button'
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
  `flex-1 min-w-0 text-xs py-1.5 px-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-ring transition-colors appearance-none ${
    error
      ? 'border-destructive/40 bg-destructive/5 text-destructive'
      : 'border-input bg-card text-foreground'
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
      <p className="text-sm font-medium text-foreground mb-2">
        {t('customers.workingHours')}
      </p>

      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {DAYS.map(day => {
          const { open, from, to } = value[day]
          const timeError = open && to <= from
          return (
            <div
              key={day}
              className={`px-3 transition-colors ${
                open ? 'py-2.5 bg-card' : 'py-2 bg-muted'
              }`}
            >
              {/* Row 1: day name + open/closed toggle */}
              <div className="flex items-center gap-2.5">
                <span className={`w-8 text-xs font-semibold shrink-0 ${
                  open ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {t(`customers.days.${day}`)}
                </span>

                <Switch
                  checked={open}
                  onCheckedChange={(checked) => updateDay(day, { open: checked })}
                  aria-label={t(`customers.days.${day}`)}
                />

                <span className={`text-xs ${open ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
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

                  <span className="text-muted-foreground shrink-0 select-none">–</span>

                  <select
                    value={to}
                    onChange={e => updateDay(day, { to: e.target.value })}
                    className={selectClass(timeError)}
                  >
                    {TIME_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copyToAll(day)}
                    title={t('customers.copyToAll')}
                    className="shrink-0 text-muted-foreground hover:text-primary"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hasError && (
        <p className="text-destructive text-xs mt-1.5">{t('customers.invalidTimeRange')}</p>
      )}
    </div>
  )
}
