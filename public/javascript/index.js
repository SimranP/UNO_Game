var chooseGame = function(player){
	$.get("/login","playerName="+player,function(data,status){
		if(status == "success"){
			if (data) {
				window.location.href = data+"";
			};
		}
	});
};

$(document).ready(function(){
	$('#loginBtn').click(function(){
		var playerName = $('#user').val();
		chooseGame(playerName);
	});
})
