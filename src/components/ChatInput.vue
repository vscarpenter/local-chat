<!--
  ChatInput Component
  Icons from Lucide (https://lucide.dev/) - consistent 2px stroke width
-->
<template>
  <div :class="['chat-input-container', { 'is-inline': variant === 'inline' }]">
    <div class="chat-input-wrapper">
      <div class="input-actions-top" v-if="hasActions">
        <div class="input-toolbar">
          <button
            v-if="isGenerating"
            class="btn btn-secondary btn-sm"
            @click="$emit('stop')"
            title="Stop generation"
            aria-label="Stop generating response"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="6" y="6" width="12" height="12" rx="2"></rect>
            </svg>
            Stop
          </button>
          
          <button
            v-if="hasMessages && !isGenerating"
            class="btn btn-ghost btn-sm"
            @click="$emit('clear')"
            title="Clear conversation"
            aria-label="Clear all messages"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
            Clear
          </button>

          <button
            v-if="hasMessages && !isGenerating"
            class="btn btn-ghost btn-sm"
            @click="$emit('export', 'json')"
            title="Export conversation"
            aria-label="Export conversation as JSON"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export
          </button>
        </div>
      </div>

      <div class="input-main">
        <div class="input-container">
          <div class="textarea-container">
            <textarea
              ref="textareaRef"
              v-model="inputValue"
              class="message-input"
              :class="{
                'has-content': hasContent,
                'is-disabled': !canSend,
                'is-multiline': isMultiline
              }"
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              :disabled="!props.canSend && !props.isGenerating"
              @keydown="handleKeydown"
              @input="handleInput"
              @paste="handlePaste"
              :rows="minRows"
              :maxlength="maxLength"
              :aria-label="textareaAriaLabel"
            ></textarea>
            
            <div class="input-overlay">
              <div class="character-count" v-if="showCharCount">
                {{ inputValue.length }}/{{ maxLength }}
              </div>
            </div>
          </div>

          <div class="input-actions">
            <button
              class="send-button btn btn-primary"
              :class="{ 'is-loading': isGenerating }"
              :disabled="!canSend"
              @click="handleSend"
              :title="sendButtonTitle"
              :aria-label="sendButtonAriaLabel"
            >
              <span v-if="isGenerating" class="loading-spinner"></span>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9"></polygon>
              </svg>
            </button>
          </div>
        </div>

        <div class="input-status" v-if="statusMessage">
          <div class="status-content">
            <span :class="`status-${statusType}`">
              {{ statusMessage }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  isGenerating: {
    type: Boolean,
    default: false
  },
  canSend: {
    type: Boolean,
    default: true
  },
  hasMessages: {
    type: Boolean,
    default: false
  },
  connectionError: {
    type: String,
    default: null
  },
  maxLength: {
    type: Number,
    default: 4000
  },
  placeholder: {
    type: String,
    default: 'Type your message here...'
  },
  minRows: {
    type: Number,
    default: 4
  },
  variant: {
    type: String,
    default: 'footer',
    validator: (v) => ['footer', 'inline'].includes(v)
  }
})

const emit = defineEmits([
  'send',
  'stop', 
  'clear',
  'export',
  'focus',
  'blur'
])

const textareaRef = ref(null)
const inputValue = ref('')
const isMultiline = ref(false)
const lastSentMessage = ref('')

const hasContent = computed(() => inputValue.value.trim().length > 0)
const hasActions = computed(() => props.hasMessages || props.isGenerating)
const showCharCount = computed(() => inputValue.value.length > props.maxLength * 0.8)

const canSend = computed(() => {
  return hasContent.value && 
         props.canSend && 
         !props.isGenerating && 
         inputValue.value.trim().length <= props.maxLength
})

const statusMessage = computed(() => {
  if (props.connectionError) {
    return props.connectionError
  }
  if (props.isGenerating) {
    return 'Generating response...'
  }
  if (!props.canSend && !props.isGenerating) {
    return 'Connecting to Ollama...'
  }
  if (inputValue.value.length >= props.maxLength) {
    return `Message too long (${inputValue.value.length}/${props.maxLength} characters)`
  }
  return null
})

const statusType = computed(() => {
  if (props.connectionError) return 'error'
  if (props.isGenerating) return 'info'
  if (inputValue.value.length >= props.maxLength) return 'warning'
  return 'info'
})

const textareaAriaLabel = computed(() => {
  return props.isGenerating 
    ? 'Message input (disabled while generating response)'
    : 'Type your message here'
})

const sendButtonTitle = computed(() => {
  if (!canSend.value) {
    if (!hasContent.value) return 'Enter a message to send'
    if (props.isGenerating) return 'Wait for response to complete'
    if (!props.canSend) return 'Not connected to Ollama'
    if (inputValue.value.length > props.maxLength) return 'Message too long'
  }
  return 'Send message (Enter)'
})

const sendButtonAriaLabel = computed(() => {
  return canSend.value ? 'Send message' : sendButtonTitle.value
})

function adjustTextareaHeight() {
  if (!textareaRef.value) return
  
  const textarea = textareaRef.value
  textarea.style.height = 'auto'
  
  const maxHeight = 200
  const lh = parseFloat(getComputedStyle(textarea).lineHeight) || 24
  const minHeight = Math.max(props.minRows * lh, lh)
  const newHeight = Math.min(textarea.scrollHeight, maxHeight)
  
  textarea.style.height = Math.max(minHeight, newHeight) + 'px'
  isMultiline.value = (textarea.scrollHeight > lh * 1.5) || props.minRows > 1
}

function handleInput(event) {
  adjustTextareaHeight()
  
  if (event.inputType === 'insertFromPaste') {
    nextTick(() => {
      if (inputValue.value.length > props.maxLength) {
        inputValue.value = inputValue.value.slice(0, props.maxLength)
        adjustTextareaHeight()
      }
    })
  }
}

function handleKeydown(event) {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      return
    }
    
    event.preventDefault()
    if (canSend.value) {
      handleSend()
    }
  }
  
  if (event.key === 'ArrowUp' && !inputValue.value.trim() && lastSentMessage.value) {
    event.preventDefault()
    inputValue.value = lastSentMessage.value
    nextTick(() => {
      adjustTextareaHeight()
      const textarea = textareaRef.value
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    })
  }
  
  if (event.key === 'Escape') {
    if (props.isGenerating) {
      event.preventDefault()
      emit('stop')
    }
  }
  
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        if (canSend.value) {
          handleSend()
        }
        break
      case 'k':
        event.preventDefault()
        emit('clear')
        break
    }
  }
}

function handlePaste(event) {
  const clipboardData = event.clipboardData || window.clipboardData
  const pastedData = clipboardData.getData('text')
  
  const currentLength = inputValue.value.length
  const availableSpace = props.maxLength - currentLength
  
  if (pastedData.length > availableSpace) {
    event.preventDefault()
    const truncatedData = pastedData.slice(0, availableSpace)
    
    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    const newValue = 
      inputValue.value.slice(0, start) + 
      truncatedData + 
      inputValue.value.slice(end)
    
    inputValue.value = newValue
    
    nextTick(() => {
      textarea.setSelectionRange(start + truncatedData.length, start + truncatedData.length)
      adjustTextareaHeight()
    })
  }
}

function handleSend() {
  if (!canSend.value) return
  
  const message = inputValue.value.trim()
  if (!message) return
  
  lastSentMessage.value = message
  emit('send', message)
  
  inputValue.value = ''
  nextTick(() => {
    adjustTextareaHeight()
    focusInput()
  })
}

function focusInput() {
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

function clearInput() {
  inputValue.value = ''
  adjustTextareaHeight()
}

watch(() => props.isGenerating, (isGenerating) => {
  if (!isGenerating) {
    nextTick(() => {
      focusInput()
    })
  }
})

onMounted(() => {
  adjustTextareaHeight()
  focusInput()
})

defineExpose({
  focus: focusInput,
  clear: clearInput,
  setValue: (value) => {
    inputValue.value = value
    nextTick(() => adjustTextareaHeight())
  }
})
</script>

<style scoped>
.chat-input-container {
  background-color: var(--bg-primary);
  border-top: 1px solid var(--border-primary);
  position: relative;
  z-index: 10;
}

.chat-input-container.is-inline {
  background: transparent;
  border-top: none;
}

.chat-input-wrapper {
  max-width: var(--max-width-chat);
  margin: 0 auto;
  padding: var(--space-4);
}

.chat-input-container.is-inline .chat-input-wrapper {
  padding: 0;
}

.input-actions-top {
  margin-bottom: var(--space-3);
  display: flex;
  justify-content: flex-end;
}

.input-toolbar {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.input-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-input);
  border-radius: var(--radius-xl);
  padding: var(--space-3);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  position: relative;
}

.input-container:focus-within {
  border-color: var(--border-input-focus);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.1);
}

.textarea-container {
  flex: 1;
  position: relative;
}

.message-input {
  width: 100%;
  min-height: 24px;
  max-height: 150px;
  padding: var(--space-2) 0;
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--text-primary);
  background-color: transparent;
  border: none;
  outline: none;
  resize: none;
  overflow-y: auto;
  line-height: var(--line-height-normal);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message-input::placeholder {
  color: var(--text-tertiary);
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-overlay {
  position: absolute;
  top: var(--space-2);
  right: 0;
  pointer-events: none;
}

.character-count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  background-color: var(--bg-primary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.input-actions {
  display: flex;
  align-items: flex-end;
}

.send-button {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.send-button:disabled {
  opacity: 0.4;
  transform: none;
  cursor: not-allowed;
}

.send-button:not(:disabled):hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.send-button:not(:disabled):active {
  transform: scale(0.95);
}

.send-button.is-loading {
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.input-status {
  display: flex;
  justify-content: center;
  margin-top: var(--space-2);
}

.status-content {
  font-size: var(--font-size-sm);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
}

.status-info {
  color: var(--text-secondary);
}

.status-error {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.status-warning {
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .chat-input-wrapper {
    padding: var(--space-3);
  }

  .input-actions-top {
    margin-bottom: var(--space-2);
  }

  .input-toolbar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .message-input {
    font-size: var(--font-size-base);
  }

  .send-button {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .chat-input-wrapper {
    padding: var(--space-2);
  }

  .input-container {
    padding: var(--space-2);
    gap: var(--space-2);
  }

  .message-input {
    font-size: var(--font-size-sm);
  }

  .send-button {
    width: 36px;
    height: 36px;
  }

  .input-toolbar {
    gap: var(--space-1);
  }

  .input-toolbar .btn {
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-xs);
  }
}

/* Focus and accessibility */
.message-input:focus {
  outline: none;
}

.send-button:focus-visible {
  outline: 2px solid var(--border-input-focus);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .input-container {
    border-width: 3px;
  }
  
  .send-button {
    border-width: 2px;
  }
  
  .status-error,
  .status-warning {
    border-width: 2px;
  }
}

/* Dark theme adjustments */
[data-theme="dark"] .character-count {
  background-color: var(--bg-secondary);
}

/* Print styles */
@media print {
  .chat-input-container {
    display: none !important;
  }
}
</style>
