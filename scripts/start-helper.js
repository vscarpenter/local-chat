#!/usr/bin/env node

// ChatGPT at Home - Startup Helper Script
// Cross-platform script to start Ollama and the web application

const { spawn, exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const platform = os.platform();
const isWindows = platform === 'win32';

// Configuration
const config = {
    ollamaScript: isWindows ? 'start-ollama.ps1' : './start-ollama.sh',
    stopScript: isWindows ? 'stop-ollama.ps1' : './stop-ollama.sh',
    logFile: 'startup-helper.log'
};

// Logging function
function log(message, color = '\x1b[0m') {
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`${color}${logMessage}\x1b[0m`);
    
    // Also log to file
    fs.appendFileSync(config.logFile, logMessage + '\n');
}

// Colors
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Error handler
function handleError(message, error) {
    log(`❌ ERROR: ${message}`, colors.red);
    if (error) {
        log(`   Details: ${error.message}`, colors.red);
    }
    process.exit(1);
}

// Check if Ollama is installed
function checkOllamaInstalled() {
    return new Promise((resolve) => {
        exec('ollama --version', (error) => {
            resolve(!error);
        });
    });
}

// Start Ollama server
function startOllama() {
    return new Promise((resolve, reject) => {
        log('🚀 Starting Ollama server...', colors.blue);
        
        let child;
        if (isWindows) {
            child = spawn('powershell.exe', [
                '-ExecutionPolicy', 'Bypass',
                '-File', config.ollamaScript,
                '-Daemon'
            ], { 
                stdio: ['inherit', 'pipe', 'pipe'],
                shell: false 
            });
        } else {
            child = spawn(config.ollamaScript, ['--daemon'], { 
                stdio: ['inherit', 'pipe', 'pipe'] 
            });
        }
        
        let output = '';
        let errorOutput = '';
        
        child.stdout.on('data', (data) => {
            output += data.toString();
            // Look for success indicators
            if (output.includes('Ready! Ollama is running') || output.includes('backend is ready')) {
                log('✅ Ollama server started successfully', colors.green);
                resolve();
            }
        });
        
        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        child.on('error', (error) => {
            reject(new Error(`Failed to start Ollama: ${error.message}`));
        });
        
        child.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Ollama startup script exited with code ${code}. Error: ${errorOutput}`));
            }
        });
        
        // Timeout after 60 seconds
        setTimeout(() => {
            child.kill();
            reject(new Error('Ollama startup timed out after 60 seconds'));
        }, 60000);
        
        // Store process reference for cleanup
        process.ollamaChild = child;
    });
}

// Start web application
function startWebApp() {
    return new Promise((resolve) => {
        log('🌐 Starting web application...', colors.cyan);
        
        const child = spawn('npm', ['run', 'dev'], { 
            stdio: 'inherit',
            shell: true 
        });
        
        child.on('error', (error) => {
            handleError('Failed to start web application', error);
        });
        
        // Store process reference for cleanup
        process.webAppChild = child;
        
        log('✅ Web application started', colors.green);
        resolve();
    });
}

// Cleanup function
function cleanup() {
    log('🧹 Cleaning up processes...', colors.yellow);
    
    if (process.webAppChild) {
        process.webAppChild.kill();
    }
    
    if (process.ollamaChild) {
        process.ollamaChild.kill();
    }
    
    // Also run the stop script
    const stopCommand = isWindows 
        ? `powershell.exe -ExecutionPolicy Bypass -File ${config.stopScript}`
        : config.stopScript;
    
    exec(stopCommand, (error) => {
        if (error) {
            log('⚠️ Error during cleanup, but continuing...', colors.yellow);
        }
        process.exit(0);
    });
}

// Signal handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Main function
async function main() {
    const command = process.argv[2];
    
    // Clear/create log file
    fs.writeFileSync(config.logFile, '');
    
    log('🏠 ChatGPT at Home - Startup Helper', colors.cyan);
    log('================================', colors.cyan);
    
    switch (command) {
        case 'ollama':
            // Check if Ollama is installed
            if (!await checkOllamaInstalled()) {
                handleError('Ollama is not installed. Please install it from https://ollama.ai/');
            }
            
            await startOllama();
            log('🎉 Ollama is ready!', colors.green);
            break;
            
        case 'web':
            await startWebApp();
            break;
            
        case 'all':
        default:
            // Check if Ollama is installed
            if (!await checkOllamaInstalled()) {
                handleError('Ollama is not installed. Please install it from https://ollama.ai/');
            }
            
            // Start Ollama first
            await startOllama();
            
            // Wait a moment for Ollama to fully initialize
            log('⏳ Waiting for Ollama to initialize...', colors.blue);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Start web application
            await startWebApp();
            
            log('================================', colors.green);
            log('🎉 ChatGPT at Home is ready!', colors.green);
            log('📱 Open your browser to start chatting', colors.cyan);
            log('⌨️  Press Ctrl+C to stop all services', colors.yellow);
            
            // Keep the process alive
            process.stdin.resume();
            break;
            
        case 'stop':
            cleanup();
            break;
            
        default:
            console.log('Usage: node start-helper.js [ollama|web|all|stop]');
            console.log('  ollama - Start only Ollama server');
            console.log('  web    - Start only web application');
            console.log('  all    - Start both (default)');
            console.log('  stop   - Stop all services');
            break;
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    handleError('Uncaught exception', error);
});

process.on('unhandledRejection', (reason, promise) => {
    handleError('Unhandled rejection', new Error(reason));
});

// Run main function
main().catch((error) => {
    handleError('Startup failed', error);
});