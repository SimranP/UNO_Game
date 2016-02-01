var http = require('http');
var Game = require('./lib/game');
var all_games = [];
var usedCookie = [];
var server = http.createServer(function(req,res){
	if(req.url == '/createNewGame') {
		if(req.cookie)
			return ;
		var game = new Game();
		game.id = 'gameNo:'+(all_games.length+1);
		if(usedCookie.indexOf(req.headers.cookie)==-1){
			all_games.push(game);
			usedCookie.push(req.headers.cookie);
		}
		req.game = game;
	};
	var controller = require('./lib/controller')(all_games);
	return controller(req,res);
});
server.listen(process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080, process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");


