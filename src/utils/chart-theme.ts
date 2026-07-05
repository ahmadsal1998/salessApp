import { useEffect, useState } from 'react'
import { useUiStore } from '@/store/ui.store'

export interface ChartTheme {
  colors: string[]
  grid: string
  axis: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
}

const EMPTY_THEME: ChartTheme = { colors: [], grid: '', axis: '', tooltipBg: '', tooltipBorder: '', tooltipText: '' }

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function computeChartTheme(): ChartTheme {
  return {
    colors: [1, 2, 3, 4, 5].map((i) => readVar(`--color-chart-${i}`)),
    grid: readVar('--color-border'),
    axis: readVar('--color-muted-foreground'),
    tooltipBg: readVar('--color-popover'),
    tooltipBorder: readVar('--color-border'),
    tooltipText: readVar('--color-popover-foreground'),
  }
}

/**
 * Reads chart colors from the CSS theme tokens so Recharts (which needs raw
 * color strings, not Tailwind classes) stays in sync with light/dark mode.
 */
export function useChartTheme(): ChartTheme {
  const { darkMode } = useUiStore()
  const [theme, setTheme] = useState<ChartTheme>(() => (typeof document !== 'undefined' ? computeChartTheme() : EMPTY_THEME))

  useEffect(() => {
    // The `.dark` class is toggled by AppShell's own effect; defer one frame
    // so the CSS custom properties have already updated before we re-read them.
    const id = requestAnimationFrame(() => setTheme(computeChartTheme()))
    return () => cancelAnimationFrame(id)
  }, [darkMode])

  return theme
}
