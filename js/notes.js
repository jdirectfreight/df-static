// Contains functions and variables related to My Notes and notes on results pages.


// Determines have happens after a note is "submitted".
function submitNoteSuccess(data, textStatus, XMLHttpRequest) {

	if ( typeof data === 'object') {
		let note_id = data.note_id;
		data = note_id;
	}
	
	//If returned data (the note's ID)
	if (data > 0) {

		switch(note_status) {

		// When editing note, update title.
		case "EditNote":
			var note_title = $("#note_title_" + current_note).val();
			$("tr#" + current_note + " .title").fadeOut("slow").fadeIn("slow");
			$("tr#" + current_note + " .title a").html(note_title);
			break;

		// When adding a new note (results page), attach note ID to the row and other respective elements to update them. 
		// Bind button events so that they work and update note identifier button.
		case "AddNote":
			var thisButtonGroup = $("#note-actions-" + current_element);
			thisButtonGroup.closest("tr").addClass("note-" + data);
			thisButtonGroup.closest("tr").prev().addClass("note-load");
			$(".note-" + data + " .note_title").attr("id", "note_title_" + data);
			$(".note-" + data + " .note_body").attr("id", "note_" + data);
			$("#note-actions-" + current_element + " button:first").fadeOut("slow").fadeIn("slow").html("Save Changes").attr("onclick", null).off("click");
			$(thisButtonGroup).on("click", "button:first", function() {
 				updateNoteInfo(data, this);
			});
			$("#options-" + current_element + " .result-actions button.note-button").html("Note for this load");
			break;

		// When adding a generic note (notes page), .
		case "AddNoteGeneric":
			expandNote("this", data, "addNewEdit");
			$("#new-note .new").val('');
			$(".note-" + data).on("click", ".saveNote", function() {
				updateNoteInfo(data, this);
			});
			$("#" + data + " .note-title").on("click", function(event) {
				event.preventDefault();
				$("#note-" + data + " div.note").slideToggle("slow");
			});
			$("#new-note").closest("tr").find("div:first").slideToggle("slow");
			break;

		// When deleting note(s), remove the HTML that represents said note(s).
		case "DeleteNote":
			var noteRowsToRemove = $(".select_id:checked").closest("tr");
			noteRowsToRemove.next().fadeOut("slow").remove();
			noteRowsToRemove.fadeOut("slow").remove();
			break;

		default:
			console.log("Undefined AJAX Success");

		}

	} else {
		alert("There was a problem saving note information to Direct Freight.");
	}
}


// Submits note info to be updated.
function updateNoteInfo(noteID, me) {
	note_status = 'EditNote';
	current_note = noteID;

	var note_title = $("#note_title_" + noteID).val();
	var note = $("#note_" + noteID).val();
	if ($("#importance_" + noteID).is(":checked")) {
		var importance = 1;
	} else {
		var importance = 0;
	}

	var user = $("#user").val();

	if (user != '') {
		dfAsyncRemoteCall(note_status, {'note_id': noteID, 'title': note_title, 'body': note, 'important': importance});
	} else {
		alert("This feature is disabled for Demo Accounts. Please login to use this feature.");
	}
}

// Deletes one or more notes.
function deleteNotes(formID) {
	note_status = 'DeleteNote';

	var notes_to_delete = "";
	$("#" + formID +  " .select_id:checked").each(function() {
		notes_to_delete += $(this).closest("tr").attr("id") + ",";
	});
	var notes_to_delete = notes_to_delete.slice(0, -1);

	var user = $("#user").val();

	if (notes_to_delete != "") {

		if (user != '') {
			dfAsyncRemoteCall(note_status, {'note_id': notes_to_delete});
		} else {
			alert("This feature is disabled for Demo Accounts. Please login to use this feature.");
		}

	} else {
		alert('No notes selected to delete.');
	}
}


function submitNoteInfo(me, md5) {

    //md5 parameter is optional
    var md5 = (typeof md5 === "undefined") ? "" : md5;

	note_status = 'AddNote';
	//Set global current note element
	current_element = md5;

	if (!md5) {
		var specific_note = $("#new-note").find("div.note");
	} else {
		var specific_note = $("#options-" + md5).find("div.note");
	}

	var note_title = specific_note.find("input.note_title").val();
	var note = specific_note.find("textarea.note_body").val();
	var user = document.getElementById('user').value;
    
    if ( !note || !note.length ) {
        alert('Missing or invalid note text.');
        return false;
    }
    
	if (document.location.href.match("loads")) {
		page_type = 'loads';
	} else if (document.location.href.match("trucks")) {
		page_type = 'trucks';
	} else {
		page_type = 'generic'
		note_status = 'AddNoteGeneric';
	}

	if ((user != '') && (note_status != 'none')) {
		dfAsyncRemoteCall(note_status, {'md5sum': md5, 'note_title': note_title, 'note': note, 'page_type': page_type});
	} else {
		alert("This feature is disabled for Demo Accounts. Please login to use this feature.");
	}
}


// Adds a new note for a particular result item on the results page.
function addNoteRowContent(row, md5) {

	var newNote = $(document.createElement('div'));
	newNote.addClass("note");

	// Build automatic title
	var thisRow = $(row);
	
	var originCity = thisRow.children("td.origin-city").text();
	var originState = thisRow.children("td.origin-state").text();
	var destinationCity = thisRow.children('.destination-city').text();
	var destinationState = thisRow.children('.destination-state').text();
	var companyName = $('.company-name', thisRow).text().trim();
	var autoTitle = originCity + ', ' + originState +  ' to ' + destinationCity + ', ' + destinationState;
    
    if ( companyName && companyName.length && !companyName.toUpperCase().includes("NOT SHOWN IN FREE") ) {
        autoTitle += ' - ' + companyName;
    }

	newNote.html(
		"<input type=\"text\" name=\"note_title\"class=\"note_title\" value='" + autoTitle + "' />\n" + 
		"<textarea name=\"note\" class=\"note_body\"></textarea>\n" + 
		"<p id=\"note-actions-" + md5 + "\" class=\"buttons\"><button type=\"button\" class=\"button regular\" onclick='submitNoteInfo(this, \"" + md5 + "\")'>Add to Notes</button>" + 
		"<button type=\"button\" class=\"button noaction closeRow\">close</button><a class=\"right button noaction\" href=\"" + dfBaseURL + "user/notes\">View all of My Notes</a></p>");

	//finds .result-actions
	thisRow.next("tr").find("section").eq(0).append(newNote);

	thisRow.addClass("noteAdd");
}


//Creates new note on notes pages to be able to view/edit.
function editNewNoteRowContent(noteID) {
	var noteTitle = $("#new-note .note_title").val();
	var noteBody = $("#new-note .note_body").val();
	var currentTime = new Date();
	var month = currentTime.getMonth() + 1;
	var day = ('0' + currentTime.getDate()).slice(-2);
	var year = currentTime.getFullYear();
	currentTime = year + "-" + month + "-" + day;
	var contentToReturn =
	"<tr id=\"" + noteID +"\">" +
		"<td><input id=\"note-" + noteID +"\" name=\"select_id\" class=\"select_id\" type=\"checkbox\"></td>" +
		"<td class=\"important\"><input type=\"checkbox\" id=\"importance_" + noteID + "\" onchange=\"updateNoteInfo('" + noteID + "', this); return false;\" name=\"importance\" class=\"importance\" value=\"1\" checked=\"checked\" style=\"opacity: 0.0001;\"><div class=\"Zebra_TransForm_Checkbox Zebra_TransForm_Checkbox_Checked\" style=\"visibility: visible; left: 14.5px; top: 2px;\"><div class=\"Zebra_TransForm_Checkbox_Tick\"></div></div></td>" + 
		"<td class=\"title\"><a class=\"note-title toggleRow\" href=\"#\" data-toggle=\"note-" + noteID + "\">" + noteTitle +"</a></td>" +
		"<td class=\"type\">Generic</td>" + 
		"<td class=\"date-added\">" + currentTime + "</td>" + 
		"<td class=\"date-modified\">" + currentTime + "</td>" +
	"</tr>" +
	"<tr id=\"note-" + noteID + "\" class=\"note-" + noteID + "\">" + 
		"<td colspan=\"6\">" + 
			"<div class=\"note\">\n" + 
				"<p><input type=\"text\" name=\"note_title\" id=\"note_title_" + noteID + "\" class=\"note-title\" value=\"" + noteTitle + "\">" + 
				"<textarea name=\"note\" id=\"note_" + noteID + "\">" + noteBody + "</textarea></p>\n" + 
				"<p class=\"buttons\"><button type=\"button\" class=\"button regular saveNote\" onclick='updateNoteInfo(" + noteID + ", this)'>Save</button><button type=\"button\" class=\"button noaction closeRow\">close</button></p>" + 
			"</div>" + 
		"</td>" + 
	"</tr>";

	return contentToReturn;
}


//When opening a note, determines what should happen.
function expandNote(thisLocation, md5ORid, action) {

	// Results Page
	if (action === "results") {
		var row = document.getElementById("result-" + md5ORid);

		$(thisLocation).toggleClass("toggled");

		//If "Add Note" has already been clicked.
		if ($("#result-" + md5ORid).hasClass("noteAdd")) {
			$("#options-" + md5ORid).find("div.note").slideToggle("slow");
		} else {
			addNoteRowContent(row, md5ORid);
		}

	// Notes Page
	/*} else if (action == "notes") {
		var row = thisLocation.parentNode.parentNode;
		var content = editNoteRowContent(row, md5ORid);*/
	} else if (action == "addNewEdit") {
		//var row = $("#new-note");
		var content = editNewNoteRowContent(md5ORid);
	}

	if (action != "addNewEdit") {
		setExpandedRow(md5ORid, "note");
	} else {
		$("#new-note").after(content);
	}
	
	if ( vueapp.notes[md5ORid] ) {
		$("tr#options-" + md5ORid).find("textarea").val(vueapp.notes[md5ORid].body);
		$("tr#options-" + md5ORid).find("button:contains('Add to Notes')").html("Save Changes");
	}
	
}

//Note placement on the results page(s) because of impossible/insane Catalyst ORM joins. 
function notePlacement(md5, pageType, id, title, body, importance) {

	var existingNote = $(document.createElement('div'));
	existingNote.addClass("note closed");
	existingNote.attr("style", "display:none;");

	if (importance == 1) {
		var checked = " checked=\"checked\"";
	} else {
		var checked = " ";
	}
	existingNote.html("<input type=\"checkbox\" id=\"importance_" + id + "\" onchange='updateNoteInfo(\"" + id + "\", this); return false;' name=\"importance\" class=\"importance\" value=\"1\"" +
			checked + "><input type=\"text\" name=\"note_title\" id=\"note_title_" + id + "\" value=\"" + title + "\">\n" + 
			"<textarea name=\"note\" id=\"note_" + id + "\">" + body + "</textarea>\n" + 
			"<p><button type=\"button\" class=\"button regular\" onclick='updateNoteInfo(\"" + id + "\", this)'>Save Changes</button> <button type=\"button\" class=\"button noaction closeRow\">close</button><a class=\"right button noaction\" href=\"" + dfBaseURL + "user/notes\">View all of My Notes</a></p>");

	var noteRow = $("#result-" + md5);
	noteRow.addClass("note-load noteAdd").next("tr").find("section").eq(0).append(existingNote);
	noteRow.next().find("button.note-button").html("Note for this load");

}
