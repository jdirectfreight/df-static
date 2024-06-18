// There are 2 if x == SOMENUMBER continue statements.
// they are mapped to the location of the adrotator in our results set.
// This code could be trapped by an eval, but I didn't want to do this incase
// another type of error shows up, and I don't have time to write it out.

function myinnertext(Xstr) {return Xstr.replace(/(<\/?[^>]+>|&nbsp;)/gi,"");}

var deadheadcity;
var deadheadstate;
var totalrows;
   var DEADHEADCOL=2;
   var TRIPCOL=3;
   var CITY1COL = 4;
   var STATE1COL = 5;
   var CITY2COL = 6;
   var STATE2COL = 7;

function updatesearchtable(city1,state1) 
   {  
   var mytable=document.getElementById('searchtable');
   totalrows = mytable.rows.length;
   city1 = city1.replace(/ /g,'+');
   deadheadcity = city1;
   deadheadstate = state1;
   if(city1.length > 1) { setTimeout("getdeadheadmiles(1)",2); }  //launch after page load
   } 

function getdeadheadmiles(mystartrow) 
   {
   var numrows = 22; //num of rows per batch //want to double as we have 2for1 now.
   if(totalrows <= 2) {return;}
   if(mystartrow >= totalrows) {return;}
   if(numrows+mystartrow >= totalrows) {numrows = totalrows-mystartrow;}
   var mytable=document.getElementById('searchtable');

   var myurl = '/googlemaps/getallmiles.pl?' + deadheadcity + '=' + deadheadstate;
   var obj;
   if (document.getElementById) 
      {
      obj = (window.ActiveXObject) ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
      }
   if (obj) 
      {
      var x;
      for(x=0;x < numrows; x++) //build deadhead lookup url
         {
	 	if (mytable.rows[mystartrow+x].cells.length < 5) continue;
			var deadhead = myinnertext(mytable.rows[mystartrow+x].cells[DEADHEADCOL].innerHTML);
			if(deadhead == "0" || deadhead > 0) continue;
         	myurl = myurl + '&' + myinnertext(mytable.rows[mystartrow+x].cells[CITY1COL].innerHTML).replace(/ /g,'+') +
            		'=' + myinnertext(mytable.rows[mystartrow+x].cells[STATE1COL].innerHTML);
         }
      obj.onreadystatechange = function() 
         {
         var x,city1,state1,y;
         if (obj.readyState == 4 && obj.status == 200) 
            {
            setTimeout("getdeadheadmiles("+(mystartrow+numrows)+")",3); //get next batch
            mydata = obj.responseText.split("\n");
			y = 0;
            for(x=0;x<numrows;x++)
               {
	 	 	   if (mytable.rows[mystartrow+x].cells.length < 5) { continue; }
				var deadhead = myinnertext(mytable.rows[mystartrow+x].cells[DEADHEADCOL].innerHTML);
               city1 = myinnertext(mytable.rows[mystartrow+x].cells[CITY1COL].innerHTML).replace(/ /g,'+');
               state1 = myinnertext(mytable.rows[mystartrow+x].cells[STATE1COL].innerHTML);
			   if(!(deadhead == "0" || deadhead > 0))
					{
               		if(mydata[y] >= 0) { deadhead = Math.round(mydata[y]);}
               		else { deadhead = "N/A";}
					y++;
					}
               mytable.rows[mystartrow+x].cells[DEADHEADCOL].innerHTML = 
               "<a target=_blank href=\"../route?origin=" + 
               deadheadcity + 
               "," + deadheadstate + 
               "&destination1=" + city1 +
               "," + state1 + 
			    "\">" + deadhead + "</a>";
               }
            }
         }
      obj.open("GET", myurl, true);
      obj.send(null);
      }
  }

