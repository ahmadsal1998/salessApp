import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Auto-update service worker silently in the background
registerSW({
  onNeedRefresh() {
    // New content is available; reload to activate
    window.location.reload()
  },
  onOfflineReady() {
    console.info('App ready to work offline')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
