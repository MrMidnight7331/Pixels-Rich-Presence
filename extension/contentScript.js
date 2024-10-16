// Inject the script that overrides the console.log into the page
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injectedScript.js');
script.onload = function() {
    this.remove();  // Remove the script tag after injection
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
    console.log(`[DEBUG] Received message from background: ${JSON.stringify(message)}`);  // Debug log
    if (message.type === 'websiteStatus') {
        // Forward the status to the injected script via postMessage
        window.postMessage({ type: 'websiteStatus', status: message.status }, '*');
    }
});

// Initially load the presenceEnabled flag and last map name from chrome storage
chrome.storage.sync.get(['presenceEnabled', 'lastMapName'], (result) => {
    const presenceEnabled = result.presenceEnabled ?? true;  // Default to true if not set
    const lastMapName = result.lastMapName || "Unknown Location";

    // Send the current state of presenceEnabled to the injected script
    window.postMessage({ type: 'presenceToggle', enabled: presenceEnabled }, '*');

    // If presence is enabled, send the last map name to the injected script
    if (presenceEnabled) {
        window.postMessage({ type: 'lastMapUpdate', mapName: lastMapName }, '*');
    }
});


// Listen for changes to the presenceEnabled toggle from the extension's popup
chrome.storage.onChanged.addListener((changes) => {
    if (changes.presenceEnabled) {
        const presenceEnabled = changes.presenceEnabled.newValue;
        // Send the updated presence toggle state to the injected script in real-time
        window.postMessage({ type: 'presenceToggle', enabled: presenceEnabled }, '*');

        // If presence is enabled, also send the last map name to the injected script
        if (presenceEnabled) {
            chrome.storage.sync.get(['lastMapName'], (data) => {
                const lastMapName = data.lastMapName || "Unknown Location";
                window.postMessage({ type: 'lastMapUpdate', mapName: lastMapName }, '*');
            });
        }
    }
});

// Listen for detected map names from the injected script and store them in chrome storage
window.addEventListener('message', function(event) {
    if (event.data.type === 'mapNameDetected') {
        // Save the detected map name to chrome storage
        chrome.storage.sync.set({ lastMapName: event.data.mapName });
    }
});
