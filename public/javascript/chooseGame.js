var refreshData = function(){
	$.post('indexRefreshData','data=indexRefreshData',function(data,status){
		 if (status == 'success') {
		 	if(data){
		    	var response = JSON.parse(data);
			 	if(response.reachedPlayersLimit == true)
			 		window.location.href = response.url+"";
		    	else
					$('#joinedPlayers').html(response.data);
			}
	    }
	});
};

var joinGameWithID = function(request){
	$.post('joinGame',request,function(data,status){
		if(status == 'success') {
			window.location.href = "loadingPage.html";
	    }
	});
};

var joinGame = function(gameId,name){
	var id = '#'+gameId.split(':')[1];
	var requestForJoin =  'name='+name +'&gameID='+gameId;
	if(name != "")
		joinGameWithID(requestForJoin);
	else
		alert('please enter correct entries');
}


var postPlayerInformation = function(request){
	$.post('createNewGame',request,function(data,status){
	});
};


var createNewGame = function(name){
	var playersLimit = $("#playersLimit").val();
	var requestForLoad = 'name='+name + "&playersLimit=" + playersLimit ;
	if((name != "" && playersLimit != "" && playersLimit<9 && playersLimit >0))
		postPlayerInformation(requestForLoad);
	else
		alert('please enter correct entries');
}



var printForm = function(){
	$.get('provideJoinForms','data=provideIndexForm',function(data,status){
		 if (status == 'success') {
			$('#start').click(function(){
				createNewGame(data.name)
			});
			$('.joinGame').html($('.joinGame').html()+data.joinForm);
			var button = document.querySelector('#join');
			button.onclick = function(){
				joinGame(button.value,data.name);
			};
	    }
	});
};

var checkKey = function(event){
	if(event.keyCode == '13' && document.activeElement.id != 'join')
		submitName();
};
$(document).ready(function(){
	printForm();
	var interval = setInterval(function(){
		refreshData();
	},1000)
	$(document).keypress(checkKey);
});
