<template>
  <div class="chat-container">
    <!-- Header -->
    <header class="chat-header">
      <div class="header-content">
        <div class="header-title">
          <div class="app-icon" aria-hidden="true">
            <LogoMark :size="28" />
          </div>
          <div class="title-text">
            <h1 class="app-name">ChatGPT at Home</h1>
            <p class="connection-status" :class="connectionStatusClass">
              <span class="status-indicator"></span>
              {{ connectionStatusText }}
            </p>
          </div>
        </div>

        <div class="header-actions">
          <div class="model-info" v-if="isConnected">
            <span class="model-name">{{ currentModel }}</span>
            <div class="model-indicator"></div>
          </div>
          
          <ThemeToggle @change="handleThemeChange" />
          <button class="btn btn-ghost header-menu-btn" @click="showSidebar = !showSidebar" title="Toggle sidebar" aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          <div class="dropdown-container" v-if="hasMessages">
            <button
              class="btn btn-ghost header-menu-btn"
              @click="showMenu = !showMenu"
              :aria-expanded="showMenu"
              aria-haspopup="true"
              aria-label="More options"
              title="More options"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>
            
            <Transition name="dropdown">
              <div v-if="showMenu" class="dropdown-menu" @click="showMenu = false">
                <button class="dropdown-item" @click="exportConversation('json')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export as JSON
                </button>
                <button class="dropdown-item" @click="exportConversation('txt')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                  </svg>
                  Export as Text
                </button>
                <button class="dropdown-item" @click="exportConversation('md')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  Export as Markdown
                </button>
                <hr class="dropdown-divider">
                <button class="dropdown-item danger" @click="handleClearConversation">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                  </svg>
                  Clear Conversation
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Layout -->
    <div class="chat-layout">
      <ChatSidebar
        :is-open="showSidebar"
        :conversations="conversations"
        :active-id="activeConversationId"
        @new-chat="handleNewChat"
        @select="setActiveConversation"
        @rename="({ id, title }) => renameConversation(id, title)"
        @delete="handleDeleteConversation"
      />

      <main class="chat-main" @click="hideMenu">
        <MessageList
          :messages="messages"
          :is-generating="isGenerating"
          :connection-error="connectionError"
          :is-connecting="isConnecting"
          @edit-message="handleEditMessage"
          @delete-message="handleDeleteMessage"
          @retry-connection="handleRetryConnection"
        >
          <template #welcome-input>
            <ChatInput
              v-if="!hasMessages"
              ref="welcomeChatInputRef"
              :is-generating="isGenerating"
              :can-send="canSendMessage"
              :has-messages="hasMessages"
              :connection-error="connectionError"
              @send="handleSendMessage"
              @stop="handleStopGeneration"
              @clear="handleClearConversation"
              @export="exportConversation"
              variant="inline"
              :min-rows="4"
            />
          </template>
        </MessageList>
      </main>
    </div>

    <!-- Chat Input -->
    <ChatInput
      v-if="hasMessages"
      ref="chatInputRef"
      :is-generating="isGenerating"
      :can-send="canSendMessage"
      :has-messages="hasMessages"
      :connection-error="connectionError"
      @send="handleSendMessage"
      @stop="handleStopGeneration"
      @clear="handleClearConversation"
      @export="exportConversation"
      :min-rows="1"
    />

    <!-- Error Toast -->
    <Transition name="toast">
      <div v-if="errorToast" class="error-toast" @click="hideErrorToast">
        <div class="toast-content">
          <div class="toast-icon">⚠️</div>
          <div class="toast-message">{{ errorToast }}</div>
          <button class="toast-close" @click.stop="hideErrorToast" aria-label="Close error message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Success Toast -->
    <Transition name="toast">
      <div v-if="successToast" class="success-toast" @click="hideSuccessToast">
        <div class="toast-content">
          <div class="toast-icon">✅</div>
          <div class="toast-message">{{ successToast }}</div>
          <button class="toast-close" @click.stop="hideSuccessToast" aria-label="Close success message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Confirmation Modal -->
    <Transition name="modal">
      <div v-if="showConfirmation" class="modal-overlay" @click="hideConfirmation">
        <div class="modal-dialog" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ confirmationTitle }}</h3>
          </div>
          <div class="modal-body">
            <p>{{ confirmationMessage }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="hideConfirmation">
              Cancel
            </button>
            <button 
              class="btn btn-primary"
              :class="{ 'btn-danger': confirmationDanger }"
              @click="confirmAction"
            >
              {{ confirmationConfirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useChat } from '../composables/useChat.js'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'
import ThemeToggle from './ThemeToggle.vue'
import LogoMark from './LogoMark.vue'
import ChatSidebar from './ChatSidebar.vue'

const chat = useChat()
const chatInputRef = ref(null)
const welcomeChatInputRef = ref(null)
const showMenu = ref(false)
const errorToast = ref('')
const successToast = ref('')
const errorTimeout = ref(null)
const successTimeout = ref(null)
const showConfirmation = ref(false)
const confirmationTitle = ref('')
const confirmationMessage = ref('')
const confirmationConfirmText = ref('Confirm')
const confirmationDanger = ref(false)
const confirmationAction = ref(null)

const {
  messages,
  isGenerating,
  hasMessages,
  canSendMessage,
  isConnected,
  connectionError,
  sendMessage,
  clearConversation,
  exportConversation: chatExportConversation,
  deleteMessage,
  editMessage,
  stopGeneration,
  checkConnection,
  // conversations
  conversations,
  activeConversationId,
  setActiveConversation,
  newConversation,
  renameConversation,
  deleteConversation
} = chat

const isConnecting = ref(false)
const currentModel = ref('gpt-oss:20b')
const showSidebar = ref(true)

const connectionStatusClass = computed(() => ({
  'status-connected': isConnected.value,
  'status-error': connectionError.value,
  'status-connecting': isConnecting.value
}))

const connectionStatusText = computed(() => {
  if (connectionError.value) {
    return 'Connection failed'
  }
  if (isConnecting.value) {
    return 'Connecting...'
  }
  if (isConnected.value) {
    return 'Connected to Ollama'
  }
  return 'Disconnected'
})

function hideMenu() {
  showMenu.value = false
}

function showErrorToast(message, duration = 5000) {
  if (errorTimeout.value) {
    clearTimeout(errorTimeout.value)
  }
  
  errorToast.value = message
  errorTimeout.value = setTimeout(() => {
    errorToast.value = ''
  }, duration)
}

function hideErrorToast() {
  errorToast.value = ''
  if (errorTimeout.value) {
    clearTimeout(errorTimeout.value)
  }
}

function showSuccessToast(message, duration = 3000) {
  if (successTimeout.value) {
    clearTimeout(successTimeout.value)
  }
  
  successToast.value = message
  successTimeout.value = setTimeout(() => {
    successToast.value = ''
  }, duration)
}

function hideSuccessToast() {
  successToast.value = ''
  if (successTimeout.value) {
    clearTimeout(successTimeout.value)
  }
}

function showConfirmationDialog(title, message, confirmText = 'Confirm', isDanger = false) {
  return new Promise((resolve) => {
    confirmationTitle.value = title
    confirmationMessage.value = message
    confirmationConfirmText.value = confirmText
    confirmationDanger.value = isDanger
    confirmationAction.value = resolve
    showConfirmation.value = true
  })
}

function hideConfirmation() {
  showConfirmation.value = false
  if (confirmationAction.value) {
    confirmationAction.value(false)
    confirmationAction.value = null
  }
}

function confirmAction() {
  if (confirmationAction.value) {
    confirmationAction.value(true)
    confirmationAction.value = null
  }
  showConfirmation.value = false
}

async function handleSendMessage(content) {
  try {
    hideMenu()
    await sendMessage(content)
  } catch (error) {
    showErrorToast(error.message)
  }
}

async function handleEditMessage(messageId) {
  const message = chat.getMessageById(messageId)
  if (!message) return

  const newContent = prompt('Edit your message:', message.content)
  if (newContent === null) return

  try {
    await editMessage(messageId, newContent)
  } catch (error) {
    showErrorToast(error.message)
  }
}

async function handleDeleteMessage(messageId) {
  const confirmed = await showConfirmationDialog(
    'Delete Message',
    'Are you sure you want to delete this message? This action cannot be undone.',
    'Delete',
    true
  )

  if (confirmed) {
    try {
      deleteMessage(messageId)
      showSuccessToast('Message deleted')
    } catch (error) {
      showErrorToast(error.message)
    }
  }
}

async function handleClearConversation() {
  const confirmed = await showConfirmationDialog(
    'Clear Conversation',
    'Are you sure you want to clear the entire conversation? This action cannot be undone.',
    'Clear All',
    true
  )

  if (confirmed) {
    try {
      clearConversation()
      showSuccessToast('Conversation cleared')
      hideMenu()
      nextTick(() => {
        chatInputRef.value?.focus()
      })
    } catch (error) {
      showErrorToast(error.message)
    }
  }
}

async function handleNewChat() {
  try {
    if (isGenerating.value) {
      handleStopGeneration()
      await nextTick()
    }
    newConversation()
    showSuccessToast('New chat started')
    hideMenu()
    await nextTick()
    welcomeChatInputRef.value?.focus?.()
  } catch (error) {
    showErrorToast(error.message)
  }
}

async function handleDeleteConversation(id) {
  const confirmed = await showConfirmationDialog(
    'Delete Conversation',
    'This will permanently delete the selected conversation.',
    'Delete',
    true
  )
  if (confirmed) {
    try {
      deleteConversation(id)
      showSuccessToast('Conversation deleted')
    } catch (error) {
      showErrorToast(error.message)
    }
  }
}

function handleStopGeneration() {
  try {
    stopGeneration()
    showSuccessToast('Generation stopped')
  } catch (error) {
    showErrorToast(error.message)
  }
}

async function handleRetryConnection() {
  isConnecting.value = true
  try {
    await checkConnection()
    if (isConnected.value) {
      showSuccessToast('Connected to Ollama')
    }
  } catch (error) {
    showErrorToast('Failed to connect to Ollama')
  } finally {
    isConnecting.value = false
  }
}

async function exportConversation(format) {
  try {
    const result = chatExportConversation(format)
    
    const blob = new Blob([result.data], { type: result.mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = result.filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    
    showSuccessToast(`Conversation exported as ${format.toUpperCase()}`)
    hideMenu()
  } catch (error) {
    showErrorToast(`Failed to export conversation: ${error.message}`)
  }
}

function handleThemeChange(event) {
  console.log('Theme changed to:', event.theme)
}

function handleKeyboardShortcuts(event) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'k':
        event.preventDefault()
        handleClearConversation()
        break
      case '/':
        event.preventDefault()
        ;(hasMessages.value ? chatInputRef.value : welcomeChatInputRef.value)?.focus?.()
        break
    }
  }
  
  if (event.key === 'Escape') {
    hideMenu()
    hideErrorToast()
    hideSuccessToast()
    if (showConfirmation.value) {
      hideConfirmation()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts)
  handleRetryConnection()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
  if (errorTimeout.value) clearTimeout(errorTimeout.value)
  if (successTimeout.value) clearTimeout(successTimeout.value)
})
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  position: relative;
}

.chat-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 0;
  flex: 1;
}

/* Header */
.chat-header {
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  padding: var(--space-3) var(--space-4);
  flex-shrink: 0;
  z-index: 20;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--max-width-chat);
  margin: 0 auto;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
}

.app-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.title-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1;
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--text-tertiary);
  flex-shrink: 0;
}

.status-connected .status-indicator {
  background-color: #10b981;
  box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
}

.status-error .status-indicator {
  background-color: #ef4444;
  box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
}

.status-connecting .status-indicator {
  background-color: #f59e0b;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .chat-layout {
    grid-template-columns: 0 1fr;
  }
}

.model-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.model-name {
  font-weight: var(--font-weight-medium);
}

.model-indicator {
  width: 4px;
  height: 4px;
  border-radius: var(--radius-full);
  background-color: var(--bg-button);
}

.header-menu-btn {
  padding: var(--space-2);
}

.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 200px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-2);
  z-index: 30;
  margin-top: var(--space-1);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  text-align: left;
}

.dropdown-item:hover {
  background-color: var(--bg-secondary);
}

.dropdown-item.danger {
  color: #ef4444;
}

.dropdown-item.danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-primary);
  border: none;
  margin: var(--space-2) 0;
}

/* Main Chat */
.chat-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Toasts */
.error-toast,
.success-toast {
  position: fixed;
  top: calc(var(--header-height) + var(--space-4));
  right: var(--space-4);
  max-width: 400px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 40;
  cursor: pointer;
}

.error-toast {
  border-left: 4px solid #ef4444;
}

.success-toast {
  border-left: 4px solid #10b981;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
}

.toast-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0;
  transition: color var(--transition-fast);
  flex-shrink: 0;
}

.toast-close:hover {
  color: var(--text-primary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: var(--space-4);
}

.modal-dialog {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  padding: var(--space-6) var(--space-6) 0;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.modal-body {
  padding: var(--space-4) var(--space-6);
}

.modal-body p {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: 0 var(--space-6) var(--space-6);
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
  border-color: #dc2626;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
  transform-origin: top right;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
  transform: scale(0.95) translateY(-20px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .chat-header {
    padding: var(--space-3);
  }

  .header-title {
    gap: var(--space-2);
  }

  .app-icon {
    font-size: 1.5rem;
  }

  .app-name {
    font-size: var(--font-size-base);
  }

  .header-actions {
    gap: var(--space-2);
  }

  .model-info {
    display: none;
  }

  .error-toast,
  .success-toast {
    top: var(--space-4);
    right: var(--space-3);
    left: var(--space-3);
    max-width: none;
  }

  .modal-overlay {
    padding: var(--space-3);
  }

  .dropdown-menu {
    min-width: 180px;
  }
}

@media (max-width: 480px) {
  .title-text {
    display: none;
  }

  .header-actions {
    gap: var(--space-1);
  }

  .toast-content {
    padding: var(--space-3);
  }

  .modal-header,
  .modal-body {
    padding: var(--space-4);
  }

  .modal-footer {
    padding: 0 var(--space-4) var(--space-4);
    flex-direction: column;
  }

  .modal-footer .btn {
    width: 100%;
  }
}
</style>
