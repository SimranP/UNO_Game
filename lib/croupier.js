var ld = require ('lodash');
var lib = {};
exports.lib = lib;
var deck = require('./cards').getNewDeck;
var gameInspector = require('../lib/gameInspector.js').gameInspector;

lib.shuffleCards = function(newCards){
	return ld.shuffle(newCards);
};

lib.Croupier = function(players){
	var cards =lib.shuffleCards(deck());
	this.drawPile = cards;
	this.players = players;
	this.discardedPile = [];
};

var getCurrentPlayerIndex=function(players){
	return ld.findIndex(players, function(player) {
 		return player.myTurn == true;
	});
}

lib.Croupier.prototype.distributeCards = function(){
	var drawPile = this.drawPile;
	return this.players.map(function(player){
		player.hand = drawPile.splice(0,7);
		return player;
	});
};

lib.Croupier.prototype.openInitialCard = function(){
	var card = this.drawPile.shift();
	while(lib.isActionCard(card)){
		var removedCard = card;
		card = this.drawPile.shift();
		this.drawPile.push(removedCard);
	};
	this.discardedPile.push(card);
};

lib.Croupier.prototype.applySimpleCard=function(card){
	var gameData = {
		discardedPile: this.discardedPile,
		drawPile: this.drawPile,
		players: this.players,
		cardToBeThrown:card
	};
	if(card) {
		var updatedData = gameInspector["throwCard"](gameData);
	}
	this.discardedPile = updatedData.discardedPile;
	this.drawPile = updatedData.drawPile;
	this.players = updatedData.players;
	this.players = gameInspector.apprisePlayersTurn(this.players);
};

lib.Croupier.prototype.countPoints = function(){
	this.players.map(function(player){
		var points = 0;
		player.hand.forEach(function(each){
			points += each.point;
		});
		player.points = points;
	});
};

lib.Croupier.prototype.applyAction = function(card,color){
	var gameData = {
		discardedPile: this.discardedPile,
		drawPile: this.drawPile,
		players: this.players,
		color:color
	};
	var updatedData = gameInspector[card.action](gameData);
	this.discardedPile = updatedData.discardedPile;
	this.drawPile = updatedData.drawPile;
	this.players = updatedData.players;
};

lib.getPlayerDetails = function(ID,players){
	return ld.find(players,{id:ID});
};

lib.Croupier.prototype.makeMove = function(playerID,thrownCard,color){
	var currentPlayer = lib.getPlayerDetails(playerID,this.players);
	var topMostCard = this.discardedPile[this.discardedPile.length-1];
	var validCard = currentPlayer.hand.filter(function(card){
		return topMostCard.color == card.color || topMostCard.name == card.name;
	});
	if(validCard.length != 0 && color != 'undefined' && thrownCard != undefined)
		if(thrownCard.name == 'plusFour') return;
	if(lib.checkEligibility(currentPlayer,this.players)){
		if(!thrownCard){
			this.getACard(currentPlayer);
		}
		else{
			this.applySimpleCard(thrownCard);
			var isMatched = lib.matchCard(this.discardedPile);
			if(isMatched) {
				if(lib.isActionCard(thrownCard)){
					this.applyAction(thrownCard,color);
				}
			}
			else{
				this.reverseMove();
			}
		}
	}
};

lib.Croupier.prototype.getACard  = function(){
	var drawPile = this.drawPile.length && this.drawPile || ld.shuffle(this.discardedPile);
	(this.drawPile.length<=0) && lib.fillDrawPile(this);
	var cardToBeGiven = this.drawPile.pop();
 	var currentPlayer= getCurrentPlayerIndex(this.players);
 	this.players[currentPlayer].hand.push(cardToBeGiven);
 	this.players[currentPlayer].saidUno = false;
 };

lib.Croupier.prototype.reverseMove = function(){
	var players = this.players;
	var playerIndexWhoIsPlaying = ld.findIndex(players, function(player) {
 		return player.myTurn == true;
	});
	players[playerIndexWhoIsPlaying].myTurn = false;

	if(playerIndexWhoIsPlaying == 0) var previousPlayer = players[this.players.length-1];
	else var previousPlayer = players[playerIndexWhoIsPlaying-1];
	previousPlayer.myTurn = true;
	previousPlayer.hand.push(this.discardedPile.pop());
	var updatedData = {
		discardedPile: this.discardedPile,
		players: this.players,
	};
	return updatedData;
};

lib.Croupier.prototype.sayUno = function(playerWhoClaimed){
	if(playerWhoClaimed.saidUno) return;
	var eligibleForUno = ld.find(this.players,function(player){
		return player.hand.length == 1 && player.id == playerWhoClaimed.id;
	});
	if(eligibleForUno) eligibleForUno.saidUno = true;
};

lib.Croupier.prototype.catchUno = function(player){
	if(player.hand.length == 1 && player.saidUno == false){
		player.hand.push(this.drawPile.pop());
		player.hand.push(this.drawPile.pop());
		return true;
	};
	return false;
};

lib.Player = function(name,id,socialNetworkId){
	this.name = name;
	this.id = id;
	this.hand = [];
	this.myTurn = false;
	this.saidUno = false;
	this.socialNetworkId = socialNetworkId;
};

lib.checkEligibility = function(currPlayer,players){
	var currentPlayer = players.filter(function(player){
		return player.myTurn == true;
	});
	if(!currentPlayer.length) return false;
	return currPlayer.name == currentPlayer[0].name;
};

lib.matchCard = function(discardedPile){
	var topCard = discardedPile[discardedPile.length-1];
	var secondCard = discardedPile[discardedPile.length-2];
	return topCard.name == "wildCard"
	||topCard.name == "plusFour"
	||topCard.color == secondCard.color
	||topCard.name == secondCard.name ;
};

lib.isActionCard = function(card){
	return card.action != 'simpleCard';
};


lib.checkForEndGame = function(players){
	var winner = players.filter(function(player){
		return player.hand.length == 0;
	});
	return winner.length == 1;
};

lib.fillDrawPile = function(data){
	var drawnFromDiscardedPile = data.discardedPile.splice(0,data.discardedPile.length-1);
	drawnFromDiscardedPile = drawnFromDiscardedPile.map(function(each){
		if(each.name=='plusFour' || each.name=='wildCard'){
			each.color=null;
		}
		return each;
	});
	data.drawPile = data.drawPile.concat(lib.shuffleCards(drawnFromDiscardedPile));
};
