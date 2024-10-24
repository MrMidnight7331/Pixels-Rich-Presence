let trackedTabId = null;
let socket = null;  // WebSocket connection in the background

function connectWebSocket() {
    if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
        console.log('Attempting to establish WebSocket connection...');
        socket = new WebSocket('ws://localhost:32345');

        socket.onopen = () => {
            console.log('WebSocket connection established.');
            chrome.runtime.sendMessage({ type: 'status', status: 'opened' });
        };

        socket.onmessage = (event) => {
            console.log(`[DEBUG] Message received from server: ${event.data}`);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed.');
            // Attempt to reconnect after a delay
            setTimeout(connectWebSocket, 5000);  // Reconnect after 5 seconds
        };
    }
}

// Initial WebSocket connection when the background script starts
connectWebSocket();

// Listen for updates on tabs to detect when play.pixels.xyz is opened
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.includes("play.pixels.xyz")) {
        trackedTabId = tabId;  // Track the tab ID where play.pixels.xyz is open
        console.log(`Tracking play.pixels.xyz on tab: ${trackedTabId}`);  // Debug log
        chrome.runtime.sendMessage({ type: 'websiteStatus', status: 'opened' });

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'status', status: 'opened' }));
        }
    }
});

// Listen for tab removal to detect when play.pixels.xyz is closed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId === trackedTabId) {
        console.log(`play.pixels.xyz tab closed: ${tabId}`);  // Debug log
        chrome.runtime.sendMessage({ type: 'websiteStatus', status: 'closed' });
        trackedTabId = null;

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'status', status: 'closed' }));
        }
    }
});

// Handle incoming messages from popup.js or content scripts
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'sendToServer' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message.payload));
        console.log('[DEBUG] Sent message to server:', message.payload);
    }
});
