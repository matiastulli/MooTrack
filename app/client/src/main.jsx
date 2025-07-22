import { initializeTheme, setupSystemPreferenceListener } from '@/lib/themeUtils.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

// Initialize theme before rendering
initializeTheme();
setupSystemPreferenceListener();

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="min-w-[320px] w-full">
      <App />
    </div>
  </React.StrictMode>,
)