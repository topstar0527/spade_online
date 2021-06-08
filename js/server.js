var 
    debug = false,
    game_server = module.exports = {games: {}, gameCount:0}, //concurrency?
    UUID = require('node-uuid'); // NOTE: node-uuid does not produce uuid reliably randomly

console.log('debugging: ' + debug);

// code is shared between browsers so include some values
global.window = global.document = global;

// import shared

// wrap console.log
game_server.log = function(args) {
    if (debug) {
	console.log(this, args);
    }
}


// function for creating a randomized random ordered
// list of integers ranging from 1 to n
function randomArray(n) {
    var rangeArray = new Array(n);
    
    // construct an array of the range
    var i;
    for (i = 0; i < n; i++) {
	rangeArray[i] = i+1;
    }
    
    var i;
    for (i = rangeArray.length - 1; i > 0; i--) {
	// swap randomly going from the end of the array
	// to the beginning
	randomIndex = Math.floor(Math.random() * i);
	temp = rangeArray[randomIndex];
	rangeArray[randomIndex] = rangeArray[i];
	rangeArray[i] = temp;
    }

    return rangeArray;
}

// function for creating a shuffled deck of cards
function getShuffledDeck(numDecks) {

    var deckSize = 52;

    var shuffledIntegers = randomArray(deckSize);

    // create the card objects
    var shuffledCards = new Array(deckSize);

    var i;
    for (i = 0; i < deckSize; i++) {
	var rawNumber = shuffledIntegers[i];
	shuffledCards[i] = {number: Math.ceil(rawNumber/4), suit: rawNumber % 4 + 1};
    }

    return shuffledCards;
}



// function for distributing the deck evenly into numPiles
// with pileSize number of cards in each pile
// returns an array of arrays
function distributeDeck(deck, numPiles, pileSize) {

    var piles = new Array(numPiles);
    
    var i;
    for (i = 0; i < numPiles; i++) {
	piles[i] = deck.slice(i * pileSize, i * pileSize + pileSize);
    }

    return piles;
}

// function for ordering cards (array of cards)
function orderCardsSuitDom(cardArray) {
    
    // first order by number
    var orderedCards = cardArray.slice(0);
    // order then by number
    orderedCards.sort(function(a, b) {return (a.suit + a.number/100) - (b.suit + b.number/100)});
    
    return orderedCards;
}

// function to convert cards arrays to strings (suit|number)
function cardArrayStrings(cardArray) {
    return cardArray.map(x => (x.suit + "|" + x.number));
}

// function to get the winning player
function getWinningPlayer(gameRoom) {
    // filler
    return 0;
}

// checks if the play is valid with respect to the turn
// precond: player has the card
function isValidPlay(client, gameRoom, card) {
    var playerId = client.userid;
    
    // if the player is the one initiating the turn's suit
    if (gameRoom.roundSuit == null){
	// does the play have to be not spades if the player has other suits than spades?
	gameRoom.roundSuit = card.suit;
	return true;
    }

    // if the turn's suit has already been decided
    // check the player's card suit
    if (card.suit == gameRoom.roundSuit) {
	return true;
    }

    // allow spades iff player does not have that suit
    if (card.suit == 4) {
	var i;
	var playerPos = gameRoom.playerDict[client.userid];
	var playerCards = gameRoom.playerCards[playerPos];
	for (i = 0; i < playerCards.length; i++) {
	    if (playerCards[i].suit == gameRoom.roundSuit) {
		return false;
	    }
	}
	return true;
    }

    return false;
}

// function to processTurn
function processTurn(gameRoom) {
    // find winning player
    gameRoom.playerTurn = getWinningPlayer(gameRoom);
    gameRoom.round++;
    gameRoom.roundCards = [];
    gameRoom.playersPlayed = 0;
    gameRoom.roundSuit = null;
    console.log("started new turn");
}

// function to continue game after a card is successfully played
function processPlay(gameRoom, card) {
    gameRoom.roundCards.push(card);
    console.log(gameRoom.roundCards);
    gameRoom.playerTurn = (gameRoom.playerTurn + 1) % 4;
    gameRoom.playersPlayed++;
}

// concurrency?
game_server.createGame = function(player) {
    var playerId = player.userid;

    // create each game with stored data
    var newGame = {
	id : UUID(),
	playerCount : 1,
	playerDict: {}, // maps player ids to their position (in playerCards
	playerPoints: {}, // stores points for each player
	playerList: new Array(4), // player/client stored in their position in the array
	playerCards: [], // array of array of cards, in positional order
	playerTurn: Math.floor(Math.random(1) * 4),
	playersPlayed: 0,
	round: -1,
	roundSuit: null,
	roundCards: [], // cards played in the round
	active: false
    };
    
    // initialize the first player
    newGame.playerList[0] = player;
    newGame.playerDict[playerId] = 0;
    newGame.playerPoints[playerId] = 0;

    newGame.getPlayerCards = function(player) {
	
	if (debug) console.log("playerid: " + player.userid);

	var playerId = player.userid;
	return this.playerCards[this.playerDict[playerId]];
    }
    
    // add to dictionary of games
    this.games[newGame.id] = newGame;
    this.gameCount++;

    player.game = newGame.id;
    this.log('player ' + playerId + ' created a game with id ' + newGame.id);
}

// precondition: full room
function showCardsToPlayers(gameRoom) {
    var i;

    for (i = 0; i < gameRoom.playerList.length; i++) {
	player = gameRoom.playerList[i];

	if (debug) console.log(player);

	// send vs emit
	if (debug) console.log("GETTING CARDS: " + gameRoom.getPlayerCards(player));
	// player.send(gameRoom.getPlayerCards(player));
	player.emit("display_cards", gameRoom.getPlayerCards(player), gameRoom.roundCards);
    }
}

game_server.startGame = function(gameRoom) {

    // TODO: tell players that game is starting

    gameRoom.active = true;

    // get a shuffled deck
    var deck = getShuffledDeck();

    // distribute cards
    var distributedCards= distributeDeck(deck, 4, 13);
    // sort the cards
    gameRoom.playerCards = distributedCards.map(cards => orderCardsSuitDom(cards));
    // get the starting player
    gameRoom.startingPlayer = (gameRoom.startingPlayer + 1) % 4;
    
    if (debug) {
	console.log(gameRoom.playerList);
    }
    
    showCardsToPlayers(gameRoom);
}

game_server.findGame = function(player) {
    // find a game that has less than 4 players
    var joinedGame = false;

    for (var gameId in this.games) {

	gameRoom = this.games[gameId];

	// synch?
	if (!joinedGame && gameRoom.playerCount < 4) {
 
	    // assign spot on table to player
	    gameRoom.playerDict[player.userid] = gameRoom.playerCount;
	    gameRoom.playerPoints[player.userid] = 0;
	    gameRoom.playerList[gameRoom.playerCount] = player;
	    gameRoom.playerCount++;
	    
	    // make sure that the player is playing a game
	    player.game = gameRoom.id;
	    this.log('player ' + player.userid + ' joined a game with id ' + gameRoom.id);

	    joinedGame = true;
	    
	    if (gameRoom.playerCount == 4) {
	        this.startGame(gameRoom);
	    }
	}
    }

    // if the player has not joined a game, let the player start a new room
    if (!joinedGame) {
	this.createGame(player);
    }

    player.inGame = true;
    
}

// helper function for checking if the player play a card that is valid in the room
game_server.playerPlaysCard = function(gameRoom, client, suit, number) {

    // get the player's position on the table
    var playerPos = gameRoom.playerDict[client.userid];
    var playerCards = gameRoom.playerCards[playerPos];
    
    // if it's not the player's turn, return false
    if (gameRoom.playerTurn != playerPos) {
	return false;
    }

    // find the right card and remove it from the player's hand
    for (i = 0; i < playerCards.length; i++) {
	var card = playerCards[i];
	if (card.suit == suit && card.number == number) {
	    console.log("PLAYER HAS CARD");
	    // check if the play is valid
	    if (!isValidPlay(client, gameRoom, card)) {
		console.log("PLAY IS NOT VALID");
		return false;
	    }
	    
	    // if the play is valid, process the play
	    playerCards.splice(i, 1);
	    processPlay(gameRoom, card);
	    return true;
	}
    }
    return false;
}

// function for processing the client's played card
game_server.playCard = function(client, suit, number) {
    console.log('client ' + client);
    console.log('suit ' + suit);
    console.log('player ' + number);
    
    // find player's game room 
    var gameRoom = this.games[client.game];

    // check if the player is in the game and if the move is valid
    if (client.inGame && game_server.playerPlaysCard(gameRoom, client, suit, number)) {
	showCardsToPlayers(gameRoom);
	// remove cards if a turn is over
	if (gameRoom.playersPlayed >= 4) {
	    // make sure that no one can play in the moment
	    gameRoom.playerTurn = -1;

	    setTimeout(function() {processTurn(gameRoom); showCardsToPlayers(gameRoom);}, 5000);
	}
    }
}