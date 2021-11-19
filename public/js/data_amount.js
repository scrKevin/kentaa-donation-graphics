var host = window.location.hostname

function InitWebSocket()
{
  if ("WebSocket" in window)
  {
    var scheme = "ws"
		var wsPort = ":8080"
		if (window.location.protocol == 'https:') {
			scheme = "wss"
			wsPort = ""
		}
		// Let us open a web socket
		//host = window.location.hostname;
		ws = new WebSocket(scheme + "://" + host + wsPort + window.location.pathname);
   
     ws.onopen = function()
     {
     };
     ws.onmessage = function (evt) 
     { 
        var msg = evt.data;
        var data = JSON.parse(msg);
        console.log(data);

        if (data.type == "newAmount") {
           var pl = data.payload;

           $(".amountContainer").html(Math.floor(pl.amount))
           $(".targetAmount").html(pl.target_amount)
           $(".totalDonations").html(pl.total_donations)
           var percentage = Math.floor((pl.amount / pl.target_amount) * 100)
           $(".percentage").html(percentage)
        }
        
     };
     ws.onclose = function()
     { 
        // websocket is closed.
        setTimeout(function(){InitWebSocket();}, 2000);
     };
  }
  else
  {
     // The browser doesn't support WebSocket
     //alert("WebSocket NOT supported by your Browser!");
  }
}

$( document ).ready(function() {
  InitWebSocket()
});