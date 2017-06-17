window.postMessage('get-sourceId', '*');

window.addEventListener('message', (message) => {
    if (!message.data.sourceId) {
        return;
    }

    let constraints = {
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                maxWidth: screen.width,
                maxHeight: screen.height,
                // maxFrameRate: 10,
                // minAspectRatio: 1.77,
                chromeMediaSourceId: message.data.sourceId
            }
        }
    };

navigator.mediaDevices.getUserMedia(constraints)
    .then(function (mediaStream) {
        var video = document.querySelector('video');
        video.srcObject = mediaStream;
        video.onloadedmetadata = function (e) {
            video.play();
        };
    });
}) ;


