const RPC = require('discord-rpc');
const fs = require('fs');
const path = require('path');
const clientId = '1295301788311883876';

let client;
let reconnecting = false;
let startTime = null;
const RETRY_DELAY = 5000;
let reconnectInProgress = false;

function logError(message) {
    const logPath = path.join(__dirname, 'error.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

// Initialize the Discord RPC client
function initializeDiscordClient() {
    client = new RPC.Client({ transport: 'ipc' });

    client.on('ready', () => {
        console.log('[DEBUG] Discord RPC Ready');
        reconnecting = false;
        reconnectInProgress = false;
    });

    client.on('disconnected', () => {
        console.log('[DEBUG] Discord disconnected.');
        retryConnection();
    });

    client.on('error', (error) => {
        logError(`Discord RPC Error: ${error.message}`);
        retryConnection();
    });
}

// Connect to Discord
async function connectToDiscord() {
    if (reconnectInProgress) return;
    reconnectInProgress = true;

    if (client) {
        console.log('[DEBUG] Destroying existing Discord client for reinitialization.');
        await client.destroy().catch((error) => logError(`Error destroying client: ${error.message}`));
    }

    initializeDiscordClient();

    try {
        console.log('[DEBUG] Attempting to connect to Discord...');
        await client.login({ clientId });
        console.log('[DEBUG] Connected to Discord!');
    } catch (error) {
        logError(`[DEBUG] Discord Connection Error: ${error.message}`);
        retryConnection();
    } finally {
        reconnectInProgress = false;
    }
}

// Retry connection after a delay
function retryConnection() {
    if (reconnecting || reconnectInProgress) return;
    reconnecting = true;

    console.log(`[DEBUG] Reconnecting to Discord in ${RETRY_DELAY / 1000} seconds...`);
    setTimeout(() => {
        reconnecting = false;
        connectToDiscord();
    }, RETRY_DELAY);
}

// Update Discord presence
function updateDiscordPresence(mapOrBuildingName) {
    if (!client || reconnectInProgress) return;

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
        retryConnection();
    });
}

// Clear Discord presence
function clearDiscordPresence() {
    if (!client) return;

    client.clearActivity().then(() => {
        console.log('[DEBUG] Discord presence cleared.');
        startTime = null;
    }).catch((error) => {
        logError(`Failed to clear Discord presence: ${error.message}`);
        retryConnection();
    });
}

// Initial connection attempt
initializeDiscordClient();
connectToDiscord();

module.exports = { updateDiscordPresence, clearDiscordPresence, connectToDiscord };
