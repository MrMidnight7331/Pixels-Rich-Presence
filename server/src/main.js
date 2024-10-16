const { app } = require('electron');
const fs = require('fs');
const path = require('path');
require('./server');  // Start the WebSocket server

// Function to log errors into a file
function logError(message) {
    const logPath = path.join(__dirname, 'error.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

// Prevent Electron from creating any windows or UI
app.on('ready', () => {
    console.log('Server is running in background mode.');
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
