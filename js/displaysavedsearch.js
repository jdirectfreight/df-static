function displayend() {
    let end = $('#emailTimeEnd');
    if ($('#frequency').val() == '1440') {
        $('#hideme').attr('class', 'item hidden');
        let emailBetweenValue = parseInt($('#emailTimeStart').val(), 10) + 1; //set end to be one hour past the start
        $('#emailTimeEnd').val(emailBetweenValue).attr('selected', 'selected');
    } else {
        $('#hideme').attr('class', 'item');
    }
}

function displaystart() {
    switch ($('#frequency').val()) {
        case "1440":
            $('#alertStart').text("at");
            break;
        default:
            $('#alertStart').text("from");
            break;
    }
    displayend();
}

function displayoptin(me, containerID, ignore_alerts, isDFOptedIn) {
    let sectioncontainer = '#' + containerID;
    $(sectioncontainer).find('.alert-message-error').hide();
    $(sectioncontainer).find('.item-edit-phone').hide();
    $(sectioncontainer).find('.item-edit-email').hide();
    $(sectioncontainer).find(".div-alert-settings-optin-desktop-error").hide();
    if (me === 'text') {
        if (ignore_alerts !== true) $("#div-alert-settings-optin-error").show();
        $(sectioncontainer).find('.item-edit-phone').show();
    } else if (me === 'desktop') {
        OneSignalGetSubscriptionState().then(function(result) {
            let isOneSignalOptedIn = result[0];
            let isDFOptedIn = result[1];
            
            // user is opted in, but using another browser
            if (!isOneSignalOptedIn && isDFOptedIn) {
                $(sectioncontainer).find("span.span-optin-desktop-error-text").text("You have not opted in for desktop alerts on your current browser.  We will allow you to finish setting up this alert, but you will only receive alerts on browsers or devices where you have opted in. Click Below to opt in on this device.");
                $(sectioncontainer).find(".div-alert-settings-optin-desktop-error").show();
                return;
            }            

            if (isOneSignalOptedIn) {
                $(sectioncontainer).find(".div-alert-settings-optin-desktop-error").hide();
                return;
            }

            if (!isOneSignalOptedIn) {
                $(sectioncontainer).find("span.span-optin-desktop-error-text").text("You are not opted in to receive desktop web notifications. You will not receive any desktop notifications until you accept these web notifications.");
                $(sectioncontainer).find(".div-alert-settings-optin-desktop-error").show();
                return;
            }

        });
    } else {
        $(sectioncontainer).find('.item-edit-email').show();
    }
}
