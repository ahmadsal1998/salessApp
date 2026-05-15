import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarOpen: boolean
  language: 'en' | 'ar'
  darkMode: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setLanguage: (lang: 'en' | 'ar') => void
  toggleDarkMode: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      language: 'en',
      darkMode: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setLanguage: (language) => set({ language }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    { name: 'baraka-ui' }
  )
)
