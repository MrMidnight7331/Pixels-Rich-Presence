const RPC = require('discord-rpc');
const fs = require('fs');
const path = require('path');
const clientId = '1295301788311883876';

const client = new RPC.Client({ transport: 'ipc' });

// Function to log errors into a file
function logError(message) {
    const logPath = path.join(__dirname, 'error.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

client.on('ready', () => {
    console.log('Connected to Discord!');
    startTime = null; // Reset the timer when reconnected
});

client.on('error', (error) => {
    logError(`Discord RPC Error: ${error.message}`);
});

// Event listener for when Discord connection is lost
client.on('disconnected', () => {
    console.log('[DEBUG] Discord disconnected, attempting to reconnect...');
    attemptDiscordReconnect();
});

// Function to attempt reconnecting to Discord every 5 seconds if disconnected
function attemptDiscordReconnect() {
    const reconnectInterval = setInterval(() => {
        client.login({ clientId })
            .then(() => {
                console.log('[DEBUG] Reconnected to Discord!');
                clearInterval(reconnectInterval); // Stop reconnecting once reconnected
            })
            .catch((error) => {
                logError(`Discord Reconnection Error: ${error.message}`);
            });
    }, 5000); // Retry every 5 seconds
}

// Initial connection attempt
client.login({ clientId })
    .then(() => console.log('Initial Discord login successful'))
    .catch((error) => {
        logError(`Discord Initial Login Error: ${error.message}`);
        attemptDiscordReconnect(); // Start reconnect attempts if the initial login fails
    });

let startTime = null;  // Global variable to store the start time

function updateDiscordPresence(mapOrBuildingName) {
    if (!startTime) {
        startTime = Math.floor(Date.now() / 1000);  // Record the start time
    }

    // Debugging output to check the value of mapOrBuildingName
    console.log(`[DEBUG] Updating Discord presence with description: ${mapOrBuildingName}`);

    client.setActivity({
        details: mapOrBuildingName,   // Description of the player's activity
        largeImageKey: 'pixels-logo', // Large image asset key from Discord Developer Portal
        largeImageText: 'Playing Pixels Online',  // Optional: Tooltip for the image
        startTimestamp: startTime,    // The start time of the activity
        instance: false               // Set to true for games with instances
    }).catch((error) => {
        logError(`Discord Presence Update Error: ${error.message}`);
    });
}

function clearDiscordPresence() {
    client.clearActivity()
        .then(() => {
            console.log('[DEBUG] Discord presence cleared.');
            startTime = null; // Reset the timer
        })
        .catch((error) => {
            logError(`Failed to clear Discord presence: ${error.message}`);
        });
}

// No longer needed: attemptDiscordReconnect runs only when disconnected
module.exports = { updateDiscordPresence, clearDiscordPresence };
