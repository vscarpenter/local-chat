# ChatGPT at Home - Ollama Startup Script (Windows PowerShell)
# Starts Ollama server and loads the gpt-oss:20b model in headless mode

param(
    [switch]$Daemon,
    [switch]$Help,
    [string]$ModelName = "gpt-oss:20b",
    [string]$OllamaHost = "http://localhost:11434"
)

# Configuration
$MaxWaitTime = 30
$CheckInterval = 2
$LogFile = "ollama-startup.log"

# Show help
if ($Help) {
    Write-Host "ChatGPT at Home - Ollama Startup Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\start-ollama.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Daemon       Run in daemon mode (background)" -ForegroundColor Gray
    Write-Host "  -Help         Show this help message" -ForegroundColor Gray
    Write-Host "  -ModelName    Model to load (default: $ModelName)" -ForegroundColor Gray
    Write-Host "  -OllamaHost   Ollama server URL (default: $OllamaHost)" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $logMessage
}

# Error handling function
function Write-Error-Exit {
    param([string]$Message)
    Write-Log "ERROR: $Message" -Color Red
    exit 1
}

# Check if ollama is installed
function Test-OllamaInstalled {
    try {
        $null = Get-Command ollama -ErrorAction Stop
        Write-Log "✓ Ollama found" -Color Green
        return $true
    }
    catch {
        Write-Error-Exit "Ollama is not installed. Please install it first: https://ollama.ai/"
    }
}

# Check if ollama server is running
function Test-OllamaRunning {
    try {
        $response = Invoke-WebRequest -Uri "$OllamaHost/api/version" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Start ollama server in background
function Start-OllamaServer {
    if (Test-OllamaRunning) {
        Write-Log "⚠ Ollama server is already running" -Color Yellow
        return
    }

    Write-Log "🚀 Starting Ollama server..." -Color Blue
    
    try {
        # Start ollama serve in background
        $process = Start-Process -FilePath "ollama" -ArgumentList "serve" -NoNewWindow -PassThru -RedirectStandardOutput $LogFile -RedirectStandardError $LogFile
        $global:OllamaPID = $process.Id
        
        # Save PID to file
        $process.Id | Out-File -FilePath ".ollama.pid" -Encoding ASCII
        
        # Wait for server to be ready
        $waitTime = 0
        while ($waitTime -lt $MaxWaitTime) {
            if (Test-OllamaRunning) {
                Write-Log "✓ Ollama server started successfully (PID: $($process.Id))" -Color Green
                return
            }
            
            Start-Sleep -Seconds $CheckInterval
            $waitTime += $CheckInterval
            Write-Log "⏳ Waiting for Ollama server to start... ($waitTime/$MaxWaitTime s)" -Color Blue
        }
        
        Write-Error-Exit "Ollama server failed to start within $MaxWaitTime seconds"
    }
    catch {
        Write-Error-Exit "Failed to start Ollama server: $($_.Exception.Message)"
    }
}

# Check if model is available
function Test-ModelAvailable {
    try {
        $output = & ollama list 2>&1
        return $output -match $ModelName
    }
    catch {
        return $false
    }
}

# Load the model
function Start-ModelLoad {
    if (Test-ModelAvailable) {
        Write-Log "⚠ Model $ModelName is already available" -Color Yellow
    }
    else {
        Write-Log "📥 Model $ModelName not found. Please install it first:" -Color Blue
        Write-Log "   ollama pull $ModelName" -Color Blue
        Write-Error-Exit "Model $ModelName is not installed"
    }
    
    Write-Log "🔄 Loading model $ModelName..." -Color Blue
    
    try {
        # Run the model with empty input to load it into memory
        $null = "" | & ollama run $ModelName --verbose 2>&1
        Write-Log "✓ Model $ModelName loaded successfully" -Color Green
    }
    catch {
        Write-Error-Exit "Failed to load model $ModelName`: $($_.Exception.Message)"
    }
}

# Verify everything is working
function Test-Setup {
    Write-Log "🔍 Verifying setup..." -Color Blue
    
    # Test API endpoint
    if (-not (Test-OllamaRunning)) {
        Write-Error-Exit "Ollama API is not responding"
    }
    
    # Test model availability
    if (-not (Test-ModelAvailable)) {
        Write-Error-Exit "Model $ModelName is not available"
    }
    
    Write-Log "✅ Setup verification complete" -Color Green
    Write-Log "🎉 ChatGPT at Home backend is ready!" -Color Green
    Write-Log "💡 You can now start the web application with: npm run dev" -Color Blue
}

# Cleanup function
function Stop-OllamaCleanup {
    Write-Log "🧹 Cleaning up..." -Color Yellow
    
    if (Test-Path ".ollama.pid") {
        try {
            $pid = Get-Content ".ollama.pid" -ErrorAction Stop
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            
            if ($process) {
                Write-Log "⏹ Stopping Ollama server (PID: $pid)..." -Color Blue
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
            
            Remove-Item ".ollama.pid" -ErrorAction SilentlyContinue
        }
        catch {
            Write-Log "⚠ Could not clean up PID file" -Color Yellow
        }
    }
}

# Signal handler for Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-OllamaCleanup
}

# Main execution
function Start-Main {
    Write-Log "🏠 ChatGPT at Home - Starting Ollama Backend" -Color Blue
    Write-Log "=================================================" -Color Blue
    
    # Create/clear log file
    "" | Out-File -FilePath $LogFile -Encoding UTF8
    
    # Run checks and start services
    Test-OllamaInstalled
    Start-OllamaServer
    Start-Sleep -Seconds 2  # Give server a moment to fully initialize
    Start-ModelLoad
    Test-Setup
    
    Write-Log "=================================================" -Color Green
    Write-Log "🚀 Ready! Ollama is running with $ModelName loaded" -Color Green
    Write-Log "📊 Server: $OllamaHost" -Color Blue
    Write-Log "📝 Logs: $LogFile" -Color Blue
    Write-Log "🛑 To stop: Press Ctrl+C or run: .\stop-ollama.ps1" -Color Blue
    
    # Keep script running to maintain the process
    if (-not $Daemon) {
        Write-Log "⌨️  Press Ctrl+C to stop the server" -Color Yellow
        try {
            while ($true) {
                Start-Sleep -Seconds 10
                if (-not (Test-OllamaRunning)) {
                    Write-Error-Exit "Ollama server stopped unexpectedly"
                }
            }
        }
        catch [System.Management.Automation.PipelineStoppedException] {
            # Handle Ctrl+C gracefully
            Write-Log "👋 Shutting down..." -Color Yellow
        }
        finally {
            Stop-OllamaCleanup
        }
    }
}

# Run main function
try {
    Start-Main
}
catch {
    Write-Error-Exit "Script failed: $($_.Exception.Message)"
}
finally {
    if (-not $Daemon) {
        Stop-OllamaCleanup
    }
}