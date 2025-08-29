# ChatGPT at Home - Ollama Stop Script (Windows PowerShell)
# Stops the Ollama server started by start-ollama.ps1

# Logging function
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $Color
}

Write-Log "🛑 Stopping ChatGPT at Home - Ollama Backend" -Color Blue

# Check for PID file
if (Test-Path ".ollama.pid") {
    try {
        $PID = Get-Content ".ollama.pid" -ErrorAction Stop
        $process = Get-Process -Id $PID -ErrorAction SilentlyContinue
        
        if ($process) {
            Write-Log "⏹ Stopping Ollama server (PID: $PID)..." -Color Blue
            Stop-Process -Id $PID -Force -ErrorAction SilentlyContinue
            
            # Wait for process to stop
            Start-Sleep -Seconds 2
            
            # Check if process is still running
            $stillRunning = Get-Process -Id $PID -ErrorAction SilentlyContinue
            if ($stillRunning) {
                Write-Log "⚠ Force stopping process..." -Color Yellow
                Stop-Process -Id $PID -Force -ErrorAction SilentlyContinue
            }
            
            Write-Log "✓ Ollama server stopped" -Color Green
        }
        else {
            Write-Log "⚠ Process with PID $PID is not running" -Color Yellow
        }
        
        # Clean up PID file
        Remove-Item ".ollama.pid" -ErrorAction SilentlyContinue
        Write-Log "✓ Cleanup complete" -Color Green
    }
    catch {
        Write-Log "⚠ Error reading PID file: $($_.Exception.Message)" -Color Yellow
    }
}
else {
    Write-Log "⚠ No PID file found (.ollama.pid)" -Color Yellow
    
    # Try to find and stop ollama processes
    try {
        $ollamaProcesses = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
        
        if ($ollamaProcesses) {
            Write-Log "🔍 Found running Ollama processes: $($ollamaProcesses.Id -join ', ')" -Color Blue
            $ollamaProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Write-Log "✓ Ollama processes stopped" -Color Green
        }
        else {
            Write-Log "ℹ No running Ollama processes found" -Color Green
        }
    }
    catch {
        Write-Log "⚠ Error stopping Ollama processes: $($_.Exception.Message)" -Color Yellow
    }
}

Write-Log "🏁 ChatGPT at Home backend stopped" -Color Green