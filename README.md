# ChatGPT at Home

A modern, privacy-focused chat interface that brings ChatGPT-like conversations to your local machine using Ollama. Built with Vue.js 3 and designed for simplicity, performance, and user experience.

![ChatGPT at Home Screenshot](https://via.placeholder.com/800x500/1a1a1a/ffffff?text=ChatGPT+at+Home+Interface)

## ✨ Features

### 🤖 **AI-Powered Conversations**
- **Local AI Processing**: Uses Ollama with gpt-oss:20b model for completely private conversations
- **Real-time Streaming**: Watch responses generate in real-time with streaming support
- **Context Awareness**: Maintains conversation history for meaningful, contextual responses

### 🎨 **Modern Interface**
- **Clean Design**: Inspired by ChatGPT and Claude interfaces with modern aesthetics
- **Dark & Light Themes**: Toggle between themes with system preference detection
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Typography**: Geist font family for optimal readability and modern aesthetics
- **Icons**: Lucide icons for consistent, beautiful iconography

### 💬 **Advanced Chat Features**
- **Message Management**: Edit, delete, copy, and retry messages
- **Conversation Export**: Save your chats as JSON, TXT, or Markdown
- **Auto-scroll**: Smart scrolling keeps you focused on the latest messages
- **Typing Indicators**: Visual feedback during response generation

### 🛠️ **Developer Experience**
- **Vue.js 3**: Built with the latest Vue.js using Composition API
- **Vite**: Lightning-fast development and optimized production builds
- **TypeScript Ready**: Easy to extend with TypeScript support
- **Component Architecture**: Well-organized, reusable Vue components

### 🔒 **Privacy & Security**
- **100% Local**: No data leaves your device - all conversations stay private
- **No Tracking**: No analytics, cookies, or external data collection
- **Offline Capable**: Works without internet connection once set up
- **Local Storage**: Conversations saved locally on your device

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **Ollama** installed and running locally

### Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/your-repo/chatgpt-at-home.git
   cd chatgpt-at-home
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Ollama** (see [Setup Guide](./setup-guide.md) for detailed instructions)
   ```bash
   # Install Ollama (example for macOS)
   brew install ollama
   
   # Pull the model
   ollama pull gpt-oss:20b
   ```

4. **Start everything with one command**
   ```bash
   # Starts Ollama server, loads model, and launches web app
   npm start
   ```

5. **Open your browser** to the URL shown in the terminal (usually `http://localhost:3000`)

That's it! The startup script handles everything automatically.

## 📦 Available Scripts

### 🚀 **Easy Startup (Recommended)**
```bash
# Start everything (Ollama + Web App)
npm start

# Stop all services
npm stop
```

### 🔧 **Individual Services**
```bash
# Start only Ollama server
npm run start:ollama

# Start only web application
npm run start:web

# Development server only (manual Ollama setup required)
npm run dev
```

### 🏗️ **Build & Deploy**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Serve production build on port 3000
npm run serve
```

### 🖥️ **Manual Scripts** 
```bash
# macOS/Linux manual startup
./start-ollama.sh

# Windows manual startup
.\start-ollama.ps1

# Stop Ollama (macOS/Linux)
./stop-ollama.sh

# Stop Ollama (Windows)
.\stop-ollama.ps1
```

## 🏗️ Architecture

### Project Structure
```
chatgpt-at-home/
├── src/
│   ├── components/          # Vue components
│   │   ├── ChatContainer.vue    # Main chat interface
│   │   ├── MessageList.vue      # Message history display
│   │   ├── MessageBubble.vue    # Individual message component
│   │   ├── ChatInput.vue        # Message input with controls
│   │   └── ThemeToggle.vue      # Dark/light mode toggle
│   ├── composables/         # Reusable logic
│   │   ├── useChat.js          # Chat state management
│   │   └── useOllama.js        # Ollama API integration
│   ├── styles/              # CSS styles
│   │   ├── variables.css       # CSS custom properties
│   │   └── main.css           # Global styles
│   ├── App.vue              # Root component
│   └── main.js              # Application entry point
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

### Key Components

- **`useOllama`**: Handles API communication with streaming support and error handling
- **`useChat`**: Manages conversation state, message history, and local persistence
- **`ChatContainer`**: Main interface orchestrating all chat functionality
- **`MessageList`**: Displays conversation with auto-scroll and connection status
- **`MessageBubble`**: Individual message with copy, edit, delete actions
- **`ChatInput`**: Advanced input with shortcuts, validation, and controls

## 🎯 Core Features Deep Dive

### Chat Management
- **Persistent Storage**: Conversations automatically saved to localStorage
- **Message Limits**: Automatic cleanup after 1000 messages for performance
- **Edit History**: Edit user messages and regenerate responses
- **Export Options**: Multiple format support (JSON, TXT, Markdown)

### Ollama Integration
- **Connection Management**: Automatic connection retry with status indicators
- **Model Validation**: Ensures gpt-oss:20b model is available before starting
- **Streaming Support**: Real-time response display with proper error handling
- **Timeout Handling**: Robust timeout and retry logic for reliability

### User Experience
- **Keyboard Shortcuts**: 
  - `Enter` to send messages
  - `Shift+Enter` for new lines
  - `Ctrl/Cmd+K` to clear conversation
  - `Escape` to stop generation
- **Responsive Design**: Adapts to all screen sizes with mobile-first approach
- **Theme System**: Persistent theme selection with system preference detection
- **Loading States**: Clear visual feedback for all async operations

## 🔧 Configuration

### Ollama Settings
The application connects to Ollama on `http://localhost:11434` by default. You can modify the configuration in `src/composables/useOllama.js`:

```javascript
const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:11434',  // Ollama server URL
  model: 'gpt-oss:20b',               // Model name
  timeout: 30000,                     // Request timeout (ms)
  maxRetries: 3,                      // Connection retry attempts
  retryDelay: 1000                    // Delay between retries (ms)
}
```

### Build Configuration
Customize the build process in `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    port: 3000,        // Development server port
    host: true,        // Listen on all network interfaces
    open: true         // Automatically open browser
  },
  build: {
    outDir: 'dist',    // Output directory
    sourcemap: false   // Generate source maps
  }
})
```

## 🚨 Troubleshooting

### Common Issues

**"Connection failed" error**
- Ensure Ollama is running: `ollama serve`
- Verify the model is installed: `ollama list`
- Check if port 11434 is accessible

**Model not found**
- Install the model: `ollama pull gpt-oss:20b`
- Wait for download to complete (model is ~15GB)
- Restart Ollama service after installation

**Slow responses**
- Ensure sufficient RAM (16GB+ recommended)
- Close other resource-intensive applications
- Consider using a smaller model for testing

**Build errors**
- Clear node modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 16+)
- Update dependencies: `npm update`

See [Setup Guide](./setup-guide.md) for detailed troubleshooting steps.

## 🛡️ Security & Privacy

- **Local Processing**: All AI processing happens on your machine
- **No External Calls**: No data sent to external servers or APIs
- **Local Storage Only**: Conversations stored in browser localStorage
- **No Tracking**: No analytics, telemetry, or user tracking
- **Open Source**: Full source code available for inspection

## 🔮 Roadmap

### Planned Features
- [ ] **Multiple Model Support**: Switch between different Ollama models
- [ ] **Conversation Management**: Multiple chat threads and organization
- [ ] **Message Search**: Find specific messages across conversations
- [ ] **Custom Prompts**: Save and reuse system prompts
- [ ] **PWA Support**: Install as desktop/mobile app
- [ ] **Voice Input**: Speech-to-text integration
- [ ] **Plugin System**: Extensible architecture for custom features

### Performance Improvements
- [ ] **Virtual Scrolling**: Handle thousands of messages efficiently
- [ ] **Message Caching**: Improve loading performance
- [ ] **Background Sync**: Sync conversations across devices locally

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style
4. **Test thoroughly**: Ensure your changes work across different scenarios
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes and their benefits

### Development Guidelines
- Use Vue 3 Composition API patterns
- Follow the existing component structure
- Add comments for complex logic
- Test on multiple browsers and screen sizes
- Maintain accessibility standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

- Vinny Carpenter — https://vinny.dev/

## 🎨 Design System

### Typography
- **Font Family**: [Geist](https://vercel.com/font) by Vercel - A modern, geometric sans-serif
- **Monospace**: Geist Mono for code blocks and technical content
- **Fallbacks**: System fonts including -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

### Icons
- **Icon Library**: [Lucide](https://lucide.dev/) - Beautiful, customizable SVG icons
- **Style**: Consistent 2px stroke width, 24x24 default size
- **Usage**: Semantic icons for actions (send, copy, edit, delete, etc.)

### Color Palette
- **Dynamic Theming**: CSS custom properties for light/dark modes
- **Accessibility**: WCAG AA compliant contrast ratios
- **Semantic Colors**: Purpose-driven color tokens for consistent UX

## 🙏 Acknowledgments

- **Ollama Team**: For creating an excellent local LLM platform
- **Vue.js Team**: For the amazing reactive framework
- **Vite Team**: For the incredibly fast build tool
- **OpenAI**: For inspiring the chat interface design
- **Lucide**: For the beautiful icon system
- **Vercel**: For the Geist font family

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anthropics/claude-code/discussions)
- **Documentation**: [Setup Guide](./setup-guide.md)

---

**Made with ❤️ for privacy-conscious AI enthusiasts**

*ChatGPT at Home - Because your conversations should stay at home.*
