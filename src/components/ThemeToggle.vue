<template>
  <button
    class="theme-toggle"
    :class="{ 'is-dark': isDark }"
    @click="toggleTheme"
    :title="toggleTitle"
    :aria-label="toggleAriaLabel"
    :aria-pressed="isDark"
    role="switch"
  >
    <div class="toggle-track">
      <div class="toggle-thumb">
        <div class="icon-container">
          <Transition name="icon" mode="out-in">
            <div v-if="isDark" key="moon" class="theme-icon moon-icon">
              🌙
            </div>
            <div v-else key="sun" class="theme-icon sun-icon">
              ☀️
            </div>
          </Transition>
        </div>
      </div>
    </div>
    <span class="toggle-label">{{ toggleLabel }}</span>
  </button>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const STORAGE_KEY = 'chatgpt-at-home-theme'

const props = defineProps({
  showLabel: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'md',
    validator: value => ['sm', 'md', 'lg'].includes(value)
  }
})

const emit = defineEmits(['change'])

const isDark = ref(false)
const isTransitioning = ref(false)

const toggleTitle = computed(() => {
  return `Switch to ${isDark.value ? 'light' : 'dark'} theme`
})

const toggleAriaLabel = computed(() => {
  return `${isDark.value ? 'Disable' : 'Enable'} dark theme`
})

const toggleLabel = computed(() => {
  if (!props.showLabel) return ''
  return isDark.value ? 'Dark' : 'Light'
})

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme() {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

function setStoredTheme(theme) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme)
  }
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
    isDark.value = true
  } else {
    root.setAttribute('data-theme', 'light')
    isDark.value = false
  }
  
  // Add transition class for smooth theme switching
  root.classList.add('theme-transitioning')
  setTimeout(() => {
    root.classList.remove('theme-transitioning')
  }, 300)
}

function initializeTheme() {
  const storedTheme = getStoredTheme()
  
  if (storedTheme) {
    applyTheme(storedTheme)
  } else {
    // Use system preference if no stored theme
    const systemTheme = getSystemTheme()
    applyTheme(systemTheme)
    setStoredTheme(systemTheme)
  }
}

function toggleTheme() {
  if (isTransitioning.value) return
  
  isTransitioning.value = true
  const newTheme = isDark.value ? 'light' : 'dark'
  
  applyTheme(newTheme)
  setStoredTheme(newTheme)
  
  emit('change', {
    theme: newTheme,
    isDark: newTheme === 'dark'
  })
  
  // Prevent rapid toggling
  setTimeout(() => {
    isTransitioning.value = false
  }, 150)
}

function handleSystemThemeChange() {
  // Only respond to system theme changes if user hasn't manually set a preference
  const storedTheme = getStoredTheme()
  if (!storedTheme) {
    const systemTheme = getSystemTheme()
    applyTheme(systemTheme)
  }
}

onMounted(() => {
  initializeTheme()
  
  // Listen for system theme changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } 
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange)
    }
    
    // Cleanup function
    onBeforeUnmount(() => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleSystemThemeChange)
      }
    })
  }
})

// Watch for external theme changes
watch(() => isDark.value, (newValue) => {
  emit('change', {
    theme: newValue ? 'dark' : 'light',
    isDark: newValue
  })
})

defineExpose({
  isDark,
  toggleTheme,
  setTheme: applyTheme,
  getTheme: () => isDark.value ? 'dark' : 'light'
})
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  user-select: none;
  font-family: inherit;
  color: var(--text-primary);
}

.theme-toggle:hover {
  background-color: var(--bg-secondary);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--border-input-focus);
  outline-offset: 2px;
}

.theme-toggle:active .toggle-thumb {
  transform: scale(0.95);
}

.toggle-track {
  position: relative;
  width: 52px;
  height: 28px;
  background-color: var(--bg-tertiary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-full);
  transition: all var(--transition-normal);
  overflow: hidden;
}

.theme-toggle.is-dark .toggle-track {
  background-color: var(--bg-button);
  border-color: var(--bg-button);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: var(--bg-primary);
  border-radius: var(--radius-full);
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.theme-toggle.is-dark .toggle-thumb {
  transform: translateX(24px);
  background-color: var(--bg-primary);
}

.icon-container {
  position: relative;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-icon {
  position: absolute;
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sun-icon {
  filter: brightness(1.2);
}

.moon-icon {
  filter: brightness(0.9);
}

.toggle-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  min-width: 32px;
  text-align: left;
}

/* Size variants */
.theme-toggle.size-sm .toggle-track {
  width: 44px;
  height: 24px;
}

.theme-toggle.size-sm .toggle-thumb {
  width: 16px;
  height: 16px;
}

.theme-toggle.size-sm.is-dark .toggle-thumb {
  transform: translateX(20px);
}

.theme-toggle.size-sm .theme-icon {
  font-size: 8px;
}

.theme-toggle.size-sm .toggle-label {
  font-size: var(--font-size-xs);
  min-width: 28px;
}

.theme-toggle.size-lg .toggle-track {
  width: 60px;
  height: 32px;
}

.theme-toggle.size-lg .toggle-thumb {
  width: 24px;
  height: 24px;
}

.theme-toggle.size-lg.is-dark .toggle-thumb {
  transform: translateX(28px);
}

.theme-toggle.size-lg .theme-icon {
  font-size: 12px;
}

.theme-toggle.size-lg .toggle-label {
  font-size: var(--font-size-base);
  min-width: 36px;
}

/* Icon transitions */
.icon-enter-active,
.icon-leave-active {
  transition: all 0.2s ease;
}

.icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .toggle-label {
    display: none;
  }
  
  .theme-toggle {
    gap: 0;
    padding: var(--space-1);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .toggle-track {
    border-width: 3px;
  }
  
  .toggle-thumb {
    border: 2px solid var(--border-primary);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .toggle-track,
  .toggle-thumb,
  .icon-enter-active,
  .icon-leave-active {
    transition: none;
  }
  
  .theme-toggle:active .toggle-thumb {
    transform: none;
  }
  
  .theme-toggle.is-dark .toggle-thumb {
    transform: translateX(24px);
  }
}

/* Theme transition for smooth switching */
:root.theme-transitioning,
:root.theme-transitioning * {
  transition: background-color var(--transition-normal), 
              color var(--transition-normal), 
              border-color var(--transition-normal), 
              box-shadow var(--transition-normal) !important;
}

/* Focus indicators */
.theme-toggle:focus-visible .toggle-track {
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.2);
}

/* Accessibility improvements */
.theme-toggle[aria-pressed="true"] .toggle-track {
  background-color: var(--bg-button);
}

.theme-toggle[aria-pressed="false"] .toggle-track {
  background-color: var(--bg-tertiary);
}

/* Print styles */
@media print {
  .theme-toggle {
    display: none !important;
  }
}
</style>