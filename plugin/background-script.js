// this background script is used to invoke desktopCapture API
// to capture screen-MediaStream.

var screenOptions = ['screen'];

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(portOnMessageHandler);
    
    // this one is called for each message from "content-script.js"
    function portOnMessageHandler(message) {
        if(message === 'get-sourceId') {
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
        }
    }

    // on getting sourceId
    // "sourceId" will be empty if permission is denied.
    function onAccessApproved(sourceId) {
        // if "cancel" button is clicked
        if(!sourceId || !sourceId.length) {
            port.postMessage('PermissionDeniedError');
        } else {
            // "ok" button is clicked; share "sourceId" with the
            // content-script which will forward it to the webpage
            port.postMessage({
                sourceId: sourceId
            });
        }

    }
});
