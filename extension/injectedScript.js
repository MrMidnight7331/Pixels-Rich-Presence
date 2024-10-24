(function () {
    const originalConsoleLog = console.log;
    let lastDetectedMap = null;
    let presenceEnabled = true; // Default to true

    // Create a WebSocket connection
    let socket = new WebSocket('ws://127.0.0.1:32345');

    // Function to send a message via WebSocket if it's open
    function sendToServer(payload) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
            originalConsoleLog(`[DEBUG] Sent message to server: ${JSON.stringify(payload)}`);
        } else {
            originalConsoleLog(`[DEBUG] WebSocket is not open. Unable to send message.`);
        }
    }

    // Reconnect logic for WebSocket if it closes
    function reconnectWebSocket() {
        socket = new WebSocket('ws://127.0.0.1:32345');

        socket.onopen = function () {
            originalConsoleLog("[DEBUG] Connected to WebSocket server from injectedScript.js.");
            sendToServer({ type: 'status', status: 'opened' });
        };

        socket.onerror = function (error) {
            originalConsoleLog(`[DEBUG] WebSocket Error from injectedScript.js: ${error}`);
        };

        socket.onclose = function () {
            originalConsoleLog("[DEBUG] WebSocket connection closed in injectedScript.js. Reconnecting...");
            setTimeout(reconnectWebSocket, 5000);  // Try to reconnect after 5 seconds
        };
    }

    // Start the WebSocket connection
    reconnectWebSocket();

    window.addEventListener('beforeunload', function () {
        if (socket.readyState === WebSocket.OPEN) {
            originalConsoleLog("[DEBUG] Sending 'closed' status before window unload.");
            sendToServer({ type: 'status', status: 'closed' });
        }
    });

    // Listen for toggle update and website status from content script (via postMessage)
    window.addEventListener('message', function (event) {
        originalConsoleLog(`[DEBUG] Received message from content script: ${JSON.stringify(event.data)}`);  // Debug log

        if (event.data.type === 'presenceToggle') {
            presenceEnabled = event.data.enabled;
            originalConsoleLog(`[DEBUG] Presence toggle updated: ${presenceEnabled}`);

            // If the presence is disabled, immediately update the Rich Presence to "Not Telling"
            if (!presenceEnabled) {
                originalConsoleLog("[DEBUG] Sending 'Not Telling' update due to presence disabled.");
                sendToServer({ type: 'mapUpdate', mapOrBuildingName: 'Not Telling' });
            }
        }

        if (event.data.type === 'lastMapUpdate' && presenceEnabled) {
            // Update the rich presence with the last known map if presence is enabled
            const lastMapName = event.data.mapName || 'Unknown Location';
            originalConsoleLog(`[DEBUG] Sending map update: ${lastMapName}`);
            sendToServer({ type: 'mapUpdate', mapOrBuildingName: lastMapName });
        }

        // Handle website status
        if (event.data.type === 'websiteStatus') {
            if (event.data.status === 'closed') {
                originalConsoleLog("[DEBUG] Website closed, sending 'clearPresence' message.");
                sendToServer({ type: 'status', status: 'clearPresence' });
            } else if (event.data.status === 'opened') {
                originalConsoleLog("[DEBUG] Website reopened, resuming updates.");
                sendToServer({ type: 'status', status: 'opened' });
            }
        }
    });

    // Override the console.log function to send map updates only when the presence is enabled
    console.log = function (...args) {
        const logOutput = args.join(' ');

        // Detect "joining map" messages
        if (logOutput.includes('joining map')) {
            const mapNameMatch = logOutput.match(/joining map ([\w-]+):?/);  // Updated regex
            if (mapNameMatch) {
                const mapName = mapNameMatch[1];

                // Send the map name to content script to store in chrome.storage
                window.postMessage({ type: 'mapNameDetected', mapName: mapName }, '*');

                if (mapName !== lastDetectedMap && presenceEnabled) {
                    lastDetectedMap = mapName;
                    originalConsoleLog(`[DEBUG] Sending map update: ${mapName}`);
                    sendToServer({ type: 'mapUpdate', mapOrBuildingName: mapName });
                }
            }
        }

        // Detect "warp to" messages (for locations like pixelsNFTFarm)
        if (logOutput.includes('warp to')) {
            const warpNameMatch = logOutput.match(/warp to ([\w-]+):?/);
            if (warpNameMatch) {
                const warpName = warpNameMatch[1];

                // Send the warp name to content script to store in chrome.storage
                window.postMessage({ type: 'mapNameDetected', mapName: warpName }, '*');

                if (warpName !== lastDetectedMap && presenceEnabled) {
                    lastDetectedMap = warpName;
                    originalConsoleLog(`[DEBUG] Sending warp update: ${warpName}`);
                    sendToServer({ type: 'mapUpdate', mapOrBuildingName: warpName });
                }
            }
        }
    };
})();
