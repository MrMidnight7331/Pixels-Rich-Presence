document.addEventListener('DOMContentLoaded', function () {
    const presenceToggle = document.getElementById('presenceToggle');
    const statusElement = document.getElementById('status');
    const downloadSection = document.getElementById('downloadSection');
    const verifyButton = document.getElementById('verifyButton'); // "Verify Installation" button
    let socket = null; // WebSocket variable
    const connectionTimeout = 5000; // Time in ms to wait before showing download link if no connection

    // Load saved toggle state for presence
    chrome.storage.sync.get(['presenceEnabled'], (result) => {
        presenceToggle.checked = result.presenceEnabled ?? true; // Default to true (on)
    });

    // Show download section if no server connection is established within timeout
    function showDownloadSection() {
        if (socket && socket.readyState !== WebSocket.OPEN) {
            statusElement.textContent = 'Server not found.';
            downloadSection.style.display = 'block';
        }
    }

    // Send updates to the server based on toggle status
    function sendToServer(payload) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            chrome.storage.sync.get(['presenceEnabled'], (result) => {
                if (result.presenceEnabled) {
                    socket.send(JSON.stringify(payload));
                } else {
                    socket.send(JSON.stringify({ type: 'mapUpdate', mapOrBuildingName: 'Not Telling' }));
                }
            });
        }
    }

    // Establish WebSocket connection and enforce "Not Telling" status if needed
    function connectToServer() {
        socket = new WebSocket('ws://localhost:32345');

        socket.onopen = function() {
            console.log("[DEBUG] Connected to WebSocket server from popup.js.");
            statusElement.textContent = 'Server connected.'; // Show connected status
            downloadSection.style.display = 'none'; // Hide download section on connection

            // Enforce "Not Telling" mode immediately on connection if enabled
            chrome.storage.sync.get(['presenceEnabled'], (result) => {
                if (!result.presenceEnabled) {
                    sendToServer({ type: 'mapUpdate', mapOrBuildingName: 'Not Telling' });
                }
            });
        };

        socket.onerror = function (error) {
            console.error(`[DEBUG] WebSocket Error from popup.js: ${error}`);
            statusElement.textContent = 'Server not found.';
            downloadSection.style.display = 'block';
        };

        socket.onclose = function () {
            console.log("[DEBUG] WebSocket connection closed in popup.js.");
            statusElement.textContent = 'Server disconnected.';
            downloadSection.style.display = 'block';
        };
    }

    // Show download link if no connection is established within the timeout
    setTimeout(showDownloadSection, connectionTimeout);

    // Connect to the server initially
    connectToServer();

    // Handle presence toggle change and save it
    presenceToggle.addEventListener('change', () => {
        const enabled = presenceToggle.checked;
        chrome.storage.sync.set({ presenceEnabled: enabled });

        // Update the server based on the new toggle state
        if (enabled) {
            chrome.storage.sync.get(['lastMapName'], (data) => {
                sendToServer({ type: 'mapUpdate', mapOrBuildingName: data.lastMapName || 'Unknown Location' });
            });
        } else {
            sendToServer({ type: 'mapUpdate', mapOrBuildingName: 'Not Telling' });
        }
    });

    // Handle "Verify Installation" button click to attempt reconnection
    verifyButton.addEventListener('click', () => {
        console.log("[DEBUG] Reconnecting to server upon 'Verify Installation' button click.");
        statusElement.textContent = 'Rechecking for server connection...';

        // Close the socket if it's open and reconnect
        if (socket && socket.readyState !== WebSocket.CLOSED) {
            socket.close();
        }
        connectToServer(); // Attempt to reconnect
    });

    // Filter map updates based on toggle status
    window.addEventListener('message', (event) => {
        if (event.data.type === 'mapUpdate') {
            chrome.storage.sync.get(['presenceEnabled'], (result) => {
                const mapOrBuildingName = result.presenceEnabled ? event.data.mapOrBuildingName : 'Not Telling';
                sendToServer({ type: 'mapUpdate', mapOrBuildingName });
            });
        }
    });
});
