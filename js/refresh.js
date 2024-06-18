
var disabled = 0;
var seconds = 300;
var secondcount = 0;
var dialogcount = 0;
var url = window.location;
var results_timer = 0;

function update_now() { disabled=0; seconds=2; }

function timer_toggle(me) {
	if (disabled == 0) { me.innerHTML="Enable Refresh"; disabled=1; } 
	else { me.innerHTML="Disable Refresh"; disabled=0; }
}

function timer_countdown() {
	seconds = seconds - 1;
	setTimeout("timer_countdown()", 1000);
	if(disabled == 1) return;
	if ( seconds == 0 ) { window.location = url; } 
	else if (seconds > 0) 
		{
		document.getElementById('second_countdown').innerHTML = ( ('0' + seconds % 60).slice(-2) );
		document.getElementById('minute_countdown').innerHTML = Math.floor( seconds / 60 );
		}	
}

var dialogbox = 0;

function timer_countup() {
	secondcount = secondcount + 1;
	dialogcount = dialogcount + 1;
	setTimeout("timer_countup()", 1000);

	if($('#loadresults-maintable').has( "table" ).length > 0)
			{
			if(secondcount > 250 && dialogcount > 300)
				{
				dialogcount = 0;
						$(function() {
						dialogbox = $( "#dialog-confirm" ).dialog({
						resizable: false,
						width:440,
						height:240,
						modal: true,
						buttons: {
						"Keep Viewing Old Loads": function() {
						$( this ).dialog( "close" );
						},
						"Refresh List": function() {
						secondcount=0;
						getResults("maintable",$('#form-search').serialize()); 
						$( this ).dialog( "close" );
						}
						}
						});
						});
				}
			}
	else { secondcount=0; dialogcount=0; }
	document.getElementById('second_countdown').innerHTML = ( ('0' + secondcount % 60).slice(-2) );
	document.getElementById('minute_countdown').innerHTML = Math.floor( secondcount / 60 );
	}
