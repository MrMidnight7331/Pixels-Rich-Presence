document.addEventListener('DOMContentLoaded', function () {
    const presenceToggle = document.getElementById('presenceToggle');
    const afkTimeoutSlider = document.getElementById('afkTimeout');
    const afkValueSpan = document.getElementById('afkValue');
    const saveButton = document.getElementById('saveButton');

    // WebSocket variable
    let socket = null;

    // Load saved toggle state for presence and AFK timeout value
    chrome.storage.sync.get(['presenceEnabled', 'afkTimeout'], (result) => {
        presenceToggle.checked = result.presenceEnabled ?? true; // Default to true (on)
        afkTimeoutSlider.value = result.afkTimeout ?? 10; // Default to 10 minutes
        afkValueSpan.textContent = afkTimeoutSlider.value; // Update the span to reflect the saved value
    });

    // Send updates to the background WebSocket connection
    function sendToServer(payload) {
        chrome.runtime.sendMessage({ type: 'sendToServer', payload });
    }

    // Handle presence toggle change
    presenceToggle.addEventListener('change', () => {
        const enabled = presenceToggle.checked;
        chrome.storage.sync.set({ presenceEnabled: enabled });

        if (enabled) {
            chrome.storage.sync.get(['lastMapName'], (data) => {
                sendToServer({ type: 'mapUpdate', mapOrBuildingName: data.lastMapName || 'Unknown Location' });
            });
        } else {
            sendToServer({ type: 'mapUpdate', mapOrBuildingName: 'Not Telling' });
        }
    });

    // Update the AFK timeout slider value in real-time
    afkTimeoutSlider.addEventListener('input', () => {
        afkValueSpan.textContent = afkTimeoutSlider.value; // Update the span with the slider's current value
    });

    // Handle save button click
    saveButton.addEventListener('click', () => {
        const afkTimeoutValue = afkTimeoutSlider.value;

        // Save the AFK timeout value to storage
        chrome.storage.sync.set({ afkTimeout: afkTimeoutValue }, () => {
            console.log(`AFK timeout saved: ${afkTimeoutValue} minutes`);

            // Send the new AFK timeout to the server
            sendToServer({ type: 'afkTimeoutUpdate', timeout: afkTimeoutValue });
        });
    });

    // Establish WebSocket connection and send stored info
    function connectToServer() {
        socket = new WebSocket('ws://localhost:32345');

        socket.onopen = function() {
            console.log("[DEBUG] Connected to WebSocket server from popup.js.");

            // Send stored preferences on connection
            chrome.storage.sync.get(['presenceEnabled'], (result) => {
                const enabled = result.presenceEnabled ?? true;
                if (enabled) {
                    chrome.storage.sync.get(['lastMapName'], (data) => {
                        sendToServer({ type: 'mapUpdate', mapOrBuildingName: data.lastMapName || 'Unknown Location' });
                    });
                } else {
                    sendToServer({ type: 'mapUpdate', mapOrBuildingName: 'Not Telling' });
                }
            });
        };

        socket.onerror = function (error) {
            console.error(`[DEBUG] WebSocket Error from popup.js: ${error}`);
        };

        socket.onclose = function () {
            console.log("[DEBUG] WebSocket connection closed in popup.js.");
        };
    }

    // Call function to connect to the server
    connectToServer();
});
