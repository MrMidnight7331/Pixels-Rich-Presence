document.addEventListener('DOMContentLoaded', function () {
    const presenceToggle = document.getElementById('presenceToggle');
    const afkTimeoutSlider = document.getElementById('afkTimeout');
    const afkValueSpan = document.getElementById('afkValue');
    const saveButton = document.getElementById('saveButton');
    const statusElement = document.getElementById('status');
    const downloadSection = document.getElementById('downloadSection');

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

    // Function to update UI based on connection status
    function updateUI(connected) {
        if (connected) {
            statusElement.textContent = 'Server connected.';
            statusElement.style.color = 'green';
            downloadSection.style.display = 'none';
        } else {
            statusElement.textContent = 'Server not found.';
            statusElement.style.color = 'red';
            downloadSection.style.display = 'block';
        }
    }

    // Check server connection status
    function checkConnection() {
        chrome.runtime.sendMessage({ type: 'checkConnection' }, (response) => {
            updateUI(response.connected);
        });
    }

    // Attempt reconnection on "Verify Installation" click
    document.getElementById('verifyButton').addEventListener('click', () => {
        statusElement.textContent = 'Checking server connection...';
        statusElement.style.color = 'orange';

        chrome.runtime.sendMessage({ type: 'reconnectWebSocket' }, (response) => {
            updateUI(response && response.connected);  // Update UI with the result immediately
        });
    });

    // Handle presence toggle change and save state
    presenceToggle.addEventListener('change', () => {
        const enabled = presenceToggle.checked;
        chrome.storage.sync.set({ presenceEnabled: enabled });
        const statusMessage = enabled ? { type: 'status', status: 'telling' } : { type: 'status', status: 'notTelling' };
        chrome.runtime.sendMessage({ type: 'sendToServer', payload: statusMessage });
    });

    // Save AFK timeout on button click
    saveButton.addEventListener('click', () => {
        const afkTimeoutValue = afkTimeoutSlider.value;
        chrome.storage.sync.set({ afkTimeout: afkTimeoutValue }, () => {
            console.log(`[DEBUG] AFK timeout saved: ${afkTimeoutValue} minutes`);
            chrome.runtime.sendMessage({ type: 'afkTimeoutUpdate' });
        });
    });

    // Listen for connection status updates from background.js
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'connectionStatus') {
            updateUI(message.connected);
        }
    });

    // Initial check on popup load
    checkConnection();
});
