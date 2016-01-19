var _ = require('lodash');
var Croupier = require('../lib/croupier').lib.Croupier;
var gameInspector = require('./gameInspector.js').gameInspector;
var Game = function(){
	var self = this;
	// this.players=[];
	// this.playersLimit=0;
	// this.recentMove="";
	// this.gameStarted=false;
	// this.croupier=undefined;
	var players=[];
	var playersLimit=0;
	var recentMove="";
	var gameStarted=false;
	var croupier=undefined;
	this.hasPlayers = function(){
		return players.length>0;
	};
	this.contains = function(playerId){
		return _.some(players,{id:playerId}); 
	};
	this.addRecentMove = function(move){
		recentMove += move;
	};
	this.getMoves = function(){
		return recentMove;
	};
	this.setLimit = function(limit){
		if(playersLimit) return;
		playersLimit = limit;
	};
	this.hasVacancy = function(){
		return (players.length < playersLimit);
	};
	this.register = function(player){
		if(self.contains(player.id)) return;
		players.push(player);
	};
	this.getPlayerNames = function(){
		return _.pluck(players,'name');
	}
	this.startGame = function(){
	if(!gameStarted){
			croupier = new Croupier(players);
			croupier.distributeCards();
			croupier.openInitialCard();
			gameInspector.apprisePlayersTurn(croupier.players);
			gameStarted = true;
		}
	}
	this.provideCroupier = function(){
		return croupier;
	}
	this.end = function(){
		players=[];
		playersLimit=0;
		recentMove="";
		gameStarted=false;
		croupier=undefined;
	};
	this.id = undefined;
};

module.exports = Game;