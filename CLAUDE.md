# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (requires Ollama running separately)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Serve production build on port 3000
npm run serve
```

## Startup Commands (Recommended)

```bash
# Start everything (Ollama + Web App) - RECOMMENDED
npm start

# Individual services
npm run start:ollama    # Start only Ollama server
npm run start:web       # Start only web application  
npm run start:all       # Start both services

# Stop all services
npm stop
```

## Architecture Overview

This is a Vue.js 3 chat application that integrates with Ollama for local AI processing. The application uses a composable-based architecture with reactive state management.

### Core Composables

- **`useOllama`** (`src/composables/useOllama.js`): Handles all Ollama API communication including streaming responses, connection management, and error handling. Uses `/ollama` proxy path to avoid CORS issues.

- **`useChat`** (`src/composables/useChat.js`): Manages conversation state, message history, local storage persistence, and conversation management. Supports multiple conversations with auto-save.

### Key Components

- **`ChatContainer.vue`**: Main orchestrator component that combines chat interface with sidebar
- **`ChatSidebar.vue`**: Conversation management sidebar with new chat, history, and conversation controls
- **`MessageList.vue`**: Displays conversation messages with auto-scroll and streaming support
- **`MessageBubble.vue`**: Individual message component with copy, edit, delete actions
- **`ChatInput.vue`**: Message input with keyboard shortcuts, validation, and send controls
- **`LogoMark.vue`**: Application logo component
- **`ThemeToggle.vue`**: Dark/light theme switcher

### Configuration & Proxy

The application uses Vite's proxy configuration to route `/ollama` requests to `http://127.0.0.1:11434` during development (see `vite.config.js`). In production, you need a reverse proxy mapping `/ollama/*` to the local Ollama daemon.

Default Ollama configuration:
- Model: `gpt-oss:20b`
- Base URL: `/ollama` (proxied)
- Timeout: 30000ms
- Max retries: 3

### Data Flow

1. **Message Sending**: User input → `ChatInput` → `useChat.sendMessage()` → `useOllama.generateResponse()` → streaming display in `MessageList`
2. **Conversation Management**: Multiple conversations stored in localStorage with auto-save
3. **State Management**: Reactive refs and computed values, no external state library needed

### Local Storage

- Conversations: `chatgpt-at-home-conversations` (current)
- Legacy: `chatgpt-at-home-messages` (migrated automatically)
- Auto-cleanup: Messages limited to 1000 per conversation

### Startup Process

The `scripts/start-helper.js` Node script handles cross-platform startup:
1. Checks Ollama installation
2. Starts Ollama server using platform-specific scripts
3. Waits for server readiness
4. Launches web application
5. Provides cleanup on exit

### Key Features

- Real-time streaming chat responses
- Message editing, deletion, and retry functionality
- Export conversations (JSON, TXT, Markdown)
- Keyboard shortcuts (Enter to send, Shift+Enter for newline, Ctrl/Cmd+K to clear, Escape to cancel)
- Dark/light theme with system preference detection
- Responsive design with mobile support
- Connection status monitoring and automatic retry
- Multiple conversation management with sidebar