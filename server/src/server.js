const WebSocket = require('ws');
const { updateDiscordPresence, clearDiscordPresence } = require('./discord');
const { getMapDescription, getMapName } = require('./wordlist');

let presenceEnabled = true;  // Default to true
let lastMapName = null;
let afkTimeout = 600000;  // Default to 10 minutes in milliseconds
let afkTimer = null;      // Timer to track inactivity
let isAFK = false;        // AFK status
let isNotTelling = false; // Tracks if "Not Telling" is active

const wss = new WebSocket.Server({ port: 32345 });
console.log('WebSocket server running on port 32345');

wss.on('connection', (ws) => {
    console.log('WebSocket connection established.');

    // When client connects, send the current "Not Telling" status
    ws.send(JSON.stringify({ type: 'notTellingStatus', status: isNotTelling }));

    ws.on('message', (message) => {
        console.log(`[DEBUG] Message received from client: ${message}`);
        const data = JSON.parse(message);

        // Handle map updates
        if (data.type === 'mapUpdate') {
            if (isNotTelling) {
                // If "Not Telling" is active, override any updates
                updateDiscordPresence("Not Telling");
                console.log(`[DEBUG] Suppressing map update due to 'Not Telling' mode.`);
            } else {
                handleMapUpdate(data.mapOrBuildingName);
            }
        }

        // Handle AFK timeout updates from client
        if (data.type === 'afkTimeoutUpdate') {
            afkTimeout = data.timeout * 60000;  // Convert minutes to milliseconds
            console.log(`[DEBUG] AFK timeout updated to ${data.timeout} minutes (${afkTimeout} ms)`);
        }

        // Handle toggle updates for "Not Telling"
        if (data.type === 'toggleUpdate') {
            presenceEnabled = data.enabled;
            if (!presenceEnabled) {
                console.log(`[DEBUG] Presence disabled, updating to "Not Telling"`);
                updateDiscordPresence("Not Telling");
                lastMapName = "Not Telling";  // Prevent redundant updates
            } else {
                console.log(`[DEBUG] Presence enabled, updates will resume`);
                lastMapName = null;
            }
        }

        // Handle "Not Telling" mode
        if (data.type === 'notTellingUpdate') {
            isNotTelling = data.status;
            if (isNotTelling) {
                console.log(`[DEBUG] 'Not Telling' mode activated.`);
                updateDiscordPresence("Not Telling");
            } else {
                console.log(`[DEBUG] 'Not Telling' mode deactivated. Updates will resume.`);
                lastMapName = null;  // Reset last map to allow new updates
            }
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed.');
        clearDiscordPresence();
        lastMapName = null;
        resetAfkTimer();  // Clear the AFK timer when the connection is closed
    });

    ws.on('error', (error) => {
        console.error(`[DEBUG] WebSocket server error: ${error}`);
        clearDiscordPresence();  // Ensure Rich Presence is cleared on error
    });
});

// Handle map updates and reset AFK status/timer
function handleMapUpdate(mapOrBuildingName) {
    if (presenceEnabled && mapOrBuildingName !== lastMapName) {
        lastMapName = mapOrBuildingName;
        const customDescription = getMapDescription(mapOrBuildingName);
        console.log(`[DEBUG] Updating presence to: ${customDescription}`);
        updateDiscordPresence(customDescription);

        // Reset the AFK timer when there's activity
        resetAfkTimer();
        startAfkTimer(mapOrBuildingName);
    } else if (!presenceEnabled) {
        console.log(`[DEBUG] Ignoring map update because presence is disabled`);
    }
}

// Function to reset the AFK timer
function resetAfkTimer() {
    if (afkTimer) {
        clearTimeout(afkTimer);
        afkTimer = null;
    }
    isAFK = false;  // Reset AFK status
}

// Function to start the AFK timer
function startAfkTimer(mapOrBuildingName) {
    afkTimer = setTimeout(() => {
        const locationName = getMapName(mapOrBuildingName);  // Get the name from the wordlist
        console.log(`[DEBUG] Marking as AFK at ${locationName}`);
        updateDiscordPresence(`AFK in ${locationName}`);
        isAFK = true;  // Set AFK status to true
    }, afkTimeout);
}
