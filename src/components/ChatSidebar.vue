<template>
  <aside :class="['chat-sidebar', { open: isOpen }]">
    <div class="sidebar-header">
      <button class="btn btn-primary new-chat" @click="$emit('new-chat')" aria-label="Start new chat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New Chat
      </button>
    </div>

    <nav class="sidebar-list">
      <button
        v-for="conv in conversations"
        :key="conv.id"
        :class="['sidebar-item', { active: conv.id === activeId }]"
        @click="$emit('select', conv.id)"
        :title="formatTime(conv.updatedAt)"
      >
        <div class="item-title">{{ conv.title || 'New Chat' }}</div>
        <div class="item-sub">{{ relativeTime(conv.updatedAt) }}</div>
        <div class="item-actions">
          <button class="icon-btn" @click.stop="onRename(conv)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="icon-btn danger" @click.stop="$emit('delete', conv.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
            </svg>
          </button>
        </div>
      </button>
    </nav>
  </aside>
</template>

<script setup>
const props = defineProps({
  conversations: { type: Array, default: () => [] },
  activeId: { type: String, default: '' },
  isOpen: { type: Boolean, default: true }
})

const emit = defineEmits(['select', 'new-chat', 'rename', 'delete'])

function onRename(conv) {
  const current = conv.title || 'New Chat'
  const name = window.prompt('Rename conversation', current)
  if (name !== null) emit('rename', { id: conv.id, title: name })
}

function formatTime(d) {
  try { return new Date(d).toLocaleString() } catch { return '' }
}

function relativeTime(d) {
  const date = new Date(d)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.chat-sidebar {
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
  padding: var(--space-4) var(--space-3);
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  margin-bottom: var(--space-4);
}

.new-chat {
  width: 100%;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  justify-content: center;
}

.sidebar-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sidebar-item {
  text-align: left;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
  align-items: center;
  color: var(--text-primary);
}

.sidebar-item.active {
  outline: 2px solid var(--border-input-focus);
}

.item-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-sub {
  grid-column: 1 / 2;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.item-actions {
  display: none;
  gap: var(--space-1);
}

.sidebar-item:hover .item-actions {
  display: inline-flex;
}

.icon-btn {
  padding: 4px;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
}

.icon-btn:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.icon-btn.danger:hover {
  color: #ef4444;
}

@media (max-width: 900px) {
  .chat-sidebar {
    position: fixed;
    top: var(--header-height);
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
    z-index: 30;
  }
  .chat-sidebar.open {
    transform: translateX(0);
  }
}
</style>

