document.addEventListener('DOMContentLoaded', function() {
    const downloadSection = document.getElementById('downloadSection');
    const statusElement = document.getElementById('status');
    const presenceToggle = document.getElementById('presenceToggle');

    // Load saved toggle state
    chrome.storage.sync.get(['presenceEnabled'], (result) => {
        presenceToggle.checked = result.presenceEnabled ?? true;  // Default to true (on)
    });

    // WebSocket to check if the server is running
    const socket = new WebSocket('ws://localhost:32345');

    socket.onopen = () => {
        statusElement.textContent = 'Server connected.';
    };

    socket.onerror = () => {
        statusElement.textContent = 'Server not found.';
        downloadSection.style.display = 'block';
    };

    // Save toggle state when it changes and send update immediately
    presenceToggle.addEventListener('change', () => {
        const enabled = presenceToggle.checked;
        chrome.storage.sync.set({ presenceEnabled: enabled });

        // Immediately update Rich Presence based on toggle state
        if (enabled) {
            chrome.storage.sync.get(['lastMapName'], (data) => {
                socket.send(JSON.stringify({ type: 'mapUpdate', mapOrBuildingName: data.lastMapName || "Unknown Location" }));
            });
        } else {
            socket.send(JSON.stringify({ type: 'mapUpdate', mapOrBuildingName: "Not Telling" }));
        }
    });

    // Verify installation after download
    document.getElementById('verifyButton').addEventListener('click', () => {
        statusElement.textContent = 'Rechecking for server connection...';
        socket.close();
        const newSocket = new WebSocket('ws://localhost:32345');

        newSocket.onopen = () => {
            statusElement.textContent = 'Local Server connected successfully.';
            downloadSection.style.display = 'none';
        };

        newSocket.onerror = () => {
            statusElement.textContent = 'Local Server not found. Please install the server and try again.';
        };
    });
});
