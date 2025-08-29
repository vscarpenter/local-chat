<template>
  <div id="app" class="app-root">
    <!-- Global Error Boundary -->
    <div v-if="hasGlobalError" class="global-error">
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <h2 class="error-title">Something went wrong</h2>
          <p class="error-message">{{ globalError.message }}</p>
          <div class="error-actions">
            <button class="btn btn-primary" @click="reloadApp">
              Reload Application
            </button>
            <button class="btn btn-secondary" @click="reportError">
              Report Issue
            </button>
          </div>
          <details class="error-details" v-if="isDevelopment">
            <summary>Technical Details</summary>
            <pre class="error-stack">{{ globalError.stack }}</pre>
          </details>
        </div>
      </div>
    </div>

    <!-- Main Application -->
    <div v-else class="app-content">
      <ChatContainer />
    </div>

    <!-- Loading Overlay (for app initialization) -->
    <Transition name="loading">
      <div v-if="isInitializing" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner-large"></div>
          <h2 class="loading-title">ChatGPT at Home</h2>
          <p class="loading-message">{{ loadingMessage }}</p>
        </div>
      </div>
    </Transition>

    <!-- Offline Indicator -->
    <Transition name="offline">
      <div v-if="isOffline" class="offline-indicator">
        <div class="offline-content">
          <span class="offline-icon">📡</span>
          <span class="offline-text">You're offline</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onErrorCaptured, onBeforeUnmount } from 'vue'
import ChatContainer from './components/ChatContainer.vue'

const isInitializing = ref(true)
const loadingMessage = ref('Initializing application...')
const hasGlobalError = ref(false)
const globalError = ref(null)
const isOffline = ref(!navigator.onLine)

const isDevelopment = computed(() => {
  return import.meta.env.MODE === 'development'
})

async function initializeApp() {
  try {
    loadingMessage.value = 'Setting up theme...'
    await new Promise(resolve => setTimeout(resolve, 100))

    loadingMessage.value = 'Loading components...'
    await new Promise(resolve => setTimeout(resolve, 200))

    loadingMessage.value = 'Checking Ollama connection...'
    await new Promise(resolve => setTimeout(resolve, 300))

    loadingMessage.value = 'Ready!'
    await new Promise(resolve => setTimeout(resolve, 200))

  } catch (error) {
    console.error('Failed to initialize app:', error)
    handleError(error)
  } finally {
    isInitializing.value = false
  }
}

function handleError(error) {
  console.error('Global error caught:', error)
  globalError.value = {
    message: error.message || 'An unexpected error occurred',
    stack: error.stack || '',
    timestamp: new Date().toISOString()
  }
  hasGlobalError.value = true
}

function reloadApp() {
  window.location.reload()
}

function reportError() {
  const errorInfo = {
    message: globalError.value.message,
    stack: globalError.value.stack,
    timestamp: globalError.value.timestamp,
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  const body = `**Error Report**

**Message:** ${errorInfo.message}

**Timestamp:** ${errorInfo.timestamp}

**User Agent:** ${errorInfo.userAgent}

**URL:** ${errorInfo.url}

**Stack Trace:**
\`\`\`
${errorInfo.stack}
\`\`\`

**Additional Context:**
Please describe what you were doing when this error occurred.
`

  const githubIssueUrl = `https://github.com/anthropics/claude-code/issues/new?title=${encodeURIComponent('ChatGPT at Home Error: ' + errorInfo.message)}&body=${encodeURIComponent(body)}`
  
  window.open(githubIssueUrl, '_blank')
}

function handleOnline() {
  isOffline.value = false
}

function handleOffline() {
  isOffline.value = true
}

function handleUnhandledRejection(event) {
  console.error('Unhandled promise rejection:', event.reason)
  if (!hasGlobalError.value) {
    handleError(new Error(`Unhandled promise rejection: ${event.reason}`))
  }
  event.preventDefault()
}

function handleGlobalError(event) {
  console.error('Global error:', event.error)
  if (!hasGlobalError.value) {
    handleError(event.error)
  }
  event.preventDefault()
}

onErrorCaptured((error, instance, info) => {
  console.error('Vue error captured:', error, info)
  if (!hasGlobalError.value) {
    handleError(new Error(`Vue component error: ${error.message}\nComponent: ${info}`))
  }
  return false
})

onMounted(async () => {
  // Set up global error handlers
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  
  // Set up network status handlers
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Initialize the application
  await initializeApp()
})

onBeforeUnmount(() => {
  window.removeEventListener('error', handleGlobalError)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
.app-root {
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.app-content {
  height: 100%;
  width: 100%;
}

/* Global Error */
.global-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: var(--space-4);
  background-color: var(--bg-primary);
}

.error-container {
  max-width: 600px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
}

.error-icon {
  font-size: 4rem;
  opacity: 0.7;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.error-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.error-message {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.error-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

.error-details {
  width: 100%;
  max-width: 500px;
  margin-top: var(--space-6);
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  padding: var(--space-2);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.error-stack {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  text-align: center;
}

.loading-spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid var(--bg-tertiary);
  border-top: 4px solid var(--bg-button);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.loading-message {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Offline Indicator */
.offline-indicator {
  position: fixed;
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  z-index: 90;
}

.offline-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-4);
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.offline-icon {
  font-size: 1rem;
}

.offline-text {
  font-weight: var(--font-weight-medium);
}

/* Transitions */
.loading-enter-active,
.loading-leave-active {
  transition: opacity 0.3s ease;
}

.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}

.offline-enter-active,
.offline-leave-active {
  transition: all 0.3s ease;
  transform-origin: center bottom;
}

.offline-enter-from,
.offline-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.95);
}

/* Responsive Design */
@media (max-width: 768px) {
  .error-container {
    padding: var(--space-3);
  }

  .error-icon {
    font-size: 3rem;
  }

  .error-title {
    font-size: var(--font-size-xl);
  }

  .error-message {
    font-size: var(--font-size-base);
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .error-actions .btn {
    width: 100%;
  }

  .loading-spinner-large {
    width: 40px;
    height: 40px;
    border-width: 3px;
  }

  .loading-title {
    font-size: var(--font-size-xl);
  }

  .offline-indicator {
    left: var(--space-3);
    right: var(--space-3);
    transform: none;
  }
}

@media (max-width: 480px) {
  .error-container {
    gap: var(--space-4);
  }

  .error-content {
    gap: var(--space-3);
  }

  .loading-content {
    gap: var(--space-4);
    padding: var(--space-4);
  }

  .error-stack {
    font-size: var(--font-size-xs);
    padding: var(--space-3);
  }
}

/* Print styles */
@media print {
  .loading-overlay,
  .offline-indicator,
  .global-error {
    display: none !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .loading-spinner-large {
    border-width: 6px;
  }
  
  .offline-content {
    border-width: 2px;
  }
  
  .error-details summary {
    border: 2px solid var(--border-primary);
  }
}

/* Dark mode specific adjustments */
[data-theme="dark"] .loading-overlay {
  background-color: var(--bg-primary);
}

[data-theme="dark"] .offline-content {
  background-color: rgba(45, 45, 45, 0.95);
  backdrop-filter: blur(8px);
}

/* Animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Focus management */
.error-actions .btn:focus,
.error-details summary:focus {
  outline: 2px solid var(--border-input-focus);
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner-large {
    animation: none;
    border-top-color: var(--bg-button);
  }
  
  .loading-enter-active,
  .loading-leave-active,
  .offline-enter-active,
  .offline-leave-active {
    transition: none;
  }
}
</style>