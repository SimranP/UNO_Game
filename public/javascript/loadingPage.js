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

$(document).ready(function(){
	var interval = setInterval(function(){
		refreshData();
	},1000);
});