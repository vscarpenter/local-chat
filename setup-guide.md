# ChatGPT at Home - Complete Setup Guide

This comprehensive guide will help you set up ChatGPT at Home from scratch, regardless of your technical experience level.

**Design Features**: Modern interface using Geist typography and Lucide icons for a clean, accessible experience.

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Step 1: Install Prerequisites](#step-1-install-prerequisites)
3. [Step 2: Set up Ollama](#step-2-set-up-ollama)
4. [Step 3: Install the Application](#step-3-install-the-application)
5. [Step 4: First Run](#step-4-first-run)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Configuration](#advanced-configuration)
8. [Performance Optimization](#performance-optimization)

## 🖥️ System Requirements

### Minimum Requirements
- **RAM**: 16 GB (8 GB for smaller models)
- **Storage**: 20 GB free space (15 GB for gpt-oss:20b model)
- **CPU**: Modern 64-bit processor (Intel/AMD/Apple Silicon)
- **Internet**: Required for initial setup and model downloads

### Recommended Requirements
- **RAM**: 32 GB or more for optimal performance
- **Storage**: SSD with 50+ GB free space
- **CPU**: Multi-core processor (8+ cores recommended)
- **GPU**: NVIDIA GPU with 8+ GB VRAM (optional, for GPU acceleration)

### Operating System Support
- ✅ **macOS**: 10.15+ (Intel and Apple Silicon)
- ✅ **Windows**: 10/11 (64-bit)
- ✅ **Linux**: Most modern distributions (Ubuntu, Debian, Fedora, etc.)

## 🔧 Step 1: Install Prerequisites

### Node.js and npm

Node.js is required to run the ChatGPT at Home application.

#### Windows

1. **Download Node.js**
   - Go to [nodejs.org](https://nodejs.org/)
   - Download the LTS version (18.x or 20.x recommended)
   - Run the installer and follow the setup wizard

2. **Verify Installation**
   ```cmd
   node --version
   npm --version
   ```

#### macOS

**Option A: Direct Download**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS version
3. Run the installer

**Option B: Using Homebrew (Recommended)**
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

**Verify Installation**
```bash
node --version
npm --version
```

#### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Linux (Fedora/CentOS/RHEL)

```bash
# Using dnf (Fedora)
sudo dnf install nodejs npm

# Using yum (CentOS/RHEL)
sudo yum install nodejs npm

# Verify installation
node --version
npm --version
```

## 🤖 Step 2: Set up Ollama

Ollama is the local AI server that powers the chat functionality.

### Install Ollama

#### Windows

1. **Download Ollama**
   - Go to [ollama.ai](https://ollama.ai/)
   - Download the Windows installer
   - Run the installer as Administrator

2. **Verify Installation**
   ```cmd
   ollama --version
   ```

#### macOS

**Option A: Direct Download**
1. Go to [ollama.ai](https://ollama.ai/)
2. Download the macOS installer
3. Drag Ollama to Applications folder

**Option B: Using Homebrew**
```bash
brew install ollama
```

**Verify Installation**
```bash
ollama --version
```

#### Linux

```bash
# Download and install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Verify installation
ollama --version
```

### Start Ollama Service

#### Windows
1. **Start Ollama**
   - Open Command Prompt as Administrator
   - Run: `ollama serve`
   - Keep this terminal open

2. **Alternative: Run as Service**
   ```cmd
   # Install as Windows service
   ollama install
   ollama start
   ```

#### macOS/Linux
```bash
# Start Ollama server
ollama serve
```

**Keep this terminal open** - Ollama needs to run continuously for the chat to work.

### Download the AI Model

Open a **new terminal window** (keep the `ollama serve` terminal running) and download the gpt-oss:20b model:

```bash
# Download the model (this will take 10-30 minutes depending on your internet speed)
ollama pull gpt-oss:20b
```

**Model Download Information:**
- **Size**: ~15 GB
- **Time**: 10-30 minutes (varies by internet speed)
- **Storage**: Saved in Ollama's data directory

### Verify Ollama Setup

```bash
# List installed models
ollama list

# Test the model (optional)
ollama run gpt-oss:20b "Hello, how are you today?"
```

You should see the gpt-oss:20b model in the list and get a response from the test command.

## 📱 Step 3: Install the Application

### Download the Application

#### Option A: Download from GitHub
1. Go to the ChatGPT at Home repository
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file to your desired location

#### Option B: Clone with Git
```bash
# Clone the repository
git clone https://github.com/your-repo/chatgpt-at-home.git
cd chatgpt-at-home
```

### Install Dependencies

Navigate to the application folder and install the required packages:

#### Windows (Command Prompt or PowerShell)
```cmd
cd path\to\chatgpt-at-home
npm install
```

#### macOS/Linux (Terminal)
```bash
cd /path/to/chatgpt-at-home
npm install
```

**Note**: This process will take 2-5 minutes to download all required packages.

## 🚀 Step 4: First Run

### 🎯 **Automated Startup (Recommended)**

The easiest way to start everything:

```bash
# Single command to start Ollama server, load model, and launch web app
npm start
```

This will:
1. ✅ Check if Ollama is installed and running
2. ✅ Start Ollama server in headless mode  
3. ✅ Load the gpt-oss:20b model into memory
4. ✅ Launch the web application
5. ✅ Open the correct URL in your terminal

You should see output like:
```
🏠 ChatGPT at Home - Startup Helper
================================
🚀 Starting Ollama server...
✅ Ollama server started successfully  
⏳ Waiting for Ollama to initialize...
🌐 Starting web application...
✅ Web application started
================================
🎉 ChatGPT at Home is ready!
📱 Open your browser to start chatting
⌨️  Press Ctrl+C to stop all services

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
```

### 🔧 **Manual Startup (Advanced Users)**

If you prefer manual control or need to troubleshoot:

#### Step 1: Start Ollama Manually
```bash
# Terminal 1 - Start Ollama server
ollama serve

# Terminal 2 - Load the model  
ollama run gpt-oss:20b ""
```

#### Step 2: Start Web Application
```bash
# Terminal 3 - Start web app
npm run dev
```

### Access the Application

1. **Open your web browser**
2. **Go to**: `http://localhost:3000`
3. **You should see** the ChatGPT at Home interface

### Test Your Setup

1. **Check the connection status** in the header (should show "Connected to Ollama")
2. **Type a test message**: "Hello, please introduce yourself"
3. **Press Enter** or click the send button
4. **Wait for the response** (first response may be slower)

🎉 **Congratulations!** If you see a response from the AI, your setup is complete!

## 🔍 Troubleshooting

### Common Issues and Solutions

#### Issue: "Connection failed" Error

**Symptoms**: Red connection status, cannot send messages

**Solutions**:
1. **Check if Ollama is running**
   ```bash
   # In a new terminal
   curl http://localhost:11434/api/tags
   ```
   Should return JSON with models list.

2. **Restart Ollama**
   - Stop the `ollama serve` process (Ctrl+C)
   - Wait 5 seconds
   - Run `ollama serve` again

3. **Check the port**
   - Ollama runs on port 11434 by default
   - Ensure no other application is using this port

#### Issue: "Model not found" Error

**Symptoms**: Connection works but chat fails with model error

**Solutions**:
1. **Verify model installation**
   ```bash
   ollama list
   ```
   Should show `gpt-oss:20b` in the list.

2. **Re-download the model**
   ```bash
   ollama pull gpt-oss:20b
   ```

3. **Check model name**
   - Ensure the model name in the app matches exactly
   - Default is `gpt-oss:20b`

#### Issue: Very Slow Responses

**Symptoms**: Messages send but responses take several minutes

**Solutions**:
1. **Check available RAM**
   - Close unnecessary applications
   - Ensure at least 16 GB total RAM with 8+ GB free

2. **Use a smaller model (if needed)**
   ```bash
   # Alternative smaller models
   ollama pull llama2:7b
   ollama pull mistral:7b
   ```
   Then update the model name in `src/composables/useOllama.js`

3. **Check CPU usage**
   - High CPU usage during generation is normal
   - Ensure your computer can stay cool under load

#### Issue: Application Won't Start

**Symptoms**: `npm run dev` fails or shows errors

**Solutions**:
1. **Check Node.js version**
   ```bash
   node --version
   ```
   Should be 16.x or higher.

2. **Clear node_modules and reinstall**
   ```bash
   # Remove node_modules directory
   rm -rf node_modules  # macOS/Linux
   rmdir /s node_modules  # Windows
   
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   npm install
   ```

3. **Check for permission issues (Windows)**
   - Run Command Prompt as Administrator
   - Try the installation again

#### Issue: Browser Shows Blank Page

**Symptoms**: Browser loads but shows empty/white page

**Solutions**:
1. **Check browser console**
   - Press F12 to open developer tools
   - Look for errors in the Console tab

2. **Try a different browser**
   - Test with Chrome, Firefox, Safari, or Edge
   - Disable browser extensions temporarily

3. **Clear browser cache**
   - Hard refresh with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### Getting Help

If you're still having issues:

1. **Check the browser console** (F12 → Console tab) for error messages
2. **Look at the terminal** where you ran `npm run dev` for errors
3. **Create an issue** on GitHub with:
   - Your operating system
   - Node.js version (`node --version`)
   - Error messages (both browser console and terminal)
   - Steps you've already tried

## ⚙️ Advanced Configuration

### Customizing Ollama Settings

Edit `src/composables/useOllama.js` to modify:

```javascript
const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:11434',  // Change if Ollama runs elsewhere
  model: 'gpt-oss:20b',               // Change to use different models
  timeout: 30000,                     // Increase for slower hardware
  maxRetries: 3,                      // Connection retry attempts
  retryDelay: 1000                    // Delay between retries
}
```

### Using Different Models

1. **Download alternative models**
   ```bash
   # Faster, smaller models
   ollama pull llama2:7b
   ollama pull mistral:7b-instruct
   ollama pull codellama:7b
   
   # Larger, more capable models (if you have enough RAM)
   ollama pull llama2:70b
   ollama pull mixtral:8x7b
   ```

2. **Update the configuration**
   - Edit `src/composables/useOllama.js`
   - Change the `model` value to your preferred model
   - Restart the development server

### Running on a Different Port

Change the development server port in `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    port: 3001,  // Change to your preferred port
    host: true,
    open: true
  }
})
```

### Production Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Serve the built files**
   ```bash
   npm run preview
   ```

3. **Deploy to web server**
   - Copy the `dist` folder to your web server
   - Ensure Ollama is accessible from the deployment environment

## 🚀 Performance Optimization

### Hardware Recommendations

**For Best Performance:**
- **CPU**: AMD Ryzen 7/9 or Intel Core i7/i9
- **RAM**: 32+ GB DDR4/DDR5
- **Storage**: NVMe SSD
- **GPU**: NVIDIA RTX 3080+ (for GPU acceleration)

### Ollama Performance Tuning

1. **Enable GPU acceleration (NVIDIA)**
   ```bash
   # Install CUDA and appropriate drivers
   # Ollama will automatically use GPU if available
   ```

2. **Adjust context window**
   ```bash
   # Run model with custom context size
   ollama run gpt-oss:20b --context 4096
   ```

3. **Model quantization**
   - Use quantized versions for better performance
   - Example: `gpt-oss:20b:q4_0` (4-bit quantized)

### Application Performance

1. **Browser optimization**
   - Use Chrome or Firefox for best performance
   - Disable unnecessary extensions
   - Close other tabs/applications

2. **Memory management**
   - Application automatically limits message history
   - Clear conversation periodically for very long chats
   - Export important conversations before clearing

### Monitoring Performance

1. **Check resource usage**
   - Task Manager (Windows) or Activity Monitor (macOS)
   - Monitor CPU, RAM, and disk usage during conversations

2. **Ollama logs**
   ```bash
   # View Ollama logs for performance insights
   ollama logs
   ```

## 📊 Usage Tips

### Keyboard Shortcuts
- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Ctrl/Cmd + K**: Clear conversation
- **Escape**: Stop generation
- **↑ Arrow**: Edit last message (when input is empty)

### Message Management
- **Edit messages**: Click the edit icon on user messages
- **Copy responses**: Click copy icon on any message
- **Delete messages**: Remove individual messages from history
- **Export conversations**: Save as JSON, TXT, or Markdown

### Best Practices
- **Keep conversations focused** for better context retention
- **Use clear, specific questions** for better responses
- **Break complex tasks** into smaller questions
- **Export important conversations** before clearing history

---

## 🆘 Still Need Help?

If this guide didn't solve your problem:

1. **Search existing issues**: Check GitHub issues for similar problems
2. **Create a new issue**: Include your OS, Node version, and error details
3. **Join discussions**: GitHub Discussions for general questions
4. **Check documentation**: Review the README for additional information

**Remember**: This is a local application - your conversations never leave your device! 🔒

---

*Happy chatting with your local AI assistant!* 🤖✨