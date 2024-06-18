// Contains functions and variables related to My Documents.

var current_doc; 
 
function submitDocSuccess(data, textStatus, XMLHttpRequest) {
	if (data > 0) {
		//Last Modified could technically be updated as well if someone updated it around 11:59pm.
		if (doc_status == 'RenameDoc') {
			var doc_title = $("#new_title_" + current_doc).val();
			$("tr#" + current_doc + " .title a").html(doc_title);
		} else if (doc_status == 'DeleteDoc') {
			var docRowsToRemove = $(".select_id:checked").closest("tr");
			docRowsToRemove.next().fadeOut("slow").remove();
			docRowsToRemove.fadeOut("slow").remove();
		} else {
			alert("Error: Undefined operation.");
		}
	} else {
		alert("Error: problem saving document information.");
	}
	hideExpandedRow();
}

function updateDocInfo(docID, me) {
	doc_status = 'RenameDoc';
	var doc_id = docID;
 	current_doc = docID;
	var new_title = $("#new_title_" + docID).val();
	if ($("#importance_" + docID).attr('checked')) { var importance = 1; } 
	else { var importance = 0; }
	user = $("#user").val();
	dfAsyncRemoteCall(doc_status, {'doc_id': doc_id, 'new_title': new_title});
}

function sendDocTo() {
	var sendTo = $('#sendTo');
	if (sendTo.val() == 'email') { $('#email').removeClass("hidden"); $('#phone').addClass("hidden"); $('#fax').addClass("hidden"); } 
	else if (sendTo.val() == 'phone') { $('#phone').removeClass("hidden"); $('#email').addClass("hidden"); $('#fax').addClass("hidden"); } 
	else if (sendTo.val() == 'fax') { $('#fax').removeClass("hidden"); $('#email').addClass("hidden"); $('#phone').addClass("hidden"); } 
	else { $('#email').addClass("hidden"); $('#phone').addClass("hidden"); $('#fax').addClass("hidden"); }
}
