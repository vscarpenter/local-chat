import { ref, computed, nextTick } from 'vue'
import { useOllama } from './useOllama.js'

const STORAGE_KEY = 'chatgpt-at-home-messages' // legacy single-thread storage
const CONV_STORAGE_KEY = 'chatgpt-at-home-conversations'
const MAX_MESSAGES = 1000

export function useChat() {
  const ollama = useOllama()

  // Conversations state
  const conversations = ref(loadConversations())
  const activeConversationId = ref(conversations.value[0]?.id || null)
  if (!activeConversationId.value) {
    const conv = createConversation()
    conversations.value.unshift(conv)
    activeConversationId.value = conv.id
    saveConversations()
  }

  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeConversationId.value)
  )
  
  const rawMessages = computed(() => activeConversation.value?.messages || [])
  const isGenerating = ref(false)
  const currentStreamContent = ref('')
  const error = ref(null)

  const allMessages = computed(() => [
    ...rawMessages.value,
    ...(isGenerating.value && currentStreamContent.value ? [{
      id: 'streaming',
      role: 'assistant',
      content: currentStreamContent.value,
      timestamp: new Date(),
      isStreaming: true
    }] : [])
  ])
  
  const hasMessages = computed(() => rawMessages.value.length > 0)
  
  const canSendMessage = computed(() => 
    !isGenerating.value && ollama.isConnected.value
  )

  function loadConversations() {
    try {
      const storedConvs = localStorage.getItem(CONV_STORAGE_KEY)
      if (storedConvs) {
        const parsed = JSON.parse(storedConvs)
        return parsed.map(conv => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: (conv.messages || []).map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }))
      }

      // Migration: legacy single conversation
      const legacy = localStorage.getItem(STORAGE_KEY)
      if (legacy) {
        const msgs = JSON.parse(legacy).map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
        const title = deriveTitleFromMessages(msgs) || 'New Chat'
        const conv = {
          id: generateConversationId(),
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: msgs.slice(-MAX_MESSAGES)
        }
        // Do not delete legacy to be safe; persist new structure
        localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify([serializeConversation(conv)]))
        return [conv]
      }
    } catch (e) {
      console.warn('Failed to load conversations from localStorage:', e)
    }
    return []
  }

  function saveConversations() {
    try {
      const toSave = conversations.value.map(serializeConversation)
      localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) {
      console.warn('Failed to save conversations to localStorage:', e)
    }
  }

  function serializeConversation(conv) {
    return {
      ...conv,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messages: conv.messages.slice(-MAX_MESSAGES).map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString()
      }))
    }
  }

  function generateMessageId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  }

  function generateConversationId() {
    return 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
  }

  function createConversation() {
    const now = new Date()
    return {
      id: generateConversationId(),
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
      messages: []
    }
  }

  function deriveTitleFromMessages(msgs) {
    const firstUser = (msgs || []).find(m => m.role === 'user')
    return firstUser ? firstUser.content.split('\n')[0].slice(0, 50) : null
  }

  function addMessage(role, content, metadata = {}) {
    const message = {
      id: generateMessageId(),
      role,
      content: content.trim(),
      timestamp: new Date(),
      ...metadata
    }
    const conv = activeConversation.value
    if (!conv) return message

    conv.messages.push(message)
    conv.updatedAt = new Date()
    if (role === 'user' && (!conv.title || conv.title === 'New Chat')) {
      const t = deriveTitleFromMessages(conv.messages)
      if (t) conv.title = t
    }
    saveConversations()
    return message
  }

  async function sendMessage(content, options = {}) {
    if (!content?.trim()) {
      throw new Error('Message content cannot be empty')
    }

    if (!canSendMessage.value) {
      if (isGenerating.value) {
        throw new Error('Please wait for the current response to complete')
      }
      if (!ollama.isConnected.value) {
        throw new Error('Not connected to Ollama. Please check your connection.')
      }
    }

    error.value = null
    const userMessage = addMessage('user', content.trim())

    let fullResponse = ''
    let hasStarted = false
    try {
      isGenerating.value = true
      currentStreamContent.value = ''

      const conversationHistory = rawMessages.value
        .slice(-20)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))

      for await (const chunk of ollama.generateResponse(conversationHistory, options)) {
        if (!isGenerating.value) {
          break
        }
        if (!hasStarted) {
          hasStarted = true
        }
        
        currentStreamContent.value += chunk
        fullResponse += chunk
        
        await nextTick()
      }

      if (fullResponse.trim()) {
        addMessage('assistant', fullResponse.trim())
      } else {
        throw new Error('Received empty response from the model')
      }

    } catch (err) {
      error.value = err.message
      const isCanceled = /canceled|abort/i.test(err.message || '')

      if (isCanceled) {
        // Preserve the user message; add partial assistant if any
        if (fullResponse.trim()) {
          addMessage('assistant', fullResponse.trim())
        }
      } else {
        const conv = activeConversation.value
        if (conv && conv.messages[conv.messages.length - 1]?.id === userMessage.id) {
          conv.messages.pop()
          conv.updatedAt = new Date()
          saveConversations()
        }
        throw err
      }
    } finally {
      isGenerating.value = false
      currentStreamContent.value = ''
    }
  }

  function retryLastMessage() {
    const lastUserMessage = [...rawMessages.value]
      .reverse()
      .find(msg => msg.role === 'user')
    
    if (!lastUserMessage) {
      throw new Error('No user message to retry')
    }

    const lastAssistantIndex = rawMessages.value.findIndex(
      (msg, index) => msg.role === 'assistant' && 
      index > rawMessages.value.findIndex(m => m.id === lastUserMessage.id)
    )

    if (lastAssistantIndex !== -1) {
      activeConversation.value.messages.splice(lastAssistantIndex, 1)
      activeConversation.value.updatedAt = new Date()
      saveConversations()
    }

    return sendMessage(lastUserMessage.content)
  }

  function editMessage(messageId, newContent) {
    const messageIndex = rawMessages.value.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) {
      throw new Error('Message not found')
    }

    const message = rawMessages.value[messageIndex]
    if (message.role !== 'user') {
      throw new Error('Only user messages can be edited')
    }

    if (isGenerating.value) {
      throw new Error('Cannot edit messages while generating response')
    }

    const messagesToRemove = rawMessages.value.length - messageIndex
    activeConversation.value.messages.splice(messageIndex, messagesToRemove)
    activeConversation.value.updatedAt = new Date()
    saveConversations()

    if (newContent.trim()) {
      return sendMessage(newContent.trim())
    }
  }

  function deleteMessage(messageId) {
    const messageIndex = rawMessages.value.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return false

    if (isGenerating.value) {
      throw new Error('Cannot delete messages while generating response')
    }

    activeConversation.value.messages.splice(messageIndex, 1)
    activeConversation.value.updatedAt = new Date()
    saveConversations()
    return true
  }

  function clearConversation() {
    if (isGenerating.value) {
      throw new Error('Cannot clear conversation while generating response')
    }

    if (activeConversation.value) {
      activeConversation.value.messages = []
      activeConversation.value.title = 'New Chat'
      activeConversation.value.updatedAt = new Date()
    }
    error.value = null
    currentStreamContent.value = ''
    saveConversations()
  }

  function exportConversation(format = 'json') {
    const exportData = {
      messages: rawMessages.value,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    switch (format.toLowerCase()) {
      case 'json':
        return {
          data: JSON.stringify(exportData, null, 2),
          filename: `chat-export-${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        }
      
      case 'txt':
        const textContent = rawMessages.value
          .map(msg => {
            const time = msg.timestamp.toLocaleTimeString()
            const role = msg.role === 'user' ? 'You' : 'Assistant'
            return `[${time}] ${role}: ${msg.content}`
          })
          .join('\n\n')
        
        return {
          data: textContent,
          filename: `chat-export-${new Date().toISOString().split('T')[0]}.txt`,
          mimeType: 'text/plain'
        }
      
      case 'md':
      case 'markdown':
        const mdContent = rawMessages.value
          .map(msg => {
            const time = msg.timestamp.toLocaleString()
            const role = msg.role === 'user' ? '**You**' : '**Assistant**'
            return `### ${role} _(${time})_\n\n${msg.content}\n`
          })
          .join('\n---\n\n')
        
        return {
          data: `# Chat Export\n\nExported on ${new Date().toLocaleString()}\n\n---\n\n${mdContent}`,
          filename: `chat-export-${new Date().toISOString().split('T')[0]}.md`,
          mimeType: 'text/markdown'
        }
      
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  function stopGeneration() {
    if (isGenerating.value) {
      ollama.cancel?.()
      isGenerating.value = false
    }
  }

  function getMessageById(messageId) {
    return rawMessages.value.find(msg => msg.id === messageId)
  }

  function searchMessages(query) {
    if (!query?.trim()) return []
    
    const searchTerm = query.toLowerCase()
    return rawMessages.value.filter(msg => 
      msg.content.toLowerCase().includes(searchTerm)
    )
  }

  // Conversation management API
  const conversationList = computed(() => conversations.value)

  function setActiveConversation(id) {
    const exists = conversations.value.some(c => c.id === id)
    if (exists) activeConversationId.value = id
  }

  function newConversation() {
    const conv = createConversation()
    conversations.value.unshift(conv)
    activeConversationId.value = conv.id
    saveConversations()
    return conv.id
  }

  function renameConversation(id, title) {
    const conv = conversations.value.find(c => c.id === id)
    if (conv) {
      conv.title = title?.trim() || conv.title
      conv.updatedAt = new Date()
      saveConversations()
    }
  }

  function deleteConversation(id) {
    const idx = conversations.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      conversations.value.splice(idx, 1)
      if (activeConversationId.value === id) {
        if (conversations.value.length > 0) {
          activeConversationId.value = conversations.value[0].id
        } else {
          const newId = newConversation()
          activeConversationId.value = newId
        }
      }
      saveConversations()
    }
  }

  return {
    messages: allMessages,
    rawMessages,
    isGenerating,
    currentStreamContent,
    error,
    hasMessages,
    canSendMessage,
    isConnected: ollama.isConnected,
    connectionError: ollama.connectionError,
    sendMessage,
    retryLastMessage,
    editMessage,
    deleteMessage,
    clearConversation,
    exportConversation,
    stopGeneration,
    getMessageById,
    searchMessages,
    checkConnection: ollama.checkConnection,

    // Conversations API
    conversations: conversationList,
    activeConversationId,
    setActiveConversation,
    newConversation,
    renameConversation,
    deleteConversation
  }
}
