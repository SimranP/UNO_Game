var table;

var matchCard = function(card,discardedPile){
	card = JSON.parse(card);
	return card.name == "wildCard"
	||card.name == "plusFour"
	||card.color == discardedPile.color
	||card.name == discardedPile.name ;
}
	
var generateCards = function(hand){
	return hand.map(function(card){
		return '<td value='+JSON.stringify(card) +'>' +generateCardsImage(card.color,card.name)+ '</td>'
	}).join('');
};
var sortHand = function(hand){
	var newHand=[];
	var colors = ['red','blue','green','yellow',null];
		colors.forEach(function(color){
			var cards = hand.filter(function(card){
				return card.color == color;
			});
			cards.forEach(function(card){
				newHand.push(card);
			});
		});
	return newHand;
}

var showTable = function(table,interval){
	document.querySelector('.drawPile').onclick = function(){drawCard()}
	var hand = '<table><tr>'+generateCards(sortHand(table.player.hand))+'</tr></table>';
  	var discardedPile = '<table><tr>'+generateCards([table.discardedPile])+'</tr></table>';
  	$('#playerHand').html(hand);
  	$('#showTurn').html(table.currentPlayer + ' turn');
  	$('#otherPlayers').html(generateOtherPlayer(table.otherPlayerHand));
  	$('#discardPile').html(discardedPile);
  	$('#history').html(table.recentMove);
  	giveBehaviourToAllCards(table,interval);
  	checkWinner(table.otherPlayers,interval);
	var playersName = document.querySelectorAll('#otherPlayers table tr');
	for(var i = 0;i<playersName.length;i++){
		playersName[i].onclick = function(){
			var name = this.innerHTML;
			name = name.slice(4,name.indexOf("</td>"));
			catchUno(name);
		}
	}
};

var giveBehaviourToAllCards = function(table,interval){
	var selectedCards = $('#playerHand table td');
	for(var index=0;index<selectedCards.length;index++){
		selectedCards[index].onclick = function(){
			$('#wildCards').addClass('hide');
			var card = this.getAttribute('value');
			throwCard(card,table);
			generateTable(interval);
		};
	};
};

var generateOtherPlayer = function(otherPlayers){
	var playersTable = otherPlayers.map(function(player){
		return '<tr><td>'+player.name+'</td><td>'+player.hand+'</td><td>'+player.saidUno+'</td></tr>';
	}).join('');
	playersTable = "<table><th>Player's name</th><th>Cards</th><th>Said Uno</th>"+playersTable+"</table>";
	return playersTable;
};

var makeRequest = function(method,url,dataToSend,sync,interval){
	$.post(url,dataToSend,function(data,status){
		if (status == 'success') {
			var table;
			if(data!=false){
				table = JSON.parse(data);
	        	showTable(table,interval);
	        }
	    }
	});
};

var showPoints = function(players){
	if(players.length>1){
		players = players.sort(function(player1,player2){
				return player1.points > player2.points;
			});
	};
	var winner = players[0].name;
	var scoresList = players.map(function(player){
		return '<li>'+player.name+' : '+player.points+' points</li>';
	}).join('');
	return {scores:scoresList,winner:winner};
};

var restartGame = function(){
	$.post('restartGame','restartGame',function(url,status){
		 if (status == 'success') {
		 	window.location.href = url+"";
	    }
	});	
};

var checkWinner = function(players,interval){
	$.ajax({
		url:'checkWinner',
		method:'POST',
		async:true,
		data:'checkWinner',
		success:function(result){
			if(JSON.parse(result)[0].points!=undefined){
				clearInterval(interval);
				$('#container').html(scoreBoardHTML());
  				$('#first').html(showPoints(JSON.parse(result)).winner);
  				$('#Scores').html(showPoints(JSON.parse(result)).scores);
			}
		}
	});	
};

var scoreBoardHTML = function(){
return ['<div id="scoreContainer">',
			'<div id="first">',
			'</div>',
			'<div id="allScores">',
				'<h1>Here are the Scores..</h1>',
			'<p id="Scores"><p>',
			'</div><div class = "drawPile"></div>',
		'</div>',
		'<div id = "playAgain"><input type="submit" id = "restart" value = "Play Again" onclick = "restartGame()" /></div>'].join("");
};

var sayUno = function(){
	var table;
	$.get("provideTable","provideTable",function(data,status){
		if (status == 'success') {
			if(data!=false){
				table = JSON.parse(data);
				if(table.player.hand.length == 1){
					makeRequest('POST','sayUno','sayUno',true);
					alert('You said UNO');
				}
				else
					alert("you can't say UNO");
	        }
	    }
	});
}

var catchUno = function(playerName){
	var playerToCatch = "name="+playerName;
	var table;
	$.get("provideTable","provideTable",function(data,status){
		if (status == 'success') {
			if(data!=false){
				table = JSON.parse(data);
				var requiredPlayer = table.otherPlayerHand.filter(function(player){
					return player.name == playerName;
				});
				if(playerName==requiredPlayer[0].name && requiredPlayer[0].hand == 1 && !requiredPlayer[0].saidUno){
					makeRequest('POST','catchUno',playerToCatch,true);
					alert('you catched '+playerName);
				}
				else
					alert("you can't catch "+playerName + " now" );
	        }
	    }	
	});
}

var throwCard = function(card,table){
	if(matchCard(card,table.discardedPile)){
		var color;
		$('#changeTurn').addClass('hide');
		$('.drawPile').removeClass('hide');
		if(JSON.parse(card).action == 'wildCard' || JSON.parse(card).action == 'plusFour'){
			$('#wildCards').removeClass('hide');
			document.querySelector('#Cancel').onclick = function(){
				$('#wildCards').addClass('hide');
			};
			document.querySelector('#OK').onclick = function(){
				color =  $('#chooseColor').val();
				var dataToSend = 'card='+card+'&color='+color;
				makeRequest('POST','throwCard',dataToSend,true);
				$('#wildCards').addClass('hide');
			};
		}else{
			var dataToSend = 'card='+card+'&color='+color;
			makeRequest('POST','throwCard',dataToSend,true);
		}
	}else{
		alert("you are not allowed to do this");
	}
};

var drawCard = function(){
	$.get('provideTable','provideTable',function(data,status){
		if (status == 'success') {
			table = JSON.parse(data);
			if(table.player.myTurn){
				$('#changeTurn').toggleClass('hide');
				$('.drawPile').toggleClass('hide');
				makeRequest('POST','drawCard','drawCard',false);
			};
	    }
	});
};

var changeTurn = function(){
	$('#changeTurn').toggleClass('hide');
	$('.drawPile').toggleClass('hide');
	makeRequest('POST','changeTurn','changeTurn',false);
};

var generateTable = function(interval){
	$.get('provideTable','provideTable',function(data,status){
		if (status == 'success') {
			if(!data)
		 		window.location.href = "/";
			if(data){
				if(data != JSON.stringify(table)){
					table = JSON.parse(data);
	        		showTable(table,interval);
				}	  
	        }
	    }
	});
};

var checkKey=function(action) {
    action = action || window.event;
    if (action.keyCode == '83')
        sayUno();
};

$(document).ready(function(){
	var interval = setInterval(function(){
		generateTable(interval);
	},1000);
	document.onkeydown = checkKey;
	$('.sayUno').click(sayUno);
	$('#changeTurn').click(changeTurn);
});
