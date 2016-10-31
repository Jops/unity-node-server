var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    config = require('config'),
    port = process.argv[2] || config.port,
    passwords = config.validPasswords,
    roles = config.roles,
    commandList = {
        captain: require('./roles/captain')
    },
    trace = function(msg) {console.log(msg);},
    clients = {},
    ConnectionList = {
        unity: false,
        captain: false,
        logistics: false,
        helmsman: false,
        engineer: false,
        gunner: false,
    },
    messages = [],
    timeout = config.sendTimeout,
    interval;

app.get('/', function( req, res ) {
    res.send(
        '<h1>Gazpacho Server</h1>' +
        '<p>Simulation connected: '+ ConnectionList.unity +'</p>' +
        '<ul>' +
            '<li>Captain connected: '+ ConnectionList.captain +'</li>' +
            '<li>Logistics Officer connected: '+ ConnectionList.logistics +'</li>' +
            '<li>Helmsman connected: '+ ConnectionList.helmsman +'</li>' +
            '<li>Engineer connected: '+ ConnectionList.engineer +'</li>' +
            '<li>Gunner connected: '+ ConnectionList.gunner +'</li>' +
        '</ul>'
    );
});

io.on('connection', function( socket ) {
    trace('a user connected: ' + socket.id);

    clients[socket.id] = { socket: socket };

    socket.on('disconnect', function() {
        trace('user disconnected: ' + socket.id);
        ConnectionList[clients[socket.id].identity] = false;
        delete clients[socket.id];
    });

    socket.on('identify', function( data ) {
        var identity = identifyClient( data.pw );

        clients[socket.id].identity = identity;
        ConnectionList[identity] = true;
        trace('Identifying client: ' + socket.id + ' as ' + identity);
        sendMessage( socket.id, 'Identified as ' + identity );
    });

    // from crew
    socket.on('command', function( data ) {
        for( var i = data.length - 1; i >= 0; i-- )
        {
            commands( socket.id, data[i] );
        }
    });

    // from unity
    socket.on('info', function( data ) {
        info( socket.id, data );
    });
});

http.listen(port, function() {
    trace('listening on *:' + port);
});

function commands( id, data )
{
    var cmd = roles[ clients[ id ].identity ][ data.e ];
    if( cmd === undefined ) sendMessage( id, 'command unknown: ' + data.e );
    else
    {
        sendMessage( id, commandList[ clients[ id ].identity ][data.e](data.d) );
    }
}

function info( socket, data )
{
    trace( 'from unity: ' + JSON.stringify( data ) );
}

function identifyClient( password )
{
    for( var key in passwords )
    {
        if( passwords[key] === password ) return key;
    }
    return 'UNIDENTIFIED';
}

function sendMessage(id, msg)
{
    messages.push(
        {
            intended: id,
            toRecieve: msg
        }
    );
}

function DO()
{
    for( var i = messages.length - 1; i >= 0; i-- )
    {
        if(messages[i].intended === 'ALL') io.sockets.emit( 'recieve', messages[i].toRecieve );
        else clients[ messages[i].intended ].socket.emit( 'recieve', messages[i].toRecieve );
    }
    messages = [];
}

interval = setInterval( DO, timeout );
