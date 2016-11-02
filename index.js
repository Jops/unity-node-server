var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    config = require('config'),
    port = process.argv[2] || config.port,
    passwords = config.validPasswords,
    commandList = {
        captain: require('./roles/captain')
    },
    trace = function(msg) {console.log(msg);},
    clientMsg = require('./helpers/clientMsg'),
    clients = {},
    roleCall = {},
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

/**
 *  WEBVIEW
 */
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

/**
 *  IO SETUP EVENTS
 */
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
        roleCall[identity] = socket.id;
        ConnectionList[identity] = true;

        trace('Identifying client: ' + socket.id + ' as ' + identity);
        sendMessage( socket.id, clientMsg( 'init', 'Identified as ' + identity ) );
    });

    // from crew
    socket.on('command', function( data ) {
        for( var i = data.length - 1; i >= 0; i-- ) commands( socket.id, data[i] );
    });

    // from unity
    socket.on('info', function( data ) {
        info( socket.id, data );
    });
});

/**
 *  EXPRESS START
 */
http.listen(port, function() {
    trace('listening on *:' + port);

    // START IO SENDING MESSAGES
    interval = setInterval( DO, timeout );
});

/**
 *  FROM COMMANDERS
 */
function commands( id, data )
{
    var identity = clients[ id ].identity,
        ioEvent = data.e,
        cmd = getCommandByRole( ioEvent, identity ),
        res;

    if( cmd === undefined )
        sendMessage(
            id,
            clientMsg( 'server-info', 'command unknown: ' + ioEvent )
        );
    else
    {
        res = cmd( data.d );
        if( res )
            sendMessage(
                roleCall[ res.intended ],
                res.message
            );
    }
}

/**
 *  FROM SHIP
 */
function info( id, data )
{
    // send relevant info to each client by role.
    for( var clientId in clients )
    {
        if( clientId !== id )
            sendMessage(
                id,
                clientMsg(
                    'ship-info',
                    commandList[ clients[ id ].identity ].buildClientInfo( data )
                )
            );
    }
}

// PRIVATE FUNCTIONS

function getCommandByRole( name, role )
{
    return commandList[ role ][ name ];
}

function identifyClient( password )
{
    for( var key in passwords )
    {
        if( passwords[key] === password ) return key;
    }
    return 'UNIDENTIFIED';
}

function sendMessage( id, msg )
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
