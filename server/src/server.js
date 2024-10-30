const WebSocket = require('ws');
const { updateDiscordPresence, clearDiscordPresence, connectToDiscord, disconnectFromDiscord } = require('./discord');
const { getMapDescription, getMapName } = require('./wordlist');

let wss;
let lastMapName = null;
let afkTimeout = 600000; // Default to 10 minutes in milliseconds
let afkTimer = null;
let isAFK = false;
let isNotTelling = false;
let startTime = null; // Persistent start time for the session
const HEARTBEAT_INTERVAL = 5000;
const MAX_MISSED_HEARTBEATS = 3;
let missedHeartbeats = 0;
let heartbeatIntervalId = null;

// Discord connection management
let isDiscordConnected = false;
let reconnectingToDiscord = false;
let initialUpdateSent = false; // Track if initial update has been sent

function startWebSocketServer() {
    if (wss) {
        console.log('WebSocket server is already running.');
        return;
    }

    wss = new WebSocket.Server({ port: 32345 });
    console.log('WebSocket server running on port 32345');

    wss.on('connection', (ws) => {
        console.log('WebSocket connection established.');
        sendInitialAfkTimer(ws);
        startHeartbeatMonitoring(ws);
        initialUpdateSent = false; // Reset for each new connection

        ws.on('message', (message) => {
            console.log(`[DEBUG] Message received from client: ${message}`);
            const data = JSON.parse(message);

            if (data.type === 'status') {
                handleStatusUpdate(data.status, ws);
            } else if (data.type === 'mapUpdate') {
                handleMapUpdate(data.mapOrBuildingName);
            } else if (data.type === 'afkTimeoutUpdate') {
                afkTimeout = data.timeout * 60000;
                console.log(`[DEBUG] AFK timeout updated to ${data.timeout} minutes (${afkTimeout} ms)`);
            } else if (data.type === 'heartbeat') {
                missedHeartbeats = 0; // Reset missed heartbeats on receiving a heartbeat
            }
        });

        ws.on('close', () => {
            console.log('WebSocket connection closed.');
            stopHeartbeatMonitoring();
            clearDiscordPresence();
            startTime = null; // Reset startTime on disconnection
        });

        ws.on('error', (error) => {
            console.error(`[DEBUG] WebSocket server error: ${error}`);
            clearDiscordPresence();
        });
    });
}

function sendInitialAfkTimer(ws) {
    ws.send(JSON.stringify({ type: 'afkTimeoutUpdate', timeout: afkTimeout / 60000 }));
    console.log(`[DEBUG] Sent initial AFK timer to client: ${afkTimeout / 60000} minutes`);
}

// Heartbeat function to monitor connection health
function startHeartbeatMonitoring(ws) {
    if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);

    heartbeatIntervalId = setInterval(() => {
        missedHeartbeats++;
        if (missedHeartbeats >= MAX_MISSED_HEARTBEATS) {
            console.log('[DEBUG] No heartbeat detected. Clearing Discord presence.');
            clearDiscordPresence();
            stopHeartbeatMonitoring();
            startTime = null;
        }
    }, HEARTBEAT_INTERVAL);

    ws.send(JSON.stringify({ type: 'heartbeatCheck' }));
}

function stopHeartbeatMonitoring() {
    if (heartbeatIntervalId) {
        clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = null;
    }
}

// Handle map and status updates
function handleStatusUpdate(status, ws) {
    if (status === 'notTelling') {
        isNotTelling = true;
        updateDiscordPresence("Not Telling");
        console.log('[DEBUG] Presence set to "Not Telling". Suppressing map updates.');
    } else if (status === 'telling') {
        isNotTelling = false;
        console.log('[DEBUG] Presence set to "Telling". Resuming map updates.');
        lastMapName = null;

        // Force initial map presence update after status is set to "telling"
        if (!initialUpdateSent) {
            initialUpdateSent = true;
            if (lastMapName) handleMapUpdate(lastMapName); // Use last known map if available
            else ws.send(JSON.stringify({ type: 'requestMapUpdate' })); // Request initial map update from client
        }
    } else if (status === 'closed') {
        console.log('[DEBUG] Client status is closed, clearing Discord presence.');
        clearDiscordPresence();
        startTime = null;
    }
}

function handleMapUpdate(mapOrBuildingName) {
    if (isNotTelling) {
        console.log('[DEBUG] "Not Telling" is active. Suppressing map update.');
        return;
    }

    if (!startTime) startTime = Math.floor(Date.now() / 1000);

    if (mapOrBuildingName !== lastMapName || !initialUpdateSent) {
        lastMapName = mapOrBuildingName;
        const customDescription = getMapDescription(mapOrBuildingName);
        console.log(`[DEBUG] Updating presence to: ${customDescription}`);
        updateDiscordPresence(customDescription, startTime);
        resetAfkTimer();
        startAfkTimer(mapOrBuildingName);
        initialUpdateSent = true; // Mark that initial update has been sent
    }
}

// AFK Timer Management
function resetAfkTimer() {
    if (afkTimer) {
        clearTimeout(afkTimer);
        afkTimer = null;
    }
    isAFK = false;
}

function startAfkTimer(mapOrBuildingName) {
    afkTimer = setTimeout(() => {
        const locationName = getMapName(mapOrBuildingName);
        console.log(`[DEBUG] Marking as AFK at ${locationName}`);
        updateDiscordPresence(`AFK in ${locationName}`, startTime);
        isAFK = true;
    }, afkTimeout);
}

async function reconnectToDiscord() {
    if (!reconnectingToDiscord && !isDiscordConnected) {
        reconnectingToDiscord = true;
        console.log('[DEBUG] Attempting to reconnect to Discord...');

        try {
            await disconnectFromDiscord();
            await connectToDiscord();
            isDiscordConnected = true;
            console.log('[DEBUG] Successfully reconnected to Discord.');
        } catch (error) {
            console.error('[DEBUG] Discord reconnection failed:', error);
        } finally {
            reconnectingToDiscord = false;
        }
    }
}

startWebSocketServer();
