var http = require('http');
var express = require('express');
var app = express();
var fs = require('fs');
var ld  =require('lodash');
var querystring = require('querystring');
var unoLib = require('./croupier.js').lib;
var Player = unoLib.Player;
var gameInspector = require('./gameInspector.js').gameInspector;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Game = require('./game')
var passport = require('passport');
var config = require('./oauths.js');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;

app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());
app.use(express.session({ secret: 'my_precious' }));
app.use(passport.initialize());
app.use(passport.session());

// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// config
passport.use(new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

passport.use(new GoogleStrategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackURL,
  passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){});
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/login');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.get('/auth/google',
  passport.authenticate('google', { scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read'
  ] }
));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/login');
  });


// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}


// providing the data to all the requests.....
var all_games;
var get_a_game_for_id = function(id){
	return all_games.filter(function(game){
		return id == game.id;
	})[0];
};

var select_game = function(playerId){
	return all_games.filter(function(game){
		if(game.contains(playerId)) return game;
	})[0];
};

app.get('/',function(req,res){
	res.redirect('/index.html');
});

app.use(express.static('./public'));

app.get('/login',function(req,res){
  var playerName
    (req.user) && (playerName = req.user.displayName)||(playerName = req.body.name);
  	if(!req.cookies.name) {
  		var value  = "name="+playerName+":"+Math.random();
  		res.cookie('name',value);
  	};
    if(req.user)
  	   res.redirect("/loadingPage.html");
    res.send("/loadingPage.html");
});

app.get('/provideJoinForms',function(req,res,next){
	var content = {};
	var waiting_games = all_games.filter(function(game){
		return game.hasVacancy();
	});
	var joinForm= '';
	var name = req.cookies.name.split(':')[0];
	content.name =name;
	waiting_games.forEach(function(game){
		joinForm += '<div class="game">Members of this Game: <br>'+game.getPlayerNames().join('<br>')
		+'<br><button  class="btn" id="join"'+' value='+game.id+'>Join</button></div><br><br>'
	});
	content.joinForm = joinForm;
	res.send(content);
});

app.post('/createNewGame',function(req,res,next){
	var requester = req.body;
	req.game.setLimit(+requester.playersLimit);
	var playerName = req.cookies.name.split(':')[0];
	var id = req.cookies.name;
	var player = new Player(playerName,id);
	req.game.register(player);
	res.send("Game is going on between : <br>"+req.game.getPlayerNames().join('<br>'));
});

app.post('/joinGame',function(req,res,next){
	req.game = get_a_game_for_id(req.body.gameID);
	var playerName = req.body.name;
	var id = req.cookies.name;
	var player = new Player(playerName,id);
	if(req.game.hasVacancy()){
		req.game.register(player);
		res.send("Game is going on between : <br>"+req.game.getPlayerNames().join('<br>'));
	}
	else
		res.send('sorry this game has no vacancy ....');
});


var getCurrentPlayerIndex=function(playerId,players){
	return ld.findIndex(players, function(player) {
 		return player.id == playerId;
	});
}

var getCurrentPlayer = function(players){
	var player = players.filter(function(player){
		return  player.myTurn == true;
	});
	return player[0].name;
};

var getPlayerDetails = function(player){
	var dataOfPlayerToReturn={};
	dataOfPlayerToReturn["name"] = player.name;
	dataOfPlayerToReturn["hand"] = player.hand.length;
	dataOfPlayerToReturn["myTurn"] = player.myTurn;
	dataOfPlayerToReturn["saidUno"] = player.saidUno;
	return dataOfPlayerToReturn;
};

var createTableForEachPlayers = function(playerId,game){
	var croupier = game.provideCroupier();
	var currentPlayerIndex = getCurrentPlayerIndex(playerId,croupier.players);
	var table={};
	table.player = croupier.players[currentPlayerIndex];
	table.otherPlayerHand = croupier.players.map(getPlayerDetails);
	table.recentMove = game.getMoves();
	table.currentPlayer = getCurrentPlayer(croupier.players);
	table.discardedPile = croupier.discardedPile[croupier.discardedPile.length - 1];
	return table;
};

app.get('/provideTable',function(req,res){
	var playerId = req.cookies.name;
	req.game = select_game(playerId);
	if(!req.game.contains(playerId)){
		res.send();
		return;
	}
	else if(!req.game.hasVacancy())
		req.game.startGame();
	res.send(JSON.stringify(createTableForEachPlayers(playerId,req.game)));
});

app.post('/throwCard',function(req,res){
	var playerID = req.cookies.name;
	req.game = select_game(playerID);
	var playedCard = JSON.parse(req.body.card);
	var color = req.body.color;
	var croupier = req.game.provideCroupier();
	croupier.makeMove(playerID,playedCard,color);
	res.send(JSON.stringify(createTableForEachPlayers(playerID,req.game)));
});

app.post('/indexRefreshData',function(req,res){
	var requesterId = req.cookies.name;
	req.game = select_game(requesterId);
	var dataToReturn;
	if(!req.game)
		res.send();
	else if(!req.game.hasVacancy() && (req.game.contains(requesterId))){
		dataToReturn = {reachedPlayersLimit:true, url:"gamePage.html" };
	}
	else if(!req.game.hasVacancy() && (!req.game.contains(requesterId))){
		dataToReturn = {data:"sorry game is going on please wait for game to get over."};
	}
	else if(req.game.hasVacancy()){
		dataToReturn = {data:(req.game.getPlayerNames().join('&nbsp;&nbsp;&nbsp;&nbsp;✔<br>'))};
		dataToReturn.data+='&nbsp;&nbsp;&nbsp;&nbsp;✔<br>';
	}
	res.send(JSON.stringify(dataToReturn));
});

app.post('/drawCard',function(req,res){
	var playerID =req.cookies.name;
	req.game = select_game(playerID);
	var croupier = req.game.provideCroupier();
	var currentPlayer = unoLib.getPlayerDetails(playerID,croupier.players);
	req.game.addRecentMove(">> "+currentPlayer.name+" has drawn a card"+"<br>");
	croupier.makeMove(playerID);
	res.send(JSON.stringify(createTableForEachPlayers(playerID,req.game)));
});

app.post('/changeTurn',function(req,res,data){
	var playerID = req.cookies.name;
	req.game = select_game(playerID);
	var croupier = req.game.provideCroupier();
	var currentPlayer = unoLib.getPlayerDetails(playerID,croupier.players);
	if(unoLib.checkEligibility(currentPlayer,croupier.players)){
		croupier.players=gameInspector.apprisePlayersTurn(croupier.players);
	}
	res.send(JSON.stringify(createTableForEachPlayers(playerID,req.game)));
});

app.post('/sayUno',function(req,res){
	req.game = select_game(req.cookies.name);
	var croupier = req.game.provideCroupier();
	var player = unoLib.getPlayerDetails(req.cookies.name,croupier.players);
	req.game.addRecentMove(">> "+player.name + " said UNO <br>");
	var unoSaid = croupier.sayUno(player);
	res.send();
});

app.post('/catchUno',function(req,res){
	var isCaught;
	var name = req.body.name;
	var playerID = req.cookies.name;
	req.game = select_game(playerID);
	var croupier = req.game.provideCroupier();
	var caughtBy = unoLib.getPlayerDetails(playerID,croupier.players);
	if(name){
		var indexOfPlayer = ld.findIndex(croupier.players,function(player){
			return player.name == name;
		});
		isCaught=croupier.catchUno(croupier.players[indexOfPlayer]);
	}
	if(isCaught)
		req.game.recentMove = ">> "+name+ " was caught for not saying UNO by "+caughtBy.name+"<br>"+req.game.recentMove;
	res.send();
});

app.post('/checkWinner',function(req,res){
	req.game = select_game(req.cookies.name);
	var croupier = req.game.provideCroupier();
	players = croupier.players;
	if(unoLib.checkForEndGame(players)){
		croupier.countPoints();
	};
	var pointsInformation = croupier.players.map(function(player){
		return {name:player.name,points:player.points};
	});
	res.send(JSON.stringify(pointsInformation));
});

app.post('/restartGame',function(req,res){
	req.game = select_game(req.cookies.name);
	if(req.game)
		req.game.end();
	req.cookie = '';
	res.send("/");
});

module.exports = function(games){
	all_games = games;
	return function(req,res){
		app(req,res);
	}
};
