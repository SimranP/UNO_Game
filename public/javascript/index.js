var refreshData = function(){
	$.post('indexRefreshData','data=indexRefreshData',function(data,status){
		 if (status == 'success') {
		 	if(data){
		    	var response = JSON.parse(data);
			 	if(response.reachedPlayersLimit == true)
			 		window.location.href = response.url+"";
		    	else
					$('#players').html(response.data);
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

var joinGame = function(gameId){
	var id = '#'+gameId.split(':')[1];
	var name = $(id).val();
	var requestForJoin =  'name='+name +'&gameID='+gameId;
	if(name != "")
		joinGameWithID(requestForJoin);
	else
		alert('please enter correct entries');
}


var postPlayerInformation = function(request){
	$.post('createNewGame',request,function(data,status){
		if(status == 'success') 
			window.location.href = "loadingPage.html";
	});
};

var createNewGame = function(){
	var playersLimit = (document.querySelector("#noOfPlayer")) && document.querySelector("#noOfPlayer").value;
	var name = document.querySelector("#name").value;
	var requestForLoad = 'name='+name + "&playersLimit=" + playersLimit ;
	if((name != "" && playersLimit != "" && playersLimit<9 && playersLimit >0))
		postPlayerInformation(requestForLoad);
	else
		alert('please enter correct entries');
}



var printForm = function(){
	$.get('provideIndexForm','data=provideIndexForm',function(data,status){
		 if (status == 'success') {
		 	$('#inputForm').html($('#inputForm').html()+data.indexForm);
			$('#loadGame').click(createNewGame);
			if(!data.joinForm){
				$('#openJoinForm').hide();
			};
			$('#joinForm').html($('#joinForm').html()+data.joinForm);
			var button = document.querySelector('#join');
			button.onclick = function(){
				joinGame(button.value);
			};
	    }
	});
};

// var checkKey = function(event){
// 	if(event.keyCode == '13' && document.activeElement.id != 'join')
// 		submitName();		
// };
$(document).ready(function(){
	printForm();
	$('#openJoinForm').click(function(){
		$("#joinDiv").slideToggle("slow");
	});
	// $(document).keypress(checkKey);
});


