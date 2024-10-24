document.addEventListener('DOMContentLoaded', function () {
    const presenceToggle = document.getElementById('presenceToggle');
    const afkTimeoutSlider = document.getElementById('afkTimeout');
    const afkValueSpan = document.getElementById('afkValue');
    const saveButton = document.getElementById('saveButton');
    const statusElement = document.getElementById('status'); // Status element for server connection
    let socket = null; // WebSocket variable

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

    // Establish WebSocket connection and update status
    function connectToServer() {
        socket = new WebSocket('ws://localhost:32345');

        socket.onopen = function() {
            console.log("[DEBUG] Connected to WebSocket server from popup.js.");
            statusElement.textContent = 'Server connected.'; // Update status to "Server connected"
            statusElement.style.color = "green"; // Change the status text to green when connected

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
            statusElement.textContent = 'Server not found.'; // Update status to "Server not found"
            statusElement.style.color = "red"; // Change the status text to red when there's an error
            document.getElementById('downloadSection').style.display = 'block'; // Show the download section
        };

        socket.onclose = function () {
            console.log("[DEBUG] WebSocket connection closed in popup.js.");
            statusElement.textContent = 'Server disconnected.'; // Update status to "Server disconnected"
            statusElement.style.color = "orange"; // Change the status text to orange when disconnected
        };
    }

    // Call function to connect to the server
    connectToServer();
});
