var socket = io();

const hand = document.getElementById("hand");
const table = document.getElementById("table");
const minCardWidth = 98;
const img_dir = 'images/';


// convert suit numbers to string rep
var numToDict = {
    1: 'diamond',
    2: 'club',
    3: 'heart',
    4: 'spade'
};

// function for notifying server that a card has been played
function playCard(suit, number) {
    console.log('suit' + suit);
    console.log('number' + number);
    socket.emit('playCard', suit, number);
}

socket.on('message', function(data) {
	console.log('message: ' + data);
    });

// function for making an img object for a card given its card object and card type
// card: object with suit and number attributes
// id: string for the type of card rep
function getImgObject(card, id) {
    var suitNumber = card.suit;
    var suitName = numToDict[suitNumber];
    var cardNumber = card.number;
    var card_filename = suitName + '_' + cardNumber + '.jpg';
    
    // store each img object with suit, number, and onClick playCard function call
    var img = document.createElement("img");
    img.src = img_dir + card_filename;
    img.setAttribute('suit', suitNumber);
    img.setAttribute('number', cardNumber);
    img.setAttribute('onClick', 'playCard(' + suitNumber + ',' + cardNumber + ')');
    img.setAttribute('id', id);

    console.log('getting image ' + card_filename + ' with i value of ' + i);
    
    return img;
}

socket.on('display_cards', function(cards, tableCards) {
	console.log(cards);

	// OWNER HAND

	// clear hand(s)
	var oldCards = hand.children;
	for (i = oldCards.length - 1; i >= 0; i--) {
	    hand.removeChild(oldCards[i]);
	}
	console.log("cleared");
	
	// center hand (emptySpace is the space on left and right of the hand
	// hand.style.

	// grab images for each card
	for (i = 0; i < cards.length; i++) {
	    
	    hand.appendChild(getImgObject(cards[i], "handCard"));

	}

	// TABLE
	
	// clear table
	var oldTableCards = table.children;
	for (i = oldTableCards.length - 1; i >= 0; i--) {
	    table.removeChild(oldTableCards[i]);
	}
	console.log("cleared table");

	// grab images for each card
	for (i = 0; i < tableCards.length; i++) {
	    
	    table.appendChild(getImgObject(tableCards[i], "tableCard"));

	}

	console.log(tableCards);

    });

socket.on('disconnect', function() {
    });