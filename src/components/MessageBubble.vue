<template>
  <div
    :class="[
      'message-bubble',
      `message-${message.role}`,
      { 'message-streaming': message.isStreaming }
    ]"
    :data-mid="message.id"
  >
    <div class="message-header">
      <div class="message-avatar">
        <span class="avatar-icon">{{ avatarIcon }}</span>
      </div>
      <div class="message-meta">
        <span class="message-role">{{ roleLabel }}</span>
        <span class="message-time">{{ formattedTime }}</span>
      </div>
      <div class="message-actions" v-if="!message.isStreaming">
        <button
          class="btn btn-ghost btn-sm action-btn"
          @click="copyMessage"
          :title="copyButtonText"
          :aria-label="copyButtonText"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="m5 15-3-3 3-3"></path>
          </svg>
        </button>
        <button
          v-if="message.role === 'user'"
          class="btn btn-ghost btn-sm action-btn"
          @click="$emit('edit', message.id)"
          title="Edit message"
          aria-label="Edit this message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button
          class="btn btn-ghost btn-sm action-btn"
          @click="$emit('delete', message.id)"
          title="Delete message"
          aria-label="Delete this message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="message-content">
      <div
        class="message-text"
        v-html="formattedContent"
        :class="{ 'streaming': message.isStreaming }"
        :aria-live="message.role === 'assistant' ? 'polite' : 'off'"
      ></div>
      
      <div v-if="message.isStreaming" class="streaming-indicator">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUpdated } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true,
    validator: (message) => {
      return message && 
        typeof message.role === 'string' && 
        typeof message.content === 'string' &&
        message.timestamp instanceof Date
    }
  }
})

const emit = defineEmits(['edit', 'delete', 'copy'])

const copyButtonText = ref('Copy message')
const copyTimeout = ref(null)

const avatarIcon = computed(() => {
  switch (props.message.role) {
    case 'user':
      return '👤'
    case 'assistant':
      return '🤖'
    case 'system':
      return '⚙️'
    default:
      return '💬'
  }
})

const roleLabel = computed(() => {
  switch (props.message.role) {
    case 'user':
      return 'You'
    case 'assistant':
      return 'Assistant'
    case 'system':
      return 'System'
    default:
      return props.message.role
  }
})

const formattedTime = computed(() => {
  const now = new Date()
  const messageDate = props.message.timestamp
  const diffMs = now - messageDate
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return messageDate.toLocaleDateString()
  }
})

const formattedContent = computed(() => {
  let content = props.message.content

  // Escape HTML
  content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks (before other processing)
  content = content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Tables (process before headers and other elements)
  content = processMarkdownTables(content)

  // Headers (process before line breaks)
  content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>')

  // Bold and italic (before line breaks)
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  content = content.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Strikethrough
  content = content.replace(/~~(.*?)~~/g, '<del>$1</del>')

  // Links (before line breaks)
  content = content.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  )
  
  // Auto-link URLs (after markdown links)
  content = content.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  )

  // Lists (process before line breaks)  
  // Mark unordered and ordered list items differently
  content = content.replace(/^[\s]*[-*+]\s+(.*$)/gm, '<li data-type="ul">$1</li>')
  content = content.replace(/^[\s]*\d+\.\s+(.*$)/gm, '<li data-type="ol">$1</li>')
  
  // Wrap consecutive list items in appropriate ul/ol tags
  content = content.replace(/(<li data-type="ul">.*?<\/li>(?:\s*<li data-type="ul">.*?<\/li>)*)/gs, (match) => {
    const cleanMatch = match.replace(/ data-type="ul"/g, '')
    return `<ul>${cleanMatch}</ul>`
  })
  
  content = content.replace(/(<li data-type="ol">.*?<\/li>(?:\s*<li data-type="ol">.*?<\/li>)*)/gs, (match) => {
    const cleanMatch = match.replace(/ data-type="ol"/g, '')
    return `<ol>${cleanMatch}</ol>`
  })
  
  // Clean up any remaining data-type attributes
  content = content.replace(/ data-type="[^"]*"/g, '')

  // Blockquotes
  content = content.replace(/^>\s+(.*$)/gm, '<blockquote>$1</blockquote>')
  
  // Wrap consecutive blockquotes
  content = content.replace(/(<blockquote>.*?<\/blockquote>[\s]*)+/gs, (match) => {
    const cleanMatch = match.replace(/<\/?blockquote>/g, '')
    return `<blockquote>${cleanMatch}</blockquote>`
  })

  // Horizontal rules
  content = content.replace(/^---+$/gm, '<hr>')

  // Line breaks (process last, but preserve inside code blocks)
  content = content.replace(/\n(?![^<]*<\/(?:pre|code)>)/g, '<br>')

  // Clean up extra line breaks around block elements
  content = content.replace(/<br>\s*(<\/?(?:h[1-6]|ul|ol|blockquote|hr|pre)>)/g, '$1')
  content = content.replace(/(<\/?(?:h[1-6]|ul|ol|blockquote|hr|pre)>)\s*<br>/g, '$1')

  return content
})

function enhanceCodeBlocks() {
  const container = document.querySelector(`[data-mid="${props.message.id}"]`) || null
  const root = container || null
  const scope = root || null
  const messageNode = scope || null
}

function attachCopyButtons() {
  const host = document.querySelector(`[data-mid="${props.message.id}"] .message-text`) || null
  if (!host) return
  const pres = host.querySelectorAll('pre')
  pres.forEach(pre => {
    if (pre.querySelector('.code-copy')) return
    pre.style.position = 'relative'
    const btn = document.createElement('button')
    btn.className = 'code-copy'
    btn.type = 'button'
    btn.title = 'Copy code'
    btn.innerHTML = '<span>Copy</span>'
    btn.addEventListener('click', async (e) => {
      e.preventDefault()
      try {
        const code = pre.querySelector('code')?.innerText || ''
        await navigator.clipboard.writeText(code)
        btn.innerHTML = '<span>Copied</span>'
        setTimeout(() => (btn.innerHTML = '<span>Copy</span>'), 1500)
      } catch {}
    })
    pre.appendChild(btn)
  })
}

onMounted(() => {
  // Mark container with data-mid for scoping
  const root = document.currentScript?.ownerDocument || document
  const wrappers = document.querySelectorAll('.message-bubble')
  // Attach copy buttons after mount
  attachCopyButtons()
})

onUpdated(() => {
  attachCopyButtons()
})

// Convert GitHub-style markdown tables to HTML tables
function processMarkdownTables(input) {
  if (!input || !input.includes('|')) return input

  const lines = input.split('\n')
  const out = []

  const isSeparatorRow = (line) => {
    const cells = line.trim().replace(/^\||\|$/g, '').split('|')
    return cells.length > 0 && cells.every(c => /^\s*:?-{3,}:?\s*$/.test(c))
  }

  const splitRow = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
  const isTableRow = (line) => line.includes('|') && !/^\s*<\/?(pre|code)/i.test(line)

  for (let i = 0; i < lines.length; i++) {
    const hdr = lines[i]
    const sep = lines[i + 1]

    if (hdr && sep && isTableRow(hdr) && isSeparatorRow(sep)) {
      const headers = splitRow(hdr)
      i += 2
      const rows = []
      while (i < lines.length && isTableRow(lines[i]) && !/^\s*$/i.test(lines[i])) {
        rows.push(splitRow(lines[i]))
        i++
      }
      // step back one since outer loop will i++
      i--

      const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`
      const tbody = `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`
      out.push(`<table class="md-table">${thead}${tbody}</table>`)
    } else {
      out.push(hdr)
    }
  }

  return out.join('\n')
}

const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copyButtonText.value = '✓ Copied!'
    
    if (copyTimeout.value) {
      clearTimeout(copyTimeout.value)
    }
    
    copyTimeout.value = setTimeout(() => {
      copyButtonText.value = 'Copy message'
    }, 2000)
    
    emit('copy', props.message)
  } catch (error) {
    console.warn('Failed to copy message:', error)
    copyButtonText.value = 'Copy failed'
    
    if (copyTimeout.value) {
      clearTimeout(copyTimeout.value)
    }
    
    copyTimeout.value = setTimeout(() => {
      copyButtonText.value = 'Copy message'
    }, 2000)
  }
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-6);
  max-width: 100%;
  opacity: 0;
  transform: translateY(20px);
  transition: all var(--transition-spring);
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.message-bubble.animate-fadeIn {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.message-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.message-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: var(--bg-secondary);
  flex-shrink: 0;
}

.avatar-icon {
  font-size: 16px;
}

.message-user .avatar-icon {
  filter: brightness(1.1);
}

.message-assistant .avatar-icon {
  filter: brightness(0.9);
}

.message-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}

.message-role {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.message-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transform: translateY(4px);
  transition: all var(--transition-spring);
}

.message-bubble:hover .message-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  padding: var(--space-2);
  color: var(--text-tertiary);
  border-radius: var(--radius-md);
  transition: all var(--transition-spring);
  position: relative;
  overflow: hidden;
}

.action-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  transform: scale(1.1);
}

.action-btn:active {
  transform: scale(0.95);
}

.message-content {
  margin-left: 44px;
  position: relative;
}

.message-text {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  word-wrap: break-word;
  overflow-wrap: break-word;
  position: relative;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.message-user .message-text {
  background: var(--bg-chat-user);
  color: var(--text-button);
  margin-left: auto;
  margin-right: 0;
  max-width: 85%;
  border-radius: var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl);
  box-shadow: var(--shadow-gradient);
}

.message-assistant .message-text {
  background-color: var(--bg-chat-ai);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm);
}

.message-text.streaming {
  border-bottom-right-radius: var(--radius-sm);
}

.message-text :deep(pre) {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin: var(--space-2) 0;
  overflow-x: auto;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
}

.message-text :deep(code) {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
}

.message-text :deep(pre code) {
  background-color: transparent;
  border: none;
  padding: 0;
}

.message-text :deep(a) {
  color: var(--bg-button);
  text-decoration: underline;
  text-decoration-style: dotted;
  transition: text-decoration-style var(--transition-fast);
}

.message-text :deep(a:hover) {
  text-decoration-style: solid;
}

.message-text :deep(strong) {
  font-weight: var(--font-weight-semibold);
}

.message-text :deep(em) {
  font-style: italic;
}

/* Enhanced Markdown Styles */
.message-text :deep(h1) {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: var(--space-4) 0 var(--space-3) 0;
  line-height: var(--line-height-tight);
  border-bottom: 2px solid var(--border-primary);
  padding-bottom: var(--space-1);
}

.message-text :deep(h2) {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: var(--space-3) 0 var(--space-2) 0;
  line-height: var(--line-height-tight);
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: var(--space-1);
}

.message-text :deep(h3) {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: var(--space-3) 0 var(--space-2) 0;
  line-height: var(--line-height-tight);
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: var(--space-2) 0;
  padding-left: var(--space-6);
}

.message-text :deep(li) {
  margin: var(--space-1) 0;
  line-height: var(--line-height-normal);
}

.message-text :deep(ul li) {
  list-style-type: disc;
}

.message-text :deep(ol li) {
  list-style-type: decimal;
}

.message-text :deep(blockquote) {
  margin: var(--space-3) 0;
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-secondary);
  border-left: 4px solid var(--bg-button);
  border-radius: var(--radius-md);
  font-style: italic;
  color: var(--text-secondary);
}

.message-text :deep(blockquote p) {
  margin: 0;
}

.message-text :deep(hr) {
  margin: var(--space-4) 0;
  border: none;
  border-top: 1px solid var(--border-primary);
  opacity: 0.6;
}

.message-text :deep(del) {
  text-decoration: line-through;
  opacity: 0.7;
}

/* Code block copy button */
.message-text :deep(pre) {
  position: relative;
}

.message-text :deep(.code-copy) {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 12px;
  line-height: 1;
  padding: 6px 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.message-text :deep(.code-copy:hover) {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

/* Table zebra striping */
.message-text :deep(table.md-table tbody tr:nth-child(even)) {
  background: color-mix(in srgb, var(--bg-secondary) 60%, transparent);
}

/* Tables */
.message-text :deep(table.md-table) {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-3) 0;
  overflow: hidden;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
}

.message-text :deep(table.md-table th),
.message-text :deep(table.md-table td) {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-primary);
  text-align: left;
  vertical-align: top;
}

.message-text :deep(table.md-table thead th) {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
  position: sticky;
  top: 0;
  z-index: 1;
}

.message-text :deep(table.md-table tr:last-child td) {
  border-bottom: none;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  margin-top: var(--space-2);
  padding-left: var(--space-4);
}

.typing-dots {
  display: flex;
  gap: var(--space-1);
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--text-tertiary);
  animation: typingPulse 1.5s ease-in-out infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingPulse {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  30% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.message-streaming {
  animation: none;
}

.message-streaming .message-text {
  position: relative;
}

.message-streaming .message-text::after {
  content: '';
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: var(--text-primary);
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@media (max-width: 768px) {
  .message-content {
    margin-left: 0;
  }
  
  .message-header {
    margin-bottom: var(--space-3);
  }
  
  .message-user .message-text {
    max-width: 95%;
  }
}

@media (max-width: 480px) {
  .message-text {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-sm);
  }
  
  .message-actions {
    opacity: 1;
  }
}
</style>
