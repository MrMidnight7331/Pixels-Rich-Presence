const RPC = require('discord-rpc');
const fs = require('fs');
const path = require('path');
const clientId = '1295301788311883876';

const client = new RPC.Client({ transport: 'ipc' });

const INITIAL_RETRY_DELAY = 5000;   // Retry every 5 seconds initially
let retryDelay = INITIAL_RETRY_DELAY;
let reconnecting = false;

// Log errors to a file
function logError(message) {
    const logPath = path.join(__dirname, 'error.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

// Attempt to connect to Discord
async function connectToDiscord() {
    try {
        await client.login({ clientId });
        console.log('Connected to Discord!');
        reconnecting = false;
        retryDelay = INITIAL_RETRY_DELAY;  // Reset delay after successful connection
    } catch (error) {
        logError(`Discord Connection Error: ${error.message}`);
        retryConnection(); // Retry on failure
    }
}

// Retry connection with a consistent delay unless connection succeeds
function retryConnection() {
    if (reconnecting) return;
    reconnecting = true;

    console.log(`[DEBUG] Attempting to reconnect to Discord in ${retryDelay / 1000} seconds...`);
    setTimeout(() => {
        reconnecting = false;
        connectToDiscord();
    }, retryDelay);
}

// Event listeners for Discord client
client.on('ready', () => {
    console.log('Discord RPC Ready');
    retryDelay = INITIAL_RETRY_DELAY; // Reset retry delay on success
});

client.on('disconnected', () => {
    console.log('[DEBUG] Discord disconnected.');
    retryConnection();
});

client.on('error', (error) => {
    logError(`Discord RPC Error: ${error.message}`);
    retryConnection();
});

// Initial connection attempt
connectToDiscord();

let startTime = null;

// Update Discord presence
function updateDiscordPresence(mapOrBuildingName) {
    if (!startTime) startTime = Math.floor(Date.now() / 1000);

    console.log(`[DEBUG] Updating Discord presence with description: ${mapOrBuildingName}`);
    client.setActivity({
        details: mapOrBuildingName,
        largeImageKey: 'pixels-logo',
        largeImageText: 'Playing Pixels Online',
        startTimestamp: startTime,
        instance: false
    }).catch((error) => {
        logError(`Discord Presence Update Error: ${error.message}`);
        retryConnection(); // Trigger reconnect on activity error
    });
}

// Clear Discord presence
function clearDiscordPresence() {
    client.clearActivity().then(() => {
        console.log('[DEBUG] Discord presence cleared.');
        startTime = null;
    }).catch((error) => {
        logError(`Failed to clear Discord presence: ${error.message}`);
        retryConnection(); // Trigger reconnect on clear error
    });
}

module.exports = { updateDiscordPresence, clearDiscordPresence, connectToDiscord };
