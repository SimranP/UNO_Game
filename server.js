var http = require('http');
var Game = require('./lib/game');
var all_game = [];
var server = http.createServer(function(req,res){
	all_game = [];
	if(req.url == '/createNewGame') {
		var game = new Game();
		game.id = 'gameNo:'+(all_game.length+1);
		all_game.push(game);
		req.game = game;
	};
	var controller = require('./lib/controller')(all_game);
	return controller(req,res);
});
server.listen(process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080, process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");


