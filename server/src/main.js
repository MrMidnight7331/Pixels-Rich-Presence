const { app, Tray, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
require('./server');  // Start the WebSocket server

let tray = null;  // Variable for the system tray icon

// Function to log errors into a file
function logError(message) {
    const logPath = path.join(__dirname, 'error.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

// Prevent Electron from creating any windows or UI
app.on('ready', () => {
    console.log('Server is running in background mode.');

    // Create the system tray icon
    const iconPath = path.join(__dirname, '../public', 'prpc-logo.ico');
    tray = new Tray(iconPath);

    // Create a context menu for the tray icon
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Pixels-RPC Server is Running', enabled: false }, // Status label
        { type: 'separator' },
        {
            label: 'Exit',
            click: () => {
                app.quit(); // Quit the application when 'Exit' is clicked
            }
        }
    ]);

    // Set the context menu for the tray icon
    tray.setToolTip('Pixels Rich Presence Server'); // Tooltip when hovering over the tray icon
    tray.setContextMenu(contextMenu);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Error handling
process.on('uncaughtException', (err) => {
    logError(`Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
    logError(`Unhandled Rejection: ${reason}`);
});
