var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('client'));
app.use(express.static('static'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/spike.html');
});

app.use('/node_modules', express.static('node_modules'))

io.sockets.on('connection', function (socket) {
    console.log('a user connected via io.sockets.on');
    socket.on('message', function (data) {
        console.log('a message was received', data);
        socket.broadcast.emit('message', data);
    });
    socket.on('disconnect', function () {
        console.log('a user disconnected via io.sockets.on');
    });
});


http.listen(process.env.PORT || 3000, function () {
    console.log('listening on *:3000');
});