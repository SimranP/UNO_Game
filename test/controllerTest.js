var sinon = require('sinon');
var request = require('supertest');
var createController = require('../lib/controller');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var games =[];
var controller;
describe('routes',function(){
	beforeEach(function(){
		game = {};
		games[0] = game;
		controller = createController(games);
	})
	describe('get /',function(){
		it('should serve the login page',function(done){
			request(controller)
				.get('/')
				.expect(302)
				.expect('Location','/index.html',done);
		});
	});
	describe('get /provideIndexForm',function(){
		it('should give give login fields',function(done){
			games[0].hasPlayers = sinon.stub().returns(false);
			games[0].hasVacancy = sinon.stub().returns(true);
			games[0].id = "gameNo:2";
			games[0].getplayersLimit = sinon.stub().returns(3);
			games[0].getPlayerNames = sinon.stub().returns(["yu","ty"]);
			request(controller)
				.get('/provideIndexForm')
				.expect(200)
				.expect(/Enter your name/,done);
		});
	});
	describe("/joinGame",function(){
		it("should allow the player to join a particular game",function(done){
			var game = games[0];
			game.provideCroupier = sinon.stub().returns({});
			game.hasVacancy = sinon.stub().returns(true);
			game.register = sinon.spy();
			games[0].getPlayerNames =sinon.stub().returns(['simmo']);
			var croupier = game.provideCroupier();
			croupier.players = [{name:'simmo',id:'520',myTurn:true,hand:[{name:9,color:'red'}],saidUno:false}];
			request(controller)
				.post('/joinGame')
				.send('name=simmo')
				.set('Cookie',['info=name=520&game=568'])
				.expect(/Game is going on(.*)simmo/)
				.expect(200,done);
		});	
	});
	describe('post /indexRefreshData',function(){
		it('should send an object if player limit reached',function(done){
			games[0].setLimit = sinon.stub().withArgs(1);
			games[0].hasVacancy = sinon.stub().returns(false);
			games[0].contains = sinon.stub().returns(true);
			games[0].getPlayerNames =sinon.stub().returns(['ram prakash']);
			request(controller)
				.post('/indexRefreshData')
				.expect(200)
				.set('Cookie',['name=12345668'])
				.expect(/{"reachedPlayersLimit":true,"url":"gamePage.html"}/,done);
		});
	});
	describe('get /provideTable',function(){
		it('gives the initial table when game starts according to the player who request',function(done){
			game.hasVacancy = sinon.stub().returns(false);
			game.contains = sinon.stub().returns(true);
			game.startGame = sinon.spy();
			game.provideCroupier = sinon.stub().returns({});
			game.getMoves = sinon.stub().returns("nothing");
			var croupier = game.provideCroupier();
			croupier.players = [{name:'simmo',id:'420',myTurn:true,hand:[]}];
			croupier.discardedPile = [];
			request(controller)
				.get('/provideTable')
				.set('Cookie',['name=420'])
				.expect(200)
				.expect(/"player":(.*)"otherPlayerHand":(.*)"recentMove":(.*)"currentPlayer/,done);
		});
	});
	describe("/throwCard",function(){
		it("should throw a card from players hand",function(done){
			game.provideCroupier = sinon.stub().returns({});
			game.getMoves = sinon.stub().returns("nothing");
			game.contains = sinon.stub().returns(true);
			var croupier = game.provideCroupier();
			croupier.makeMove = sinon.spy();
			croupier.discardedPile = [];
			croupier.players = [{name:'simmo',id:'420',myTurn:true,hand:[{name:9,color:'red'}]}];
			var card = JSON.stringify({name:9,color:'red'});
			request(controller)
				.post('/throwCard')
				.send('card='+card)
				.expect(200)
				.expect(/"otherPlayerHand":(.*)"recentMove":"nothing","currentPlayer":/,done);
		});
	});
	describe("/drawCard",function(){
		it("should draw a card from the draw pile and add it to players hand",function(done){
			game.provideCroupier = sinon.stub().returns({});
			game.addRecentMove = sinon.stub().returns("nothing");
			game.getMoves = sinon.spy();
			game.contains = sinon.stub().returns(true);
			var croupier = game.provideCroupier();
			croupier.makeMove = sinon.spy();
			croupier.discardedPile = [];
			croupier.players = [{name:'simmo',id:'420',myTurn:true,hand:[{name:9,color:'red'}]}];
			request(controller)
				.post('/drawCard')
				.send('')
				.set('Cookie',['name=420'])
				.expect(/"player"(.*)"otherPlayerHand"(.*)"currentPlayer"/)
				.expect(200,done);
		})
	});
	describe("/sayUno",function(){
		it("should make the respective players saidUno true",function(done){
			game.provideCroupier = sinon.stub().returns({});
			game.addRecentMove = sinon.stub().returns("nothing");
			game.contains = sinon.stub().returns(true);
			var croupier = game.provideCroupier();
			croupier.players = [{name:'simmo',id:'420',myTurn:true,hand:[{name:9,color:'red'}],saidUno:false}];
			croupier.sayUno = function(){};
			request(controller)
				.post('/sayUno')
				.set('Cookie',['name=420'])
				.send('/sayUno')
				.expect(200,done);
		});
	});
	describe("/catchUno",function(){
		it("should give 2 cards to the respective player",function(done){
			game.provideCroupier = sinon.stub().returns({});
			game.addRecentMove = sinon.stub().returns("nothing");
			game.contains = sinon.stub().returns(true);
			var croupier = game.provideCroupier();
			croupier.players = [{name:'simmo',id:'420',myTurn:true,hand:[{name:9,color:'red'}],saidUno:false}];
			croupier.catchUno = sinon.stub().returns(false);
			request(controller)
				.post('/catchUno')
				.set('Cookie',['name=420'])
				.send('name=simmo')
				.expect(200,done);
		});
	});
	describe("/checkWinner",function(){
		it("should display the scores",function(done){
			game.provideCroupier = sinon.stub().returns({});
			game.addRecentMove = sinon.stub().returns("nothing");
			game.contains = sinon.stub().returns(true);
			var croupier = game.provideCroupier();
			croupier.players = [{name:'simmo',id:'420',myTurn:true,hand:[{name:9,color:'red'}],points:9,saidUno:false}];
			croupier.countPoints = sinon.spy();
			request(controller)
				.post('/checkWinner')
				.send('name=simmo')
				.expect(/points/)
				.expect(200,done);
		});
	});
});
