let socket = null;
const HEARTBEAT_INTERVAL = 5000;
let heartbeatIntervalId = null;

// Establish WebSocket connection with improved handling for reconnections and instant UI updates
function connectWebSocket() {
    if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
        console.log('Attempting to establish WebSocket connection...');
        socket = new WebSocket('ws://localhost:32345');

        socket.onopen = () => {
            console.log('WebSocket connection established.');
            sendCurrentStatus();
            sendAfkTimeoutToServer();
            startHeartbeat();
            notifyConnectionStatus(true); // Notify popup of the connection status
        };

        socket.onmessage = (event) => {
            console.log(`[DEBUG] Message received from server: ${event.data}`);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed.');
            stopHeartbeat();
            notifyConnectionStatus(false); // Notify popup of the disconnection status
            setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
        };
    }
}

// Notify popup of the WebSocket connection status
function notifyConnectionStatus(isConnected) {
    chrome.runtime.sendMessage({ type: 'connectionStatus', connected: isConnected });
}

// Send the stored AFK timeout to the server on each connection
function sendAfkTimeoutToServer() {
    chrome.storage.sync.get(['afkTimeout'], (result) => {
        const afkTimeout = result.afkTimeout ?? 10; // Default to 10 minutes if not set
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'afkTimeoutUpdate', timeout: afkTimeout }));
            console.log(`[DEBUG] Sent AFK timeout to server: ${afkTimeout} minutes`);
        }
    });
}

// Function to send the current telling/notTelling status
function sendCurrentStatus() {
    chrome.storage.sync.get(['presenceEnabled'], (result) => {
        const presenceEnabled = result.presenceEnabled ?? true;
        const statusMessage = presenceEnabled ? { type: 'status', status: 'telling' } : { type: 'status', status: 'notTelling' };
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(statusMessage));
            console.log(`[DEBUG] Sent current status to server: ${JSON.stringify(statusMessage)}`);
        }
    });
}

// Start sending heartbeats
function startHeartbeat() {
    if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);

    heartbeatIntervalId = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'heartbeat' }));
            console.log("[DEBUG] Heartbeat sent to server.");
        }
    }, HEARTBEAT_INTERVAL);
}

// Stop heartbeats
function stopHeartbeat() {
    if (heartbeatIntervalId) {
        clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = null;
    }
}

// Handle messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sendToServer' && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message.payload));
        console.log('[DEBUG] Forwarded message to server:', message.payload);
        sendResponse({ success: true });
    } else if (message.type === 'checkConnection') {
        sendResponse({ connected: socket && socket.readyState === WebSocket.OPEN });
    } else if (message.type === 'reconnectWebSocket') {
        if (socket) socket.close(); // Close any existing connection to initiate reconnection
        connectWebSocket();
    } else if (message.type === 'afkTimeoutUpdate') {
        sendAfkTimeoutToServer(); // Update AFK timeout to server when popup changes it
    }
    return true;
});

// Initialize WebSocket connection
connectWebSocket();
