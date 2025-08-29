<template>
  <div class="message-list-container">
    <div
      ref="scrollContainer"
      class="message-list"
      :class="{ 'scroll-locked': isScrollLocked }"
      @scroll="handleScroll"
    >
      <div class="messages-content">
        <!-- Welcome message when no messages exist -->
        <div v-if="!hasMessages && !isGenerating" class="welcome-message">
          <div class="welcome-icon">💬</div>
          <h2 class="welcome-title">Welcome to ChatGPT at Home</h2>
          <p class="welcome-text">
            Start a conversation with your local AI assistant powered by Ollama.
            Your conversations are private and stored locally on your device.
          </p>
          <div class="welcome-tips">
            <h3>Quick tips:</h3>
            <ul>
              <li>Ask questions about any topic</li>
              <li>Request code examples or explanations</li>
              <li>Get help with writing and creativity</li>
              <li>All conversations stay on your device</li>
            </ul>
          </div>

          <!-- Inline input slot for first-message UX -->
          <div class="welcome-input">
            <slot name="welcome-input"></slot>
          </div>
        </div>

        <!-- Connection status -->
        <div v-if="connectionError" class="connection-error">
          <div class="error-icon">⚠️</div>
          <div class="error-content">
            <h3>Connection Issue</h3>
            <p>{{ connectionError }}</p>
            <button 
              class="btn btn-primary btn-sm"
              @click="$emit('retry-connection')"
              :disabled="isConnecting"
            >
              <span v-if="isConnecting" class="loading-spinner"></span>
              {{ isConnecting ? 'Connecting...' : 'Retry Connection' }}
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div v-if="hasMessages" class="messages">
          <TransitionGroup
            name="message"
            tag="div"
            class="message-group"
            appear
          >
            <MessageBubble
              v-for="message in messages"
              :key="message.id"
              :message="message"
              @edit="$emit('edit-message', $event)"
              @delete="$emit('delete-message', $event)"
              @copy="handleMessageCopy"
            />
          </TransitionGroup>
        </div>

        <!-- Scroll to bottom button -->
        <Transition name="scroll-button">
          <button
            v-if="showScrollButton"
            class="scroll-to-bottom btn btn-secondary"
            @click="scrollToBottom"
            title="Scroll to bottom"
            aria-label="Scroll to bottom of conversation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="7,13 12,18 17,13"></polyline>
              <polyline points="7,6 12,11 17,6"></polyline>
            </svg>
          </button>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import MessageBubble from './MessageBubble.vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  isGenerating: {
    type: Boolean,
    default: false
  },
  connectionError: {
    type: String,
    default: null
  },
  isConnecting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'edit-message',
  'delete-message', 
  'retry-connection'
])

const scrollContainer = ref(null)
const isScrollLocked = ref(false)
const showScrollButton = ref(false)
const isNearBottom = ref(true)
const autoScrollEnabled = ref(true)
const scrollTimeout = ref(null)

const hasMessages = computed(() => props.messages && props.messages.length > 0)

let lastMessageCount = 0
let observer = null

onMounted(() => {
  lastMessageCount = props.messages.length
  setupIntersectionObserver()
  nextTick(() => scrollToBottom(false))
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
  }
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
})

function setupIntersectionObserver() {
  if (!scrollContainer.value) return

  const sentinel = document.createElement('div')
  sentinel.style.height = '1px'
  sentinel.className = 'scroll-sentinel'
  scrollContainer.value.appendChild(sentinel)

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      isNearBottom.value = entry.isIntersecting
      showScrollButton.value = !entry.isIntersecting && hasMessages.value
    },
    {
      root: scrollContainer.value,
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }
  )

  observer.observe(sentinel)
}

function handleScroll(event) {
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }

  scrollTimeout.value = setTimeout(() => {
    const container = event.target
    const { scrollTop, scrollHeight, clientHeight } = container
    
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10
    const isAtTop = scrollTop < 50

    if (isAtBottom) {
      isNearBottom.value = true
      showScrollButton.value = false
      autoScrollEnabled.value = true
    } else if (!isAtTop) {
      autoScrollEnabled.value = false
    }
  }, 100)
}

function scrollToBottom(smooth = true) {
  if (!scrollContainer.value) return

  const container = scrollContainer.value
  
  if (smooth && 'scrollBehavior' in document.documentElement.style) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    })
  } else {
    container.scrollTop = container.scrollHeight
  }

  isNearBottom.value = true
  showScrollButton.value = false
  autoScrollEnabled.value = true
}

function handleMessageCopy(message) {
  console.log('Message copied:', message.content.slice(0, 50) + '...')
}

watch(
  () => props.messages.length,
  (newCount) => {
    if (newCount > lastMessageCount && autoScrollEnabled.value) {
      nextTick(() => {
        scrollToBottom()
      })
    }
    lastMessageCount = newCount
  }
)

watch(
  () => props.isGenerating,
  (isGenerating) => {
    if (isGenerating && autoScrollEnabled.value) {
      nextTick(() => scrollToBottom())
    }
  }
)

const scrollToBottomOnUpdate = () => {
  if (autoScrollEnabled.value && isNearBottom.value) {
    nextTick(() => scrollToBottom(false))
  }
}

watch(
  () => props.messages.map(m => m.content).join(''),
  scrollToBottomOnUpdate,
  { flush: 'post' }
)
</script>

<style scoped>
.message-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-4);
  scroll-behavior: smooth;
  position: relative;
}

.message-list.scroll-locked {
  overflow: hidden;
}

.messages-content {
  max-width: var(--max-width-chat);
  margin: 0 auto;
  position: relative;
}

/* Welcome Message */
.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) var(--space-4);
  min-height: 60vh;
}

.welcome-icon {
  font-size: 4rem;
  margin-bottom: var(--space-6);
  opacity: 0.7;
}

.welcome-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.welcome-text {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
  max-width: 500px;
  line-height: var(--line-height-relaxed);
}

.welcome-tips {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  max-width: 400px;
  text-align: left;
}

.welcome-tips h3 {
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.welcome-tips ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.welcome-tips li {
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  position: relative;
  padding-left: var(--space-6);
  font-size: var(--font-size-sm);
}

.welcome-tips li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--bg-button);
  font-weight: bold;
}

.welcome-input {
  width: 100%;
  max-width: var(--max-width-chat);
  margin-top: var(--space-6);
}

/* Connection Error */
.connection-error {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-6);
  margin: var(--space-4) 0;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  border-left: 4px solid #ef4444;
}

.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-content h3 {
  color: var(--text-primary);
  margin-bottom: var(--space-2);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.error-content p {
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: var(--space-2);
}

/* Messages */
.messages {
  padding-bottom: var(--space-4);
}

.message-group {
  display: flex;
  flex-direction: column;
}

/* Scroll to bottom button */
.scroll-to-bottom {
  position: fixed;
  bottom: calc(var(--input-height) + var(--space-4));
  right: var(--space-6);
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  z-index: 10;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-fast);
}

[data-theme="dark"] .scroll-to-bottom {
  background-color: rgba(45, 45, 45, 0.9);
}

.scroll-to-bottom:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), 0 0 0 4px rgba(16, 163, 127, 0.1);
}

/* Transitions */
.message-enter-active {
  transition: all 0.3s ease-out;
}

.message-leave-active {
  transition: all 0.2s ease-in;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.message-move {
  transition: transform 0.3s ease;
}

.scroll-button-enter-active,
.scroll-button-leave-active {
  transition: all 0.3s ease;
}

.scroll-button-enter-from,
.scroll-button-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

/* Responsive Design */
@media (max-width: 768px) {
  .message-list {
    padding: var(--space-3) var(--space-3);
  }

  .welcome-message {
    padding: var(--space-8) var(--space-3);
    min-height: 50vh;
  }

  .welcome-icon {
    font-size: 3rem;
    margin-bottom: var(--space-4);
  }

  .welcome-title {
    font-size: var(--font-size-xl);
    margin-bottom: var(--space-3);
  }

  .welcome-text {
    font-size: var(--font-size-base);
    margin-bottom: var(--space-6);
  }

  .welcome-tips {
    padding: var(--space-4);
  }

  .welcome-input {
    padding: 0 var(--space-2);
  }

  .scroll-to-bottom {
    right: var(--space-4);
    bottom: calc(var(--input-height) + var(--space-3));
    width: 40px;
    height: 40px;
  }

  .connection-error {
    margin: var(--space-3) 0;
    padding: var(--space-4);
  }
}

@media (max-width: 480px) {
  .message-list {
    padding: var(--space-2);
  }
  
  .welcome-message {
    padding: var(--space-6) var(--space-2);
  }
  
  .welcome-tips {
    padding: var(--space-3);
  }
  
  .connection-error {
    flex-direction: column;
    text-align: center;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .connection-error {
    border-left-width: 6px;
    border-color: #ef4444;
  }
  
  .welcome-tips {
    border-width: 2px;
  }
}

/* Print styles */
@media print {
  .scroll-to-bottom,
  .connection-error {
    display: none !important;
  }
  
  .message-list {
    overflow: visible !important;
    height: auto !important;
  }
}
</style>
