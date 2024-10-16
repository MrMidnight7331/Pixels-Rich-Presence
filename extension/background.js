let trackedTabId = null;

// Listen for updates on tabs to detect when play.pixels.xyz is opened
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.includes("play.pixels.xyz")) {
        trackedTabId = tabId;  // Track the tab ID where play.pixels.xyz is open
        console.log(`Tracking play.pixels.xyz on tab: ${trackedTabId}`);  // Debug log
        chrome.runtime.sendMessage({ type: 'websiteStatus', status: 'opened' });
    }
});

// Listen for tab removal to detect when play.pixels.xyz is closed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId === trackedTabId) {
        // play.pixels.xyz tab was closed, notify the server to stop Discord Rich Presence
        console.log(`play.pixels.xyz tab closed: ${tabId}`);  // Debug log
        chrome.runtime.sendMessage({ type: 'websiteStatus', status: 'closed' });
        trackedTabId = null;  // Reset tracked tab
    } else {
        console.log(`Tab closed, but it's not play.pixels.xyz: ${tabId}`);  // Debug log
    }
});
