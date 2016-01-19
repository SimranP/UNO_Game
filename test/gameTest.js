var Game = require('../lib/game');
var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');

describe('Game',function(){
	describe('hasPlayers',function(){
		it('indicates no when it does not have players',function(){
			var game = new Game();
			assert.notOk(game.hasPlayers());
		}),
		it('indicates yes when it has players',function(){
			var game = new Game();
			game.register({id:1});
			assert.ok(game.hasPlayers());
		})
	});
	describe('contains',function(){
		it('indicates if the player is in the game',function(){
			var game = new Game();
			game.register({id:1})
			assert.ok(game.contains(1));
			assert.notOk(game.contains(2));
		})
	});
	describe('setLimit',function(){
		it('it sets the players limit',function(){
			var game = new Game();
			game.setLimit(3);
		})
	});
	describe('addRecentMove',function(){
		it('it sets the players limit',function(){
			var game = new Game();
			game.addRecentMove("somebody has drawn a card");
			assert.deepEqual(game.getMoves(),"somebody has drawn a card");
		})
	});
});