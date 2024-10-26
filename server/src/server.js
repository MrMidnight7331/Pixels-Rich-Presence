const WebSocket = require('ws');
const { updateDiscordPresence, clearDiscordPresence } = require('./discord');
const { getMapDescription, getMapName } = require('./wordlist');

let wss;
let presenceEnabled = true;
let lastMapName = null;
let afkTimeout = 600000;  // Default to 10 minutes in milliseconds
let afkTimer = null;
let isAFK = false;
let isNotTelling = false;  // Tracks if "Not Telling" is active

function startWebSocketServer() {
    if (wss) {
        console.log('WebSocket server is already running.');
        return;
    }

    wss = new WebSocket.Server({ port: 32345 });
    console.log('WebSocket server running on port 32345');

    wss.on('connection', (ws) => {
        console.log('WebSocket connection established.');
        console.log(`[DEBUG] Initial AFK time: ${afkTimeout} ms`);

        // Send AFK timeout to the client immediately on connection
        ws.send(JSON.stringify({ type: 'afkTimeout', timeout: afkTimeout / 60000 }));

        ws.on('message', (message) => {
            console.log(`[DEBUG] Message received from client: ${message}`);
            const data = JSON.parse(message);

            if (data.type === 'status') {
                handleStatusUpdate(data.status);
            }

            if (data.type === 'mapUpdate') {
                handleMapUpdate(data.mapOrBuildingName);
            }

            if (data.type === 'afkTimeoutUpdate') {
                afkTimeout = data.timeout * 60000;
                console.log(`[DEBUG] AFK timeout updated to ${data.timeout} minutes (${afkTimeout} ms)`);
            }
        });

        ws.on('close', () => {
            console.log('WebSocket connection closed.');
        });

        ws.on('error', (error) => {
            console.error(`[DEBUG] WebSocket server error: ${error}`);
            clearDiscordPresence();
        });
    });

    wss.on('close', () => {
        console.log('WebSocket server closed. Restarting...');
        startWebSocketServer();
    });
}

function handleStatusUpdate(status) {
    if (status === 'notTelling') {
        isNotTelling = true;
        updateDiscordPresence("Not Telling");
        console.log('[DEBUG] Presence set to "Not Telling". Suppressing map updates.');
    } else if (status === 'telling') {
        isNotTelling = false;
        console.log('[DEBUG] Presence set to "Telling". Resuming map updates.');
        lastMapName = null;  // Reset last map to allow updates
    } else if (status === 'closed') {
        console.log('[DEBUG] Client status is closed, clearing Discord presence.');
        clearDiscordPresence();
    }
}

function handleMapUpdate(mapOrBuildingName) {
    if (isNotTelling) {
        console.log('[DEBUG] "Not Telling" is active. Suppressing map update.');
        return;
    }

    if (presenceEnabled && mapOrBuildingName !== lastMapName) {
        lastMapName = mapOrBuildingName;
        const customDescription = getMapDescription(mapOrBuildingName);
        console.log(`[DEBUG] Updating presence to: ${customDescription}`);
        updateDiscordPresence(customDescription);
        resetAfkTimer();
        startAfkTimer(mapOrBuildingName);
    }
}

// Function to reset the AFK timer
function resetAfkTimer() {
    if (afkTimer) {
        clearTimeout(afkTimer);
        afkTimer = null;
    }
    isAFK = false;
}

// Function to start the AFK timer
function startAfkTimer(mapOrBuildingName) {
    afkTimer = setTimeout(() => {
        const locationName = getMapName(mapOrBuildingName);
        console.log(`[DEBUG] Marking as AFK at ${locationName}`);
        updateDiscordPresence(`AFK in ${locationName}`);
        isAFK = true;
    }, afkTimeout);
}

// Start the server initially
startWebSocketServer();
