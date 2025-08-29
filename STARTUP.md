# 🚀 ChatGPT at Home - Startup Scripts

Automated startup scripts to launch Ollama and the web application in headless mode.

## ✨ Quick Start

```bash
# Start everything with one command
npm start

# Stop everything  
npm stop
```

## 📋 What the Scripts Do

### 🔄 **Automated Process**
1. **Check Prerequisites** - Verifies Ollama is installed
2. **Start Ollama Server** - Launches in headless/background mode
3. **Load Model** - Loads gpt-oss:20b into memory
4. **Launch Web App** - Starts the Vue.js development server
5. **Health Check** - Verifies everything is working
6. **Ready!** - Shows you the URL to open

### 🛠️ **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm start` | Start everything (Ollama + Web App) |
| `npm stop` | Stop all services |
| `npm run start:ollama` | Start only Ollama server |
| `npm run start:web` | Start only web application |
| `npm run dev` | Manual development server |

## 📁 Script Files

### Cross-Platform
- `scripts/start-helper.js` - Node.js helper for all platforms
- `package.json` - NPM script definitions

### Platform-Specific
- `start-ollama.sh` - macOS/Linux startup script
- `start-ollama.ps1` - Windows PowerShell startup script  
- `stop-ollama.sh` - macOS/Linux stop script
- `stop-ollama.ps1` - Windows PowerShell stop script

## 🔧 Advanced Usage

### Manual Script Execution

#### macOS/Linux
```bash
# Start Ollama in background
./start-ollama.sh --daemon

# Start Ollama in foreground (with logs)
./start-ollama.sh

# Stop Ollama
./stop-ollama.sh
```

#### Windows
```powershell
# Start Ollama in background
.\start-ollama.ps1 -Daemon

# Start Ollama in foreground (with logs)
.\start-ollama.ps1

# Stop Ollama
.\stop-ollama.ps1
```

### Environment Variables

You can customize the startup scripts with environment variables:

```bash
# Custom model name
MODEL_NAME="llama2:7b" npm start

# Custom Ollama host
OLLAMA_HOST="http://localhost:11435" npm start
```

### Script Options

#### start-ollama.sh / start-ollama.ps1
- `--daemon` / `-Daemon` - Run in background mode
- `--help` / `-Help` - Show help information

## 📊 Monitoring

### Log Files
- `ollama-startup.log` - Ollama server logs
- `startup-helper.log` - Cross-platform helper logs
- `.ollama.pid` - Process ID file for cleanup

### Health Checks
The scripts automatically verify:
- ✅ Ollama installation
- ✅ Model availability  
- ✅ Server connectivity
- ✅ API responsiveness

## 🐛 Troubleshooting

### Common Issues

**"Ollama not installed"**
```bash
# Install Ollama first
# macOS: brew install ollama
# Windows: Download from ollama.ai
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
```

**"Model not found"**
```bash
# Pull the model
ollama pull gpt-oss:20b
```

**"Port already in use"**
- The web app will automatically find an available port
- Ollama uses port 11434 by default

**Scripts won't run (Windows)**
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Manual Cleanup

If scripts don't stop cleanly:

```bash
# Kill Ollama processes (macOS/Linux)
pkill -f "ollama serve"

# Kill Node processes
pkill -f "vite"
```

```powershell
# Kill processes (Windows)
Get-Process -Name "ollama" | Stop-Process -Force
Get-Process -Name "node" | Where-Object {$_.CommandLine -like "*vite*"} | Stop-Process -Force
```

## 🔒 Security Notes

- All processing happens locally on your machine
- No external network connections required (after model download)
- Scripts create temporary PID files for process management
- Logs may contain model responses - review before sharing

## 🎯 Next Steps

After successful startup:
1. Open the URL shown in the terminal
2. Start chatting with your local AI
3. Use `Ctrl+C` or `npm stop` to shut down
4. Check logs if you encounter issues

---

**Happy chatting with your local AI! 🤖✨**