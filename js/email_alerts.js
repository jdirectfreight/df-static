function toggle_alert_fields(oid, value) {

    var dt = ".disable_toggle_" + oid;
    if (value == "not-active") {
        $(dt).prop("disabled", true);
    } else {
        $(dt).prop("disabled", false);
        if ($("#expires_after_" + oid).val() == 'NEVER' || $("#expires_after_" + oid).val() == '1900-01-01') {
            var targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 7);
            var dateString = targetDate.getFullYear() + '-' +
                (targetDate.getMonth() + 1 < 10 ? '0' : '') +
                (targetDate.getMonth() + 1) + '-' +
                (targetDate.getDate() < 10 ? '0' : '') +
                targetDate.getDate();
            $("#expires_after_" + oid).val(dateString).trigger("change");
            update_column(oid, 'expires_after', dateString);
        }
        // date stuff.
        if ($("#expires_after_" + oid).val() == 'NEVER') {
            var targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 7);
            var dateString = (targetDate.getMonth() + 1) + '/' + targetDate.getDate() + '/' + targetDate.getFullYear();
            $("#expires_after_" + oid).val(dateString);
            update_column(oid, 'expires_after', dateString);
        }
    }

}

function update_column(oid, column, value) {
    
    $.ajax({
        type: "POST",
        url: dfBaseURL + "user/update_alert",
        data: {
            oid: oid,
            column: column,
            value: value
        },
        dataType: "html",
        success: function(msg) {
            return true;
        },
        error: function(msg) {
            alert("Failure to update alert, please try again later.");
        }
    });
}