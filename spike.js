var backendUrl = 'http://localhost:3000/';
localVideo = document.getElementById('localVideo');
remoteVideo = document.getElementById('remoteVideo');


// window.postMessage('get-sourceId', '*');


var currentUserUUID = Math.round(Math.random() * 60535) + 5000;
console.log(`I am ${currentUserUUID}`);
var socketio = io.connect(backendUrl);

function sendMessage(message) {
    socketio.emit('message', {
        sender: currentUserUUID,
        message: message
    });
}


var pc;
var configuration = {
    iceServers: [{
        url: 'stun:stun.l.google.com:19302'
    }, {
        url: 'stun:stun.services.mozilla.com'
    }]
};

// run start(true) to initiate a call
function start(isCaller) {
    pc = new RTCPeerConnection(configuration);

    // send any ice candidates to the other peer
    pc.onicecandidate = function (evt) {
        // console.log('onicecandidate, evt:', evt);
        // TODO: socketio.emit('signal', ...)
        if (evt.candidate) {
            sendMessage(JSON.stringify({ "candidate": evt.candidate }));
        }
    };

    pc.oniceconnectionstatechange = function (evt) {
        // console.log('oniceconnectionstatechange, evt:', evt);
    }

    // once remote stream arrives, show it in the remote video element
    pc.onaddstream = function (evt) {
        remoteVideo.src = URL.createObjectURL(evt.stream);
        console.log('Received remote stream. ULTIMATE SUCCESS!');
    };

    // get the local stream, show it in the local video element and send it
    navigator.getUserMedia({"video": true}, function (stream) {
        localVideo.src = URL.createObjectURL(stream);
        pc.addStream(stream);

        if (isCaller)
            pc.createOffer(gotOfferDescription, createOfferFailure);
        else {
            // pc.createAnswer(pc.remoteDescription, gotDescription, createAnswerFailure);
            // pc.createAnswer(gotAnswerDescription, createAnswerFailure);
        }
    }, function (err) {
        console.log('gUM error: ', err);
    });
}

function gotOfferDescription(desc) {
    console.log('created offer description', desc);
    pc.setLocalDescription(desc, () => {
        sendMessage(JSON.stringify({'sdp': desc}));
    }, (err) => {
        console.log('pc.setLocalDescription Err', err);
    });
    // TODO:
    // signalingChannel.send(JSON.stringify({"sdp": desc}));
}

function gotAnswerDescription(desc) {
    console.log('created answer description', desc);
    pc.setLocalDescription(desc, () => {
        sendMessage(JSON.stringify({'sdp': desc}));
}, (err) => {
        console.log('pc.setLocalDescription Err', err);
    });
    // TODO:
    // signalingChannel.send(JSON.stringify({"sdp": desc}));
}

function createOfferFailure(err) {
    console.log('pc.createOffer Err: ', err)
}

function createAnswerFailure(err) {
    console.log('pc.createAnswer Err: ', err)
}


// signalingChannel.onmessage = function (evt) {
socketio.on('message', function (msg) {
    // console.log('on(message): ', msg);
    if (msg.sender === currentUserUUID) {
        return;
    }

    if (!pc) {
        start(false);
    }

    var message = JSON.parse(msg.message);
    if (message.sdp) {
        // pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp), function() {
            if(message.sdp.type === 'offer') {
                pc.createAnswer(gotAnswerDescription, createAnswerFailure);
            }
        });
    }
    else if (message.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    } else {
        console.log('Unknown message', message);
    }
});

// start(true);


// window.addEventListener('message', (message) => {
//     if (!message.data.sourceId) {
//         return;
//     }
//
//     let constraints = {
//         video: {
//             mandatory: {
//                 chromeMediaSource: 'desktop',
//                 maxWidth: screen.width,
//                 maxHeight: screen.height,
//                 // maxFrameRate: 10,
//                 // minAspectRatio: 1.77,
//                 chromeMediaSourceId: message.data.sourceId
//             }
//         }
//     };
//
// navigator.mediaDevices.getUserMedia(constraints)
//     .then(function (mediaStream) {
//         var video = document.querySelector('video');
//         video.srcObject = mediaStream;
//         video.onloadedmetadata = function (e) {
//             video.play();
//         };
//     });
// }) ;


