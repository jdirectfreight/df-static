// Contains functions and variables common to table pages and table manipulation

function hideExpandedRow(md5ORid) {

	//Find all table row .open divs that are open and then close them.
	if (typeof(md5ORid)==='undefined') {
		$("table tbody tr.options-row div.open").slideUp("slow");
	} else {
		$("table tbody tr.options-row:not(#options-" + md5ORid + ") div.open").slideUp("slow");
	}

}

function hideRow(md5ORid) { // Hide a load results row.
	$("#result-" + md5ORid.toUpperCase() ).addClass("flagged-hidden");
}

function hideCompanyRows(companyName) { // Hide a load results row.
	// Not sure how jQuery quite works, but putting it all together on one line was causing issues. :-(
	record_name = "span.company-name:contains(" + companyName + ")";
	$(record_name).parents("tr").slideUp("slow");
}	

function setExpandedRow(md5ORid, type) {
	//Hide currently open/expanded rows.
	hideExpandedRow(md5ORid);
	//Now, add .open class to newly open/expanded row div.note.
	$("#options-" + md5ORid + " div." + type).addClass("open");
}



$(document).ready(function() {

	// Toggle show/hiding the edit form for the respective note.
	$(".toggleRow").on("click",function(event) {
		event.preventDefault();
		var IDofItemToToggle = $(this).data("toggle");
		$("#" + IDofItemToToggle + " div.note").slideToggle("slow");

	});

	// Cancel button closes the note content div.
	//$(".closeRow").on("click", function(event) {
	$("#content").on("click", ".closeRow", function(event) {
		event.preventDefault();
  		$(this).closest("div").slideToggle("slow");
	});


	//Give an element a class of "closeButton" and also an attribute data-toggle="IDofElementToCloseOpen"
	$(".closeButton").on("click",function(event) {
		event.preventDefault;

		var IDofItemToClose = $(this).data("toggle");
		$("#" + IDofItemToClose).slideToggle("slow");

	});

});
