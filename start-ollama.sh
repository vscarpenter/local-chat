#!/bin/bash

# ChatGPT at Home - Ollama Startup Script
# Starts Ollama server and loads the gpt-oss:20b model in headless mode

set -e  # Exit on any error

# Configuration
MODEL_NAME="gpt-oss:20b"
OLLAMA_HOST="http://localhost:11434"
MAX_WAIT_TIME=30
CHECK_INTERVAL=2
LOG_FILE="ollama-startup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling function
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Check if ollama is installed
check_ollama_installed() {
    if ! command -v ollama &> /dev/null; then
        error_exit "Ollama is not installed. Please install it first: https://ollama.ai/"
    fi
    log "${GREEN}✓ Ollama found${NC}"
}

# Check if ollama server is already running
is_ollama_running() {
    curl -s "$OLLAMA_HOST/api/version" &> /dev/null
}

# Start ollama server in background
start_ollama_server() {
    if is_ollama_running; then
        log "${YELLOW}⚠ Ollama server is already running${NC}"
        return 0
    fi

    log "${BLUE}🚀 Starting Ollama server...${NC}"
    
    # Start ollama serve in background
    nohup ollama serve >> "$LOG_FILE" 2>&1 &
    OLLAMA_PID=$!
    
    # Wait for server to be ready
    local wait_time=0
    while [ $wait_time -lt $MAX_WAIT_TIME ]; do
        if is_ollama_running; then
            log "${GREEN}✓ Ollama server started successfully (PID: $OLLAMA_PID)${NC}"
            echo $OLLAMA_PID > .ollama.pid
            return 0
        fi
        
        sleep $CHECK_INTERVAL
        wait_time=$((wait_time + CHECK_INTERVAL))
        log "${BLUE}⏳ Waiting for Ollama server to start... ($wait_time/${MAX_WAIT_TIME}s)${NC}"
    done
    
    error_exit "Ollama server failed to start within $MAX_WAIT_TIME seconds"
}

# Check if model is available
is_model_available() {
    ollama list | grep -q "$MODEL_NAME"
}

# Load the model
load_model() {
    if is_model_available; then
        log "${YELLOW}⚠ Model $MODEL_NAME is already available${NC}"
    else
        log "${BLUE}📥 Model $MODEL_NAME not found. Please install it first:${NC}"
        log "${BLUE}   ollama pull $MODEL_NAME${NC}"
        error_exit "Model $MODEL_NAME is not installed"
    fi
    
    log "${BLUE}🔄 Loading model $MODEL_NAME...${NC}"
    
    # Run the model with empty input to load it into memory
    echo "" | ollama run "$MODEL_NAME" --verbose >> "$LOG_FILE" 2>&1 || {
        error_exit "Failed to load model $MODEL_NAME"
    }
    
    log "${GREEN}✓ Model $MODEL_NAME loaded successfully${NC}"
}

# Verify everything is working
verify_setup() {
    log "${BLUE}🔍 Verifying setup...${NC}"
    
    # Test API endpoint
    if ! curl -s "$OLLAMA_HOST/api/tags" &> /dev/null; then
        error_exit "Ollama API is not responding"
    fi
    
    # Test model availability
    if ! ollama list | grep -q "$MODEL_NAME"; then
        error_exit "Model $MODEL_NAME is not available"
    fi
    
    log "${GREEN}✅ Setup verification complete${NC}"
    log "${GREEN}🎉 ChatGPT at Home backend is ready!${NC}"
    log "${BLUE}💡 You can now start the web application with: npm run dev${NC}"
}

# Cleanup function
cleanup() {
    log "${YELLOW}🧹 Cleaning up...${NC}"
    if [ -f .ollama.pid ]; then
        local pid=$(cat .ollama.pid)
        if kill -0 "$pid" 2>/dev/null; then
            log "${BLUE}⏹ Stopping Ollama server (PID: $pid)...${NC}"
            kill "$pid"
            rm -f .ollama.pid
        fi
    fi
}

# Signal handlers
trap cleanup SIGINT SIGTERM EXIT

# Main execution
main() {
    log "${BLUE}🏠 ChatGPT at Home - Starting Ollama Backend${NC}"
    log "${BLUE}=================================================${NC}"
    
    # Create log file
    touch "$LOG_FILE"
    
    # Run checks and start services
    check_ollama_installed
    start_ollama_server
    sleep 2  # Give server a moment to fully initialize
    load_model
    verify_setup
    
    log "${GREEN}=================================================${NC}"
    log "${GREEN}🚀 Ready! Ollama is running with $MODEL_NAME loaded${NC}"
    log "${BLUE}📊 Server: $OLLAMA_HOST${NC}"
    log "${BLUE}📝 Logs: $LOG_FILE${NC}"
    log "${BLUE}🛑 To stop: Press Ctrl+C or run: ./stop-ollama.sh${NC}"
    
    # Keep script running to maintain the process
    if [ "$1" != "--daemon" ]; then
        log "${YELLOW}⌨️  Press Ctrl+C to stop the server${NC}"
        while true; do
            sleep 10
            if ! is_ollama_running; then
                error_exit "Ollama server stopped unexpectedly"
            fi
        done
    fi
}

# Handle command line arguments
case "$1" in
    --help|-h)
        echo "ChatGPT at Home - Ollama Startup Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --daemon    Run in daemon mode (background)"
        echo "  --help|-h   Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  MODEL_NAME     Model to load (default: $MODEL_NAME)"
        echo "  OLLAMA_HOST    Ollama server URL (default: $OLLAMA_HOST)"
        echo ""
        exit 0
        ;;
    --daemon)
        main --daemon
        ;;
    *)
        main
        ;;
esac