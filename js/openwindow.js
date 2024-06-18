
function openwindow(mythis,myevent)
   {
   var X = myevent.screenX;
   var Y = myevent.screenY;
   var w=200,h=200;
   var url = mythis.href;

   if (url.indexOf("abbr") != -1) {w=200;h=300;}
   else if (url.indexOf("terms") != -1) {w=300;h=200;}
   else if (url.indexOf("deadhead") != -1) {w=200;h=200;}
   else if (url.indexOf("flags") != -1) {w=350;h=200;}
   else if (url.indexOf("trailertype") != -1) {w=220;h=350;}
   else if (url.indexOf("moreinfo1") != -1) {w=452;h=236;}
   else if (url.indexOf("moreinfo2") != -1) {w=480;h=292;}
   else if (url.indexOf("moreinfo3") != -1) {w=452;h=236;}
   else if (url.indexOf("feedback") != -1) {w=676;h=500; X=X-710;}

   var options = "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no,width="+w+",height="+h+",top="+Y+",left="+X;

   var info = window.open(url,"moreinfo",options); 
   info.document.onreadystatechange = function()
   {
      if (info.document.readyState == 'complete') //damn IE race condition
         {
         if(info.innerHeight==h && info.innerWidth==w) {return false;} //firefox is a go
	 //ok, let's fix IE including the scrollbar
	 //info.resizeBy(w-info.document.body.clientWidth,h-info.document.body.clientHeight);
	 info.resizeBy(w-info.document.body.clientWidth,0); //bottom scrollbar vanishes in IE
         }
   }

   return false;  //if we successfully create the window, we don't want to follow the url
   }

