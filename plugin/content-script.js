// Usage:
//  - ask the extension for the screen via ?
//    - result is returned via ?

// this port connects with background script
var backgroundPort = chrome.runtime.connect();

// if background script sent a message
backgroundPort.onMessage.addListener(function (message) {
    // get message from background script and forward to the webpage
    window.postMessage(message, '*');
});

// this event handler watches for messages sent from the webpage
// it receives those messages and forwards to background script
window.addEventListener('message', function (event) {
    // if invalid source
    if (event.source != window)
        return;
        
    // if browser is asking whether extension is available
    if(event.data === 'are-you-there') {
        window.postMessage('mira-extension-loaded', '*');
    }

    // if it is something that need to be shared with background script
    if(event.data === 'get-sourceId' || event.data === 'audio-plus-tab') {
        // forward message to background script
        backgroundPort.postMessage(event.data);
    }
});

// inform browser that you're available!
window.postMessage('mira-extension-loaded', '*');
