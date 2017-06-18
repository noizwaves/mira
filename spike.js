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
        console.log('Adding local stream');
        pc.addStream(stream);

        if (isCaller)
            pc.createOffer(gotOfferDescription, createOfferFailure);
        else {
            pc.createAnswer(gotAnswerDescription, createAnswerFailure);
        }
    }, function (err) {
        console.log('gUM error: ', err);
    });
}

function preferVP9(sdp) {
    if (sdp.indexOf('SAVPF 96 98 100 102 127 97 99 101 125') === -1 || sdp.indexOf('VP9/90000') === -1) {
        return sdp;
    }

    return sdp.replace('SAVPF 96 98 100 102 127 97 99 101 125', 'SAVPF 101 100 96 98 102 127 97 99 125');
}

function gotOfferDescription(desc) {
    console.log('created offer description', desc);
    desc.sdp = preferVP9(desc.sdp);
    pc.setLocalDescription(desc, () => {
        sendMessage(JSON.stringify({'sdp': desc}));
    }, (err) => {
        console.log('pc.setLocalDescription Err', err);
    });
}

function gotAnswerDescription(desc) {
    console.log('sending answer message', desc);
    desc.sdp = preferVP9(desc.sdp);
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

    if (!pc) {
        start(false);
    }

    var message = JSON.parse(msg.message);
    if (message.sdp) {
        console.log(`Received SDP (${message.sdp.type}) message`);
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp), function() {

        });
    }
    else if (message.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    } else {
        console.log('Unknown message', message);
    }
});
