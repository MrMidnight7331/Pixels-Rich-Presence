(function () {
    const originalConsoleLog = console.log;
    let lastDetectedMap = null;
    let presenceEnabled = true;
    let socket = null;
    const HEARTBEAT_INTERVAL = 5000; // 5 seconds for the heartbeat
    let heartbeatIntervalId = null;

    // Function to send a message via WebSocket if it's open
    function sendToServer(payload) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
            originalConsoleLog(`[DEBUG] Sent message to server: ${JSON.stringify(payload)}`);
        } else {
            originalConsoleLog(`[DEBUG] WebSocket is not open. Unable to send message.`);
        }
    }

    // Function to start the heartbeat
    function startHeartbeat() {
        if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);

        heartbeatIntervalId = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                sendToServer({ type: 'heartbeat' });
                originalConsoleLog('[DEBUG] Heartbeat sent to server.');
            }
        }, HEARTBEAT_INTERVAL);
    }

    // Function to stop the heartbeat
    function stopHeartbeat() {
        if (heartbeatIntervalId) {
            clearInterval(heartbeatIntervalId);
            heartbeatIntervalId = null;
        }
    }

    // Reconnect logic for WebSocket if it closes
    function reconnectWebSocket() {
        socket = new WebSocket('ws://127.0.0.1:32345');

        socket.onopen = function () {
            originalConsoleLog("[DEBUG] Connected to WebSocket server from injectedScript.js.");
            sendToServer({ type: 'status', status: 'opened' });
            startHeartbeat(); // Start heartbeat upon connection
        };

        socket.onerror = function (error) {
            originalConsoleLog(`[DEBUG] WebSocket Error from injectedScript.js: ${error}`);
        };

        socket.onclose = function () {
            originalConsoleLog("[DEBUG] WebSocket connection closed in injectedScript.js. Reconnecting...");
            stopHeartbeat(); // Stop heartbeat if the connection closes
            setTimeout(reconnectWebSocket, 5000);  // Try to reconnect after 5 seconds
        };
    }

    // Start the WebSocket connection
    reconnectWebSocket();

    window.addEventListener('beforeunload', function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
            originalConsoleLog("[DEBUG] Sending 'closed' status before window unload.");
            sendToServer({ type: 'status', status: 'closed' });
            stopHeartbeat(); // Stop heartbeat on unload
        }
    });

    // Override the console.log function to detect map updates and send them to the server
    console.log = function (...args) {
        const logOutput = args.join(' ');

        // Detect "joining map" messages
        if (logOutput.includes('joining map')) {
            const mapNameMatch = logOutput.match(/joining map ([\w-]+):?/);  // Updated regex
            if (mapNameMatch) {
                const mapName = mapNameMatch[1];

                if (mapName !== lastDetectedMap && presenceEnabled) {
                    lastDetectedMap = mapName;
                    originalConsoleLog(`[DEBUG] Sending map update: ${mapName}`);
                    sendToServer({ type: 'mapUpdate', mapOrBuildingName: mapName });
                }
            }
        }

        // Detect "warp to" messages
        if (logOutput.includes('warp to')) {
            const warpNameMatch = logOutput.match(/warp to ([\w-]+):?/);
            if (warpNameMatch) {
                const warpName = warpNameMatch[1];

                if (warpName !== lastDetectedMap && presenceEnabled) {
                    lastDetectedMap = warpName;
                    originalConsoleLog(`[DEBUG] Sending warp update: ${warpName}`);
                    sendToServer({ type: 'mapUpdate', mapOrBuildingName: warpName });
                }
            }
        }
    };
})();
