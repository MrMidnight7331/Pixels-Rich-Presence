const WebSocket = require('ws');
const { updateDiscordPresence, clearDiscordPresence } = require('./discord');
const { getMapDescription } = require('./wordlist');

let presenceEnabled = true;  // Default to true
let lastMapName = null;

const wss = new WebSocket.Server({ port: 32345 });  // Ensure this port matches your extension
console.log('WebSocket server running on port 32345');

wss.on('connection', (ws) => {
    console.log('WebSocket connection established.');

    ws.on('message', (message) => {
        console.log(`[DEBUG] Message received from client: ${message}`);
        const data = JSON.parse(message);

        if (data.type === 'mapUpdate') {
            if (presenceEnabled && data.mapOrBuildingName !== lastMapName) {
                lastMapName = data.mapOrBuildingName;
                const customDescription = getMapDescription(data.mapOrBuildingName);
                console.log(`[DEBUG] Updating presence to: ${customDescription}`);
                updateDiscordPresence(customDescription);
            } else if (!presenceEnabled) {
                console.log(`[DEBUG] Ignoring map update because presence is disabled`);
            }
        }

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
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed.');
        clearDiscordPresence();  // Clear presence when the WebSocket is closed
        lastMapName = null;
    });

    ws.on('error', (error) => {
        console.error(`[DEBUG] WebSocket server error: ${error}`);
        clearDiscordPresence();  // Ensure Rich Presence is cleared on error
    });
});
