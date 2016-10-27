var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

function trace( msg ) {
    console.log( msg );
}

app.get('/', function(req, res) {
    res.send('<h1>Gazpacho Server</h1>');
});

io.on('connection', function(socket) {
    trace('a user connected: ' + socket.id);

    socket.emit('serverTest');

    socket.on('disconnect', function() {
        trace('user disconnected: ' + socket.id);
    });

    socket.on('test', function(data) {
        trace('testing testing: ' + socket.id);
    });
});

http.listen(3000, function() {
    trace('listening on *:3000');
});