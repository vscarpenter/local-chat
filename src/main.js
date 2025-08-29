import { createApp } from 'vue'
import App from './App.vue'

// Import global styles
import './styles/main.css'

// Application configuration
const app = createApp(App)

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue application error:', error)
  console.error('Component instance:', instance)
  console.error('Error info:', info)
  
  // In production, you might want to send this to an error reporting service
  if (import.meta.env.PROD) {
    // Example: errorReportingService.captureException(error, { extra: { info } })
  }
}

// Global warning handler (development only)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('Vue warning:', msg)
    console.warn('Component trace:', trace)
  }
}

// Performance configuration
app.config.performance = import.meta.env.DEV

// Global properties (if needed)
app.config.globalProperties.$isDev = import.meta.env.DEV
app.config.globalProperties.$appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'

// Application metadata
const appMetadata = {
  name: 'ChatGPT at Home',
  version: '1.0.0',
  description: 'A local ChatGPT-like interface powered by Ollama',
  author: 'ChatGPT at Home Team',
  repository: 'https://github.com/anthropics/claude-code',
  buildTime: new Date().toISOString()
}

// Make metadata available globally
app.config.globalProperties.$app = appMetadata

// Development helpers
if (import.meta.env.DEV) {
  // Make app instance available globally for debugging
  window.__VUE_APP__ = app
  
  // Log app startup info
  console.log(`🚀 ${appMetadata.name} v${appMetadata.version}`)
  console.log('📦 Built with Vue 3 + Vite')
  console.log('🔧 Development mode enabled')
  console.log('🏠 Local AI chat interface')
  
  // Performance monitoring
  app.config.performance = true
  
  // Debug info
  console.log('Environment:', import.meta.env.MODE)
  console.log('Build time:', appMetadata.buildTime)
}

// Production optimizations
if (import.meta.env.PROD) {
  // Remove console logs in production
  if (!import.meta.env.VITE_KEEP_LOGS) {
    console.log = () => {}
    console.debug = () => {}
    console.info = () => {}
  }
  
  // Log minimal startup info
  console.log(`${appMetadata.name} v${appMetadata.version} - Ready`)
}

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Handle app lifecycle
document.addEventListener('DOMContentLoaded', () => {
  // App is about to mount
  if (import.meta.env.DEV) {
    console.log('🎯 Mounting Vue application...')
  }
})

// Handle visibility changes (optimize performance when tab is hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // App is now hidden - could pause non-critical operations
    if (import.meta.env.DEV) {
      console.log('📵 App hidden - pausing non-critical operations')
    }
  } else {
    // App is now visible - resume operations
    if (import.meta.env.DEV) {
      console.log('📱 App visible - resuming operations')
    }
  }
})

// Handle online/offline status
window.addEventListener('online', () => {
  if (import.meta.env.DEV) {
    console.log('🌐 App back online')
  }
})

window.addEventListener('offline', () => {
  if (import.meta.env.DEV) {
    console.log('📡 App offline')
  }
})

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  
  // Prevent the default browser behavior (logging to console)
  event.preventDefault()
  
  // In production, you might want to report this
  if (import.meta.env.PROD) {
    // Example: errorReportingService.captureException(event.reason)
  }
})

// Global error handling for runtime errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  
  // In production, you might want to report this
  if (import.meta.env.PROD) {
    // Example: errorReportingService.captureException(event.error)
  }
})

// Keyboard shortcuts for development
if (import.meta.env.DEV) {
  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + Shift + D for debug info
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
      event.preventDefault()
      console.group('🔍 Debug Information')
      console.log('App Metadata:', appMetadata)
      console.log('Environment:', import.meta.env)
      console.log('User Agent:', navigator.userAgent)
      console.log('Window Size:', { width: window.innerWidth, height: window.innerHeight })
      console.log('Theme:', document.documentElement.getAttribute('data-theme') || 'light')
      console.groupEnd()
    }
  })
}

// Mount the application
try {
  app.mount('#app')
  
  if (import.meta.env.DEV) {
    console.log('✅ Vue application mounted successfully')
  }
} catch (error) {
  console.error('❌ Failed to mount Vue application:', error)
  
  // Fallback error display
  const fallbackError = document.createElement('div')
  fallbackError.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #343a40;
    z-index: 9999;
  `
  
  fallbackError.innerHTML = `
    <div style="text-align: center; max-width: 500px; padding: 2rem;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
      <h1 style="margin-bottom: 1rem; font-size: 1.5rem;">Failed to Load Application</h1>
      <p style="margin-bottom: 2rem; color: #6c757d;">
        There was an error loading ChatGPT at Home. Please refresh the page or check the browser console for more details.
      </p>
      <button onclick="window.location.reload()" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 1rem;
      ">
        Reload Page
      </button>
    </div>
  `
  
  document.body.appendChild(fallbackError)
}