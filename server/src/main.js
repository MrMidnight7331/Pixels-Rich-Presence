const { app, Tray, Menu, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { updateDiscordPresence, clearDiscordPresence, connectToDiscord } = require('./discord');
require('./server');  // Start the WebSocket server

let tray = null;
let debugWindow = null;
let debugMessages = [];
let isConnectedToDiscord = false;
const RETRY_INTERVAL = 5000;

// Save the original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Redirect console.log and console.error to capture logs
function logDebug(message) {
    originalConsoleLog(message);
    debugMessages.push(message);

    const logPath = path.join(__dirname, 'debug.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);

    if (debugWindow && !debugWindow.isDestroyed()) {
        debugWindow.webContents.send('logMessage', message);
    }

    if (message.includes('Connected to Discord!')) {
        isConnectedToDiscord = true;
        updateTrayTitle();
    } else if (message.includes('Discord Connection Error') || message.includes('Attempting to reconnect to Discord')) {
        isConnectedToDiscord = false;
        updateTrayTitle();
    }
}

// Update tray title based on Discord connection status
function updateTrayTitle() {
    const title = isConnectedToDiscord ? 'Connected to Discord' : 'Connection unable to establish';
    tray.setToolTip(`Pixels Rich Presence Server - ${title}`);
}

// Forcefully close the application and all child processes
function handleExit() {
    logDebug('[DEBUG] Exiting the application.');

    // Ensure presence is cleared before exit
    Promise.resolve()
        .then(() => clearDiscordPresence())  // Clear Discord presence
        .then(() => {
            if (global.wss) {
                return new Promise((resolve) => {
                    global.wss.close(() => {
                        logDebug('[DEBUG] WebSocket server closed.');
                        resolve();
                    });
                });
            }
        })
        .finally(() => {
            app.quit();  // Quit the app once everything is closed
            process.exit(0);  // Ensure all processes are terminated
        });
}

// Retry Discord connection function with reset check
function retryDiscordConnection() {
    logDebug('[DEBUG] Forcing a Discord reconnection...');
    connectToDiscord().then(() => {
        isConnectedToDiscord = true;
        logDebug('Successfully reconnected to Discord.');
        updateTrayTitle();
    }).catch((error) => {
        logDebug(`Failed to reconnect to Discord: ${error.message}`);
        setTimeout(retryDiscordConnection, RETRY_INTERVAL);  // Retry with delay
    });
}


// Override console methods to capture logs for debug window
console.log = (...args) => logDebug(args.join(' '));
console.error = (...args) => logDebug(`[ERROR] ${args.join(' ')}`);

// Create the hidden debug window
function createDebugWindow() {
    debugWindow = new BrowserWindow({
        width: 600,
        height: 400,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    debugWindow.loadFile(path.join(__dirname, 'debug.html'));

    debugWindow.on('close', (e) => {
        e.preventDefault();
        debugWindow.hide();
    });
}

// Initialize Electron app with tray icon and context menu
app.on('ready', () => {
    logDebug('Server is running in background mode.');

    const iconPath = path.join(__dirname, '../public', 'prpc-logo.ico');
    tray = new Tray(iconPath);

    createDebugWindow();

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Pixels-RPC Server is Running', enabled: false },
        { type: 'separator' },
        {
            label: 'Retry Connection',
            click: retryDiscordConnection
        },
        {
            label: 'Debug',
            click: () => {
                debugWindow.show();
            }
        },
        {
            label: 'Exit',
            click: handleExit  // Ensures all processes terminate
        }
    ]);

    tray.setContextMenu(contextMenu);
    updateTrayTitle();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Error handling
process.on('uncaughtException', (err) => {
    logDebug(`Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
    logDebug(`Unhandled Rejection: ${reason}`);
});
