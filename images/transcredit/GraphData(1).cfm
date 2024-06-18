function xx_set_visible(imageID, id, e, value){
     	if (!xx_supported_client()) return ;
       	xx_get_by_id(id).style.visibility= value ? "visible" : "hidden";
       	if(value) xx_move_tag(imageID,id,e);
       	xx_get_by_id(id).style.display=value ? "" : "none";
}

function xx_move_tag(imageID, id,e){
    if (!xx_supported_client()) return ;
    var popup = xx_get_by_id(id);
    if (popup.style.visibility!="visible") return ;

    var ie=document.all;
    var ns6=!(!document.getElementById || ie)   ; /*document.getElementById AND !document.all*/

    var iebody = !(!document.compatMode || document.compatMode=="BackCompat")? document.documentElement : document.body;

    var dx = 10, dy = 10;
    var posX;
    var posY;
    var we = xx_get_by_id(imageID);
    var indiv =  (we.offsetParent) && (we.offsetParent.tagName != "BODY");


    if(!ns6 ) {
        if (indiv) {
            posX = event.offsetX+xx_getAbsX(we);
            posY = event.offsetY+xx_getAbsY(we);
        } else {
            posX = event.x + iebody.scrollLeft;
            posY = event.y + iebody.scrollTop;
        }
    } else {
    if (indiv) {
            posX = xx_getAbsX(we)-we.x+((e.offsetX) ? e.offsetX : e.layerX);
            posY = xx_getAbsY(we)-we.y+((e.offsetY) ? e.offsetY : e.layerY);
        } else {
            posX = e.pageX;
            posY = e.pageY;
        }
    }

    if(!indiv) {
        var ieNOTopera = !(!ie || window.opera);
        var rightedge= ieNOTopera ? iebody.clientWidth-event.clientX: window.innerWidth-e.clientX-20
        var bottomedge=ieNOTopera ? iebody.clientHeight-event.clientY : window.innerHeight-e.clientY-20

        if (rightedge-dx<popup.offsetWidth)
            posX=ie? iebody.scrollLeft+event.clientX-popup.offsetWidth : window.pageXOffset+e.clientX-popup.offsetWidth;

        if (bottomedge-dy<popup.offsetHeight) {
            posY=ie? iebody.scrollTop+event.clientY-popup.offsetHeight : window.pageYOffset+e.clientY-popup.offsetHeight;
            dy =-dy;
        }
    }

    popup.style.left=posX+dx+"px";
    popup.style.top=posY+dy+"px" ;
}


function xx_getAbsX(obj) {
    var leftOffset = 0;
    if (obj.offsetParent) while (obj.offsetParent) {
        leftOffset += obj.offsetLeft;
        obj = obj.offsetParent;
        if(obj.style && obj.style.position) break;
      }
    else if (obj.x) leftOffset = obj.x;
    return leftOffset;
}

function xx_getAbsY(obj) {
    var topOffset = 0;
    if (obj.offsetParent) while (obj.offsetParent) {
            topOffset += obj.offsetTop;
            obj = obj.offsetParent;
            if(obj.style && obj.style.position) break;
     }
     else if (obj.y)
            topOffset = obj.y;
    return topOffset;
}

function xx_supported_client() {
    return (document.all) || (document.getElementById);
}

function xx_get_by_id(id) {
    return document.all? document.all[id]: document.getElementById? document.getElementById(id) : ""
}
