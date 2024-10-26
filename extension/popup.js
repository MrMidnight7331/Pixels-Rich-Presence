document.addEventListener('DOMContentLoaded', function () {
    const presenceToggle = document.getElementById('presenceToggle');
    const afkTimeoutSlider = document.getElementById('afkTimeout');
    const afkValueSpan = document.getElementById('afkValue');
    const saveButton = document.getElementById('saveButton');
    const statusElement = document.getElementById('status');
    const downloadSection = document.getElementById('downloadSection');
    let socket = null;

    // Load saved presence toggle state and AFK timeout value
    chrome.storage.sync.get(['presenceEnabled', 'afkTimeout'], (result) => {
        presenceToggle.checked = result.presenceEnabled ?? true;
        afkTimeoutSlider.value = result.afkTimeout ?? 10;  // Default to 10 minutes
        afkValueSpan.textContent = afkTimeoutSlider.value;  // Display current slider value
    });

    // Update displayed AFK timeout value in real time
    afkTimeoutSlider.addEventListener('input', () => {
        afkValueSpan.textContent = afkTimeoutSlider.value;
    });

    // Send updated AFK timeout to the server
    function sendToServer(payload) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
            console.log('[DEBUG] Sent payload to server:', payload);
        } else {
            console.log('[DEBUG] Unable to send message, server not connected.');
        }
    }

    // Establish WebSocket connection with a check for "Not Telling" status on connect
    function connectToServer() {
        socket = new WebSocket('ws://localhost:32345');

        socket.onopen = function () {
            console.log("[DEBUG] Connected to WebSocket server from popup.js.");
            statusElement.textContent = 'Server connected.';
            statusElement.style.color = 'green';
            downloadSection.style.display = 'none';

            // Send the current presence mode and AFK timeout on connection
            chrome.storage.sync.get(['presenceEnabled', 'afkTimeout'], (result) => {
                const statusMessage = result.presenceEnabled ? { type: 'status', status: 'telling' } : { type: 'status', status: 'notTelling' };
                sendToServer(statusMessage);
                sendToServer({ type: 'afkTimeoutUpdate', timeout: result.afkTimeout ?? 10 });
            });
        };

        socket.onerror = function (error) {
            console.error(`[DEBUG] WebSocket Error: ${error}`);
            statusElement.textContent = 'Server not found.';
            statusElement.style.color = 'red';
            downloadSection.style.display = 'block';
        };

        socket.onclose = function () {
            console.log("[DEBUG] WebSocket connection closed.");
            statusElement.textContent = 'Server disconnected.';
            statusElement.style.color = 'orange';
        };
    }

    // Attempt reconnection on "Verify Installation" click
    document.getElementById('verifyButton').addEventListener('click', () => {
        connectToServer();
    });

    // Handle presence toggle change and save state
    presenceToggle.addEventListener('change', () => {
        const enabled = presenceToggle.checked;
        chrome.storage.sync.set({ presenceEnabled: enabled });

        // Update server with current toggle state
        const statusMessage = enabled ? { type: 'status', status: 'telling' } : { type: 'status', status: 'notTelling' };
        sendToServer(statusMessage);
    });

    // Save AFK timeout on button click
    saveButton.addEventListener('click', () => {
        const afkTimeoutValue = afkTimeoutSlider.value;
        chrome.storage.sync.set({ afkTimeout: afkTimeoutValue }, () => {
            console.log(`[DEBUG] AFK timeout saved: ${afkTimeoutValue} minutes`);
            sendToServer({ type: 'afkTimeoutUpdate', timeout: afkTimeoutValue });
        });
    });

    // Establish initial server connection
    connectToServer();
});
