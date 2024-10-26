let trackedTabId = null;
let socket = null;  // WebSocket connection in the background

// Establish WebSocket connection with handling for reconnections
function connectWebSocket() {
    if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
        console.log('Attempting to establish WebSocket connection...');
        socket = new WebSocket('ws://localhost:32345');

        socket.onopen = () => {
            console.log('WebSocket connection established.');
            sendCurrentStatus();  // Send current status immediately upon connection
        };

        socket.onmessage = (event) => {
            console.log(`[DEBUG] Message received from server: ${event.data}`);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed.');
            setTimeout(connectWebSocket, 5000);  // Reconnect after 5 seconds
        };
    }
}

// Function to send the current telling/notTelling status after connection
function sendCurrentStatus() {
    chrome.storage.sync.get(['presenceEnabled'], (result) => {
        const presenceEnabled = result.presenceEnabled ?? true;
        const statusMessage = presenceEnabled ? { type: 'status', status: 'telling' } : { type: 'status', status: 'notTelling' };
        socket.send(JSON.stringify(statusMessage));
        console.log(`[DEBUG] Sent current status to server: ${JSON.stringify(statusMessage)}`);
    });
}

// Initial WebSocket connection when background script starts
connectWebSocket();

// Track when play.pixels.xyz is opened and closed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.includes("play.pixels.xyz")) {
        trackedTabId = tabId;
        console.log(`Tracking play.pixels.xyz on tab: ${trackedTabId}`);

        if (socket.readyState === WebSocket.OPEN) {
            sendCurrentStatus();  // Send the current telling/notTelling status when the page reloads
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === trackedTabId) {
        console.log(`play.pixels.xyz tab closed: ${tabId}`);
        trackedTabId = null;

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'status', status: 'closed' }));
            console.log(`[DEBUG] Sent status "closed" to server`);
        }
    }
});

// Listen for messages from popup.js or content scripts
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'sendToServer' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message.payload));
        console.log('[DEBUG] Sent message to server:', message.payload);
    }
});

// Listen for presence toggle updates and send updated status to the server
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.presenceEnabled) {
        const presenceEnabled = changes.presenceEnabled.newValue;
        const statusMessage = presenceEnabled ? { type: 'status', status: 'telling' } : { type: 'status', status: 'notTelling' };

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(statusMessage));
            console.log(`[DEBUG] Sent updated status due to toggle change: ${JSON.stringify(statusMessage)}`);
        }
    }
});
