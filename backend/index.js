var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.send('<h1>Hello world</h1>');
});

io.sockets.on('connection', function (socket) {
    console.log('a user connected via io.sockets.on');
    socket.on('message', function (data) {
        console.log('a message was received', data);
        socket.broadcast.emit('message', data);
    });
    socket.on('disconnect', function(){
        console.log('a user disconnected via io.sockets.on');
    });
});


http.listen(3000, function(){
    console.log('listening on *:3000');
});