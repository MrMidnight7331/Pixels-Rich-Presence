(function() {
    const originalConsoleLog = console.log;
    let lastDetectedMap = null;
    let presenceEnabled = true;  // Default to true

    // Create a WebSocket connection
    let socket = new WebSocket('ws://127.0.0.1:32345');

    socket.onopen = function() {
        originalConsoleLog("[DEBUG] Connected to WebSocket server from injectedScript.js.");
        socket.send(JSON.stringify({ type: 'status', status: 'opened' }));
    };

    socket.onerror = function (error) {
        originalConsoleLog(`[DEBUG] WebSocket Error from injectedScript.js: ${error}`);
    };

    socket.onclose = function () {
        originalConsoleLog("[DEBUG] WebSocket connection closed in injectedScript.js.");
    };

    window.addEventListener('beforeunload', function() {
        if (socket.readyState === WebSocket.OPEN) {
            originalConsoleLog("[DEBUG] Sending 'closed' status before window unload.");
            socket.send(JSON.stringify({ type: 'status', status: 'closed' }));
        }
    });

    // Listen for toggle update and website status from content script (via postMessage)
    window.addEventListener('message', function(event) {
        console.log(`[DEBUG] Received message from content script: ${JSON.stringify(event.data)}`);  // Debug log

        if (event.data.type === 'presenceToggle') {
            presenceEnabled = event.data.enabled;
            originalConsoleLog(`[DEBUG] Presence toggle updated: ${presenceEnabled}`);

            // If the presence is disabled, immediately update the Rich Presence to "Not Telling"
            if (!presenceEnabled && socket.readyState === WebSocket.OPEN) {
                originalConsoleLog("[DEBUG] Sending 'Not Telling' update due to presence disabled.");
                socket.send(JSON.stringify({ type: 'mapUpdate', mapOrBuildingName: "Not Telling" }));
            }
        }

        if (event.data.type === 'lastMapUpdate' && presenceEnabled && socket.readyState === WebSocket.OPEN) {
            // Update the rich presence with the last known map if presence is enabled
            const lastMapName = event.data.mapName || "Unknown Location";
            originalConsoleLog(`[DEBUG] Sending map update: ${lastMapName}`);
            socket.send(JSON.stringify({ type: 'mapUpdate', mapOrBuildingName: lastMapName }));
        }

        // Handle website status
        if (event.data.type === 'websiteStatus') {
            if (event.data.status === 'closed' && socket.readyState === WebSocket.OPEN) {
                originalConsoleLog("[DEBUG] Website closed, sending 'clearPresence' message.");
                // Stop updating Discord Rich Presence and clear it when the website is closed
                socket.send(JSON.stringify({ type: 'status', status: 'clearPresence' }));
            } else if (event.data.status === 'opened' && socket.readyState === WebSocket.OPEN) {
                originalConsoleLog("[DEBUG] Website reopened, resuming updates.");
                socket.send(JSON.stringify({ type: 'status', status: 'opened' }));
            }
        }
    });

    // Override the console.log function to send map updates only when the presence is enabled
    console.log = function(...args) {
        const logOutput = args.join(" ");

        // Detect "joining map" messages
        if (logOutput.includes("joining map")) {
            const mapNameMatch = logOutput.match(/joining map ([\w-]+):?/); // Updated regex
            if (mapNameMatch) {
                const mapName = mapNameMatch[1];

                // Send the map name to content script to store in chrome.storage
                window.postMessage({ type: 'mapNameDetected', mapName: mapName }, '*');

                if (mapName !== lastDetectedMap && presenceEnabled && socket.readyState === WebSocket.OPEN) {
                    lastDetectedMap = mapName;
                    originalConsoleLog(`[DEBUG] Sending map update: ${mapName}`);
                    socket.send(JSON.stringify({ type: 'mapUpdate', mapOrBuildingName: mapName }));
                }
            }
        }

        // Detect "warp to" messages (for locations like pixelsNFTFarm)
        if (logOutput.includes("warp to")) {
            const warpNameMatch = logOutput.match(/warp to ([\w-]+):?/);
            if (warpNameMatch) {
                const warpName = warpNameMatch[1];

                // Send the warp name to content script to store in chrome.storage
                window.postMessage({ type: 'mapNameDetected', mapName: warpName }, '*');

                if (warpName !== lastDetectedMap && presenceEnabled && socket.readyState === WebSocket.OPEN) {
                    lastDetectedMap = warpName;
                    originalConsoleLog(`[DEBUG] Sending warp update: ${warpName}`);
                    socket.send(JSON.stringify({ type: 'mapUpdate', mapOrBuildingName: warpName }));
                }
            }
        }
    };
})();
