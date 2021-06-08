/* node app.js to run */

const config = {pingTimeout: 60000};

// import modules
var 
    debug = true,
    gameport = process.env.PORT || 4004,
    
    socketIo = require('socket.io')(server, config),
    express = require('express'),
    uuid = require('node-uuid'), // NOTE: node-uuid does not produce reliably secure random values
    
    http = require('http'),
    app = express(),
    server = http.createServer(app);

// DEBUG
if (debug) {
    console.log("Debugging is on");
} else {
    console.log("Debugging is off");
}

/* Express server */

// server listens for incoming connections
server.listen(gameport);

// log message for success
console.log('\t :: Express :: Listening on port ' + gameport);

// forward /path to index.html automatically?
app.get('/', function(req, res){
	console.log('trying to load %s', __dirname + '/index.html');
	res.sendFile('index.html', {root:__dirname});
});


// handle all routes from the root - expressjs doc ?
app.get('/*' , function(req, res, next) {
	// get requested file
	var file = req.params[0];

	// log requested files
	if (debug) {
	    console.log('\t :: Express :: file requested : ' + file);
	}

	// send the client the file
	res.sendFile(__dirname + '/' + file);
});

/* Socket.io */

// create socket.io instance
var sio = socketIo.listen(server);

/* CONFIGURE CODE - deprecated?
// configure socket.io connection settings - socket.io
sio.configure(function (){
	
	sio.set('log level', 0); // check socket.io doc

	sio.set('authorization', function (handshakeData, callback) {
		callback(null, true); // error first callback style
	});
	
});
*/

// game server code
game_server = require('./js/server.js');

// function when client connects, assign uuid
sio.sockets.on('connection', function (client) {
	
	client.userid = uuid();

	// tell game that the client is connected along with the uuid
	client.emit('onconnected', { id: client.userid });

	// find game or create one if unable to find a game
	game_server.findGame(client);

	// log connected user??
	console.log('\t socket.io:: player ' + client.userid + ' connected');

	// handle cards played
	client.on('playCard', function(suit, number) {
		game_server.playCard(client, suit, number);
	}); //play card

	/*
	// handle messages
	client.on('message', function(m) {
		game_server.onMessage(client, m);
        }); // message
	*/
	// client disconnected
	client.on('disconnect', function() {
		// log disconnection
		console.log('\t socket.io:: client disconnected ' + client.userid + ' ' + client.game_id);
		/*
		// if client was in a game, tell server to update game state
		if (client.game && client.game.id) {
		    // destroy game when player leaves?, make sure player is no longer in a game
		    game_server.endGame(client.game.id, client.userid);
		}
		*/
	 }); // disconnect
	
    });