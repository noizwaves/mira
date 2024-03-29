localVideo = document.getElementById('localVideo');
remoteVideo = document.getElementById('remoteVideo');
screenVideo = document.getElementById('screenVideo');

let extensionState = {
    loaded: false
}


var currentUserUUID = Math.round(Math.random() * 60535) + 5000;
console.log(`I am ${currentUserUUID}`);

var socketio;
if (window.location.href.match(/mira.cfapps.io/)) {
    socketio = io.connect('https://mira.cfapps.io:4443/');
} else {
    socketio = io.connect();
}

function sendMessage(message) {
    socketio.emit('message', {
        sender: currentUserUUID,
        message: message
    });
}

socketio.on('connect', () => {
    sendMessage(JSON.stringify({hi: currentUserUUID}));
});

function requestDestopCapture() {
    if (!extensionState.loaded) {
        alert('Mira extension has not loaded. Check it is installed and running for this url.');
    }
    window.postMessage('get-sourceId', '*');
}

function requestWebcam() {
    startWebcam(true);
}


var pc;
var configuration = {
    iceServers: [{
        url: 'stun:stun.l.google.com:19302'
    }, {
        url: 'stun:stun.services.mozilla.com'
    }]
};

function startWebcam(isCaller) {
    _start(isCaller, {"video": true});
}

function startScreenshare(sourceId) {
    const constraints = {
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                maxWidth: screen.width,
                maxHeight: screen.height,
                // maxFrameRate: 10,
                // minAspectRatio: 1.77,
                chromeMediaSourceId: sourceId
            }
        }
    };

    // _start(true, constraints);
    _startMultiple(true, constraints, {"video": true});
}

// run start(true) to initiate a call
function _start(isCaller, gumConstraints) {
    pc = new RTCPeerConnection(configuration);

    // send any ice candidates to the other peer
    pc.onicecandidate = function (evt) {
        if (evt.candidate) {
            sendMessage(JSON.stringify({"candidate": evt.candidate}));
        }
    };

    pc.oniceconnectionstatechange = function (evt) {
    };

    // once remote stream arrives, show it in the remote video element
    pc.onaddstream = function (evt) {
        if (!remoteVideo.src) {
            remoteVideo.src = URL.createObjectURL(evt.stream);
        } else if (!screenVideo.src) {
            screenVideo.src = URL.createObjectURL(evt.stream);
        }

        console.log('Received remote stream. ULTIMATE SUCCESS!');
    };

    // get the local stream, show it in the local video element and send it
    navigator.getUserMedia(gumConstraints, function (stream) {
        localVideo.src = URL.createObjectURL(stream);
        console.log('Adding local stream', stream);
        pc.addStream(stream);

        if (isCaller) {
            pc.createOffer(gotOfferDescription, createOfferFailure);
        }
        else {
            pc.createAnswer(gotAnswerDescription, createAnswerFailure);
        }
    }, function (err) {
        console.log('gUM error: ', err);
    });
}

// run start(true) to initiate a call
function _startMultiple(isCaller, gumScreen, gumWebcam) {
    pc = new RTCPeerConnection(configuration);

    // send any ice candidates to the other peer
    pc.onicecandidate = function (evt) {
        if (evt.candidate) {
            sendMessage(JSON.stringify({"candidate": evt.candidate}));
        }
    };

    pc.oniceconnectionstatechange = function (evt) {
    };

    // once remote stream arrives, show it in the remote video element
    pc.onaddstream = function (evt) {
        if (!remoteVideo.src) {
            remoteVideo.src = URL.createObjectURL(evt.stream);
        } else if (!screenVideo.src) {
            screenVideo.src = URL.createObjectURL(evt.stream);
        }

        console.log('Received remote stream. ULTIMATE SUCCESS!');
    };

    // get the local stream, show it in the local video element and send it
    navigator.getUserMedia(gumScreen, function (screenStream) {
        navigator.getUserMedia(gumWebcam, function (webcamStream) {
            localVideo.src = URL.createObjectURL(webcamStream);
            screenVideo.src = URL.createObjectURL(screenStream);

            console.log('Adding webcam stream', webcamStream);
            pc.addStream(webcamStream);

            console.log('Adding screen stream', screenStream);
            pc.addStream(screenStream);

            if (isCaller) {
                pc.createOffer(gotOfferDescription, createOfferFailure);
            }
            else {
                pc.createAnswer(gotAnswerDescription, createAnswerFailure);
            }
        }, gumError);
    }, gumError);

    function gumError(err) {
        console.log('gUM error: ', err);
    }
}

function preferH264(sdp) {
    if (sdp.indexOf('SAVPF 96 98 100 102 127 97 99 101 125') === -1 || sdp.indexOf('VP9/90000') === -1) {
        return sdp;
    }

    return sdp.replace('SAVPF 96 98 100 102 127 97 99 101 125', 'SAVPF 101 100 96 98 102 127 97 99 125');
}

function gotOfferDescription(desc) {
    console.log('created offer description', desc);
    desc.sdp = preferH264(desc.sdp);
    pc.setLocalDescription(desc, () => {
        sendMessage(JSON.stringify({'sdp': desc}));
    }, (err) => {
        console.log('pc.setLocalDescription Err', err);
    });
}

function gotAnswerDescription(desc) {
    console.log('sending answer message', desc);
    desc.sdp = preferH264(desc.sdp);
    pc.setLocalDescription(desc, () => {
        sendMessage(JSON.stringify({'sdp': desc}));
    }, (err) => {
        console.log('pc.setLocalDescription Err', err);
    });
}

function createOfferFailure(err) {
    console.log('pc.createOffer Err: ', err)
}

function createAnswerFailure(err) {
    console.log('pc.createAnswer Err: ', err)
}


socketio.on('message', function (msg) {
    if (msg.sender === currentUserUUID) {
        return;
    }

    var message = JSON.parse(msg.message);


    if (!pc && (message.sdp || message.candidate)) {
        startWebcam(false);
    }

    if (message.sdp) {
        console.log(`Received SDP (${message.sdp.type}) message`);
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {

        });
    }
    else if (message.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
    else if (message.hi) {
        console.log(`${message.hi} says hi!`);
        sendMessage(JSON.stringify({ohHai: currentUserUUID}));
    }
    else if (message.ohHai) {
        console.log(`${message.ohHai} says oh hai!`);
    }
    else {
        console.log('Unknown message', message);
    }
});

const ignoredMessages = ['get-sourceId'];
window.addEventListener('message', (message) => {
    // This listener will also fire for messages this window posts
    if (ignoredMessages.indexOf(message.data) >= 0) {
        console.log('Browser ignored message', message.data);
        return;
    }

    if (message.data === 'mira-extension-loaded') {
        extensionState.loaded = true;

        console.log('Browser sees Mira extension');
    } else if (message.data.sourceId) {
        startScreenshare(message.data.sourceId);
    } else {
        console.log('Unhandled message', message);
    }
});

console.log('Quick Start - run requestDestopCapture() or requestWebcam() to get started');
