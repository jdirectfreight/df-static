flagRow = null;

function strikeExpandedRow(loadstatus) {
    if (flagRow != null) {
        //var tagged = document.createElement('p');
        //tagged.setAttribute('class', 'flagStatus');
        //tagged.innerHTML = loadstatus;
        $("#result-" + flagRow).addClass("flagged-hidden");
        //expandedRow.getElementsByTagName('td')[0].appendChild(tagged);

        flagRow = null;
    }
}

function toggleStrikeRow(md5sum) {
    var entry_row = $("#search-results tr.tr-main-result[data-md5sum=" + md5sum.toUpperCase() + "]");
    entry_row.toggleClass("flagged-hidden");
    entry_row.find("span.hide-company").stop().fadeIn("fast").delay(5000).fadeOut("slow");
}

function toggleStrikeCompanyRows(companyName, myobject) {

    if (!companyName || !companyName.length) return false;

    let record_name = "span.company-name:contains(" + companyName.toUpperCase() + ")";
    let flag_data = 1;

    if (parseInt($(myobject).parents("td.hideLoad").data("company_hidden")) === 1) {
        // it is being disabled....
        flag_data = 0;
        $(record_name).parents("tr").removeClass("flagged-hidden");
    } else {
        $(record_name).parents("tr").addClass("flagged-hidden").removeClass("row-highlight");
    }

    $(record_name).parents("tr").each(
        function (index) {
            $(this).children("td.hideLoad").data("company_hidden", flag_data);
        });

}

function unstrikeRow() {
    $(".flagged-hidden").removeClass("flagged-hidden");
    //$(".flagStatus").html("Restored");
}

function restoreLoad(md5) {
    var loadstatus = "restoreSingle";

    if (user != '') {
        postXstatus(loadstatus, md5);
    } else {
        alert("This feature is disabled for Demo Accounts. Please login to use this feature.");
    }
}


function restoreHidden() {
    var loadUrl = dfBaseURL + "status/restore";

    $.ajax({
        type: "POST",
        url: loadUrl,
        success: unstrikeRow,
        error: function (msg) {
            alert("Restore Request Failed.");
        },
        dataType: "html"
    });
}

function submitLoadSuccess(data, textStatus, XMLHttpRequest) {
    if (data > 0) {
        strikeExpandedRow(textStatus);
    } else {
        alert("There was a problem sending the flag information to Direct Freight.");
    }
    hideExpandedRow();
}

function submitLoadInfo(me, md5) {
    flagRow = md5;
    loadstatus = $("#options-" + md5 + " input[name=loadreport]:checked").val();
    user = document.getElementById("user").value;

    if ((user != '') && (loadstatus != 'none')) {
        postXstatus(loadstatus, md5);
    } else {
        alert("This feature is disabled for Demo Accounts. Please login to use this feature.");
    }
}

function toggleHideCompany(companyName) {

    if (!companyName || !companyName.length) return false;

    user = document.getElementById("user").value;

    if (!user.length) {
        alert("This feature is disabled for Demo Accounts. Please login to use this feature.");
        return false;
    }

    $.ajax({
        type: "GET",
        url: vueapp.api_endpoint + "toggle_hide_company?company_name=" + companyName,
        success: function (msg) {
            parseInt(vueapp.exclude_companies[companyName]) === 1 ?
                delete vueapp.exclude_companies[companyName] :
                vueapp.exclude_companies[companyName] = 1;
        },
        error: function (msg) {
            alert('Error detected while hiding company, please try again later.')
        }
    });

}

function toggleHideLoad(md5sum) {

    user = document.getElementById("user").value;

    if (!user.length) {
        alert("This feature is disabled for Demo Accounts. Please login to use this feature.");
        return false;
    }

    $.ajax({
        type: "GET",
        url: vueapp.api_endpoint + "toggle_hide_load?entry_id=" + md5sum,
        success: function (msg) { },
        error: function (msg) {
            alert('Error detected while hiding load, please try again later.')
        }
    });
}

function loadProfitReport(md5sum, origin_city, origin_state, destination_city, destination_state, deadhead_distance, pay_rate) {

    if (!vueapp.user_subscribed) {
        vueapp.$set(vueapp.profit_reports, md5sum.toUpperCase(), {});
        return false;
    }

    dfAsyncRemoteCall('LoadProfitReport', {
        'origin_city': origin_city,
        'origin_state': origin_state,
        'destination_city': destination_city,
        'destination_state': destination_state,
        'deadhead_distance': deadhead_distance || 0,
        'pay_rate': pay_rate,
        'md5sum': md5sum
    });
}

function expandLoadDetails(me, loadstatus, md5, uri, pagetype) {
    var actionrow = $(me).closest('tr').next("tr");
    var isvisible = actionrow.is(':visible');
    $("tr.row-highlight").removeClass("row-highlight");
    if (isvisible) {
        actionrow.hide();
    } else {
        postXstatus(loadstatus, md5);
        dfAsyncRemoteCall('GetResultCount', {
            'md5': md5,
            'uri': uri,
            'pagetype': pagetype
        });
        $(me).closest('tr').addClass("row-highlight");
        actionrow.show();
    }
}

function toggleResults(md5, uri, pagetype) {
    var actionrow = $('#results-' + md5);
    var isvisible = actionrow.is(':visible');
    if (isvisible) {
        actionrow.hide();
        return false;
    }
    getResults(md5, uri, pagetype);
    return false;
}

function getResults(md5, uri, pagetype, page_number, save_alert) {

    vueapp.sort_parameter = '';

    if (uri.indexOf('?') > 0) {
        uri = uri.substr(uri.indexOf('?') + 1);
    }

    let searchParams = getFormSearchParams(uri);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null }); // Clear the previous ecommerce object.
    window.dataLayer.push({
        'ecommerce': {
            'add': {
                'products': [{
                    'name': 'getresults',
                    'price': '1.0',
                    'quantity': 1
                },]
            }
        } //add to cart
    });

    if (searchParams) {

        let alertParams = save_alert ? getFormAlertParams(uri) : false;

        if ( page_number == "NaN" ) { // JJC: Hack to block possible bad data. #RT55460.
                page_number = 0
        }
        dfAsyncRemoteCall('GetResults', {
            'md5': md5,
            'pagetype': pagetype,
            searchParams: searchParams,
            alertParams: alertParams,
            page_number: page_number,
        });

        $('#results-' + md5).show();

    } else {
        $('#results-' + md5).hide();
    }

    return false;
}

function next_page_results(alert_id, uri, pagetype) {

    if (uri.indexOf('?') > 0) {
        uri = uri.substr(uri.indexOf('?') + 1);
    }

    let searchParams = getFormSearchParams(uri);

    if (searchParams) {
        dfAsyncRemoteCall('NextPageResults', {
            'md5': "maintable",
            'pagetype': pagetype,
            searchParams: searchParams
        });
    }

    return false;
}

var TOTAL_COMPANY_LOADS_CACHE = {};

function UpdateCompanyTotalLoads(pagetype, companyName) {
    if (!companyName || !companyName.length) return 0;
    let form = $("#form-search").serialize();
    let searchParams = getFormSearchParams(form);

    searchParams.company_name = companyName;
    searchParams.return_count = true;
    searchParams.pagetype = pagetype;

    TOTAL_COMPANY_LOADS_CACHE[companyName] ?
        updateSpanTotalCompanyLoads(companyName, (TOTAL_COMPANY_LOADS_CACHE[companyName] || 0)) :
        dfAsyncRemoteCall('GetCompanyTotalLoads', {
            "searchParams": searchParams
        });
    return true;
}

function getFormSearchParams(uri) {

    let params = new URLSearchParams(uri);

    let location1 = params.get('location1');
    var has_multiple_origin_states = false;

    if (!location1) {
        if (params.get('city1') && params.get('city1') !== null) {
            location1 = params.get('city1') + ',';
        }
        if ((params.get('state1') && params.get('state1') !== null)) {

            if (params.getAll('state1').length > 1) {
                location1 = params.getAll('state1').join(',');
                has_multiple_origin_states = true;
            } else {
                var state1 = params.get('state1').replace(/,/g, '|');
                location1 = state1;
            }

        }
        if (location1) {
            params.append("location1", location1);
        }
    }

    var location2 = params.get('location2');
    var has_multiple_destination_states = false;

    if (!location2 || !location2.length) {
        if (params.get('city2') && params.get('city2') !== null) {
            location2 = params.get('city2') + ',';
        }
        if ((params.get('state2') && params.get('state2') !== null)) {

            if (params.getAll('state2').length > 1) {
                has_multiple_destination_states = true;
                location2 = params.getAll('state2').join(',');
            } else {
                if (params.get('state2').includes(',')) {
                    has_multiple_destination_states = true;
                }
                location2 = params.get('state2');
            }
        }
        if (location2) {
            params.append("location2", location2);
        }
    } else {
        if (params.getAll('location2').length > 1) {
            location2 = params.getAll('location2');
            has_multiple_destination_states = true;
        }
    }

    var formParams = {};

    if (params.getAll('location1').length > 1) {
        formParams.origin_state = params.getAll('location1');
    } else if (params.get('location1') && params.get('location1').length) {

        if (has_multiple_origin_states) {
            formParams.origin_state = location1.split(',');
        } else {

            let loc = params.get('location1').split(',');

            if (loc.length == 2) {
                formParams.origin_city = loc[0];
                formParams.origin_state = [loc[1].replace(/\s/g, '')];
            } else {
                params.get('location1').includes('|') ?
                    formParams.origin_state = params.get('location1').split('|') :
                    formParams.origin_state = [params.get('location1')];
            }

        }

    }

    if (params.get("radius1") && params.get("radius1").length) params.append("radius", params.get("radius1"));

    if (params.get('radius')) {
        formParams.origin_radius = params.get('radius');
    }

    if (params.get('radius2')) {
        formParams.destination_radius = params.get('radius2');
    }

    if (params.get('location2')) {

        if (has_multiple_destination_states) {

            if (params.getAll('location2').length > 1) {
                formParams.destination_state = params.getAll('location2');
            } else {
                formParams.destination_state = params.get('location2').split(',');
            }

        } else {

            let loc = params.get('location2').split(',');

            if (loc.length == 2) {
                formParams.destination_city = loc[0];
                formParams.destination_state = [loc[1]];
            } else {
                formParams.destination_state = [params.get('location2')];
            }

        }

    }

    if (params.get('load_type') === 'FULL' || params.get('load_type') === 'PARTIAL') {
        formParams.full_load = params.get('load_type') === 'FULL' ? true : false;
    }

    if (params.get('trailertype')) {
        formParams.trailer_type = params.getAll('trailertype');
    }

    if (params.get('date_avail')) {
        formParams.ship_date = params.getAll('date_avail');
    }

    if (params.get('min_weight')) {
        formParams.min_weight = params.get('min_weight');
    }

    if (params.get('max_weight')) {
        formParams.max_weight = params.get('max_weight');
    }

    if (params.get('min_width')) {
        formParams.min_width = params.get('min_width');
    }

    if (params.get('max_width')) {
        formParams.max_width = params.get('max_width');
    }

    if (params.get('min_length')) {
        formParams.min_length = params.get('min_length');
    }

    if (params.get('max_length')) {
        formParams.max_length = params.get('max_length');
    }

    if (params.get("tier")) {
        formParams.tier = params.get("tier")
    }

    if (vueapp.return_tier === 'premium' || vueapp.return_tier === 'free') {
        formParams.tier = vueapp.return_tier;
    }
    if (vueapp.search_tier === 'premium' || vueapp.search_tier === 'free') {
        formParams.tier = vueapp.search_tier;
    }

    if (params.get('ss_oid')) {

        formParams.alert_id = parseInt(params.getAll('ss_oid'));
        if (params.get('exclude_xstatus') && params.get('exclude_xstatus').toUpperCase() === "HIDDEN") {
            formParams.return_only_new = true;
        }
        if (params.get('return_only_new')) {
            formParams.return_only_new = true;
        }

    }

    if (vueapp.cb_toggle_unviewed_checked) formParams.return_only_new = true;

    if (params.get('city1')) {
        formParams.origin_city = params.get('city1');
    }

    if (params.get('city2') && params.get('state2') && params.get('state2').length) {
        formParams.destination_city = params.get('city2');
        formParams.destination_state = params.get('state2');
        if (formParams.destination_state && formParams.destination_state.length) {
            formParams.destination_state = [formParams.destination_state.replace(/\s+/g, '')];
        }
    }

    formParams.sort_parameter = params.get('list_order') ? params.get('list_order').toLowerCase() : 'age';

    if (params.get('company_name')) {
        formParams.company_name = params.get('company_name');
    }

    if (params.get('user_id')) {
        formParams.user_id = params.get('user_id');
    }

    if (!formParams.origin_state &&
        !formParams.origin_city &&
        !formParams.destination_state &&
        !formParams.destination_city &&
        !formParams.user_id
    ) return false;

    if (vueapp.alert_id && !params.get('ss_oid')) {
        uri += '&ss_oid=' + vueapp.alert_id;
    }

    //window.history.replaceState(window.location.pathname, $('title').text(), window.location.pathname + '?' + uri);
    return formParams;

}

function getFormAlertParams(uri) {

    let params = new URLSearchParams(uri);

    let api_post_data = {
        "days_of_week": params.getAll("days_of_week"),
        "start_hour": parseInt(params.get("start")),
        "end_hour": parseInt(params.get("end")),
        "expires_after": params.get("expiration"),
        "list_order": "age",
        "list_type": params.get("alert_type") || "",
        "minute_frequency": parseInt(params.get("frequency")),
        "send_type": params.get("send_type"),
        "time_zone": parseInt(params.get("timezone")),
    };

    if (api_post_data.list_type.toLowerCase() === "only-new" &&
        params.get("only_new_free") &&
        params.get("only_new_free").toLowerCase() === "on"
    ) {
        api_post_data.list_type = 'only-new-free';
    }

    return api_post_data;

}

function postXstatus(loadstatus, md5sum) {
    dfAsyncRemoteCall(loadstatus, {
        'md5sum': md5sum
    }, {
        'success': submitLoadSuccess,
        'error': function (msg) {
            alert('Failure to post load status, try again later.');
        },
        argument: {
            loadstatus: loadstatus
        }
    });
}


// Creates a new entry to flag a load for a particular result item.
function addReportRowContent(row, md5, user) {

    var thisRow = $("#result-" + md5);

    var newReport = $(document.createElement('div'));
    newReport.addClass("flag");
    if (document.location.href.match("loads")) {
        page_type = 'load';
    } else if (document.location.href.match("trucks")) {
        page_type = 'truck';
    } else {
        page_type = 'load';
    }

    newReport.html(
        "<p><strong>Please flag this " + page_type + " as: </strong></p>" +
        "<ul>" +
        "<li><input checked type=radio name='loadreport' value='UserHide'><strong>Hidden</strong>" + "&nbsp;&nbsp;&nbsp;(This " + page_type + " will not work for me, please hide it just for me)</li>" +
        "<li><input type=radio name='loadreport' value='Moved'><strong>Moved</strong>" + "&nbsp;&nbsp;&nbsp;(" + page_type.charAt(0).toUpperCase() + page_type.slice(1) + " is no longer available)</li>" +
        "<li><input type=radio name='loadreport' value='Wrong'><strong>Wrong</strong>" + "&nbsp;&nbsp;&nbsp;(" + page_type.charAt(0).toUpperCase() + page_type.slice(1) + " and/or contact information is wrong)</li>" +
        "</ul>" +
        "<p class=\"buttons\"><input type='hidden' id='user' name='user' value='" + user + "'><button type=\"button\" class=\"button regular\" onclick='submitLoadInfo(this, \"" + md5 + "\")'>Save</button>" +
        "<button type=\"button\" class=\"button noaction\" onclick=\"hideExpandedRow(); return false;\"'>cancel</button></p>" +
        "<p><em>* by flagging " + page_type + ", you help save time for yourself and others.</em>" +
        "<a onclick=\"return openwindow(this,event);\" href=\"" + dfBaseURL + "flags\">(explain this)</a></p>");

    thisRow.next("tr").find("div.result-actions").append(newReport);

    thisRow.addClass("reportAdd");
}


function expandReport(thisLocation, md5ORid, user) {
    var row = document.getElementById("result-" + md5ORid);
    if ($("#result-" + md5ORid).hasClass("reportAdd")) {
        $("#options-" + md5ORid).find("div.flag").slideToggle("slow");
    } else {
        addReportRowContent(row, md5ORid, user);
    }
    setExpandedRow(md5ORid, "flag");
}

function DebugLog(msg) {
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
}

function updateSpanTotalCompanyLoads(company_name, count) {
    $("#search-results")
        .find(`span.span-total-company-loads[data-company_name="${company_name}"]`)
        .html(count || 0);
    TOTAL_COMPANY_LOADS_CACHE[company_name] = (count || 0);
}

function get_h1_main_title(params) {

    let title = "Available ";
    let has_single_trailer_type = false;

    if (params.trailer_type && params.trailer_type.length === 1) {

        const trailer_type_url_conversion_table = {
            "V": "Van",
            "F": "Flatbed",
            "R": "Reefer",
            "BT": "Box Truck",
        };

        if (trailer_type_url_conversion_table[params.trailer_type[0]]) {
            title += trailer_type_url_conversion_table[params.trailer_type[0]];
            has_single_trailer_type = true;
        }

    }

    if (vueapp.page_type.toUpperCase() === "LOADS") {
        title += " " + vueapp.page_type;
    } else {
        if (has_single_trailer_type) {
            title += "s ";
        } else {
            title += " trucks ";
        }
    }

    if (params.origin_city) {
        title += " in " + params.origin_city + ", " + unabbreviate_state(params.origin_state[0]);
    } else if (params.origin_state && params.origin_state.length === 1) {
        title += " in " + unabbreviate_state(params.origin_state[0]);
    }

    title = title.replace(/\s\s+/g, ' ');

    return title;
}

function unabbreviate_state(statecode) {

    const translations = {
        'AL': 'Alabama',
        'AK': 'Alaska',
        'AB': 'Alberta',
        'AZ': 'Arizona',
        'AR': 'Arkansas',
        'BC': 'British Columbia',
        'CA': 'California',
        'CO': 'Colorado',
        'CT': 'Connecticut',
        'DE': 'Delaware',
        'DC': 'District of Columbia',
        'FL': 'Florida',
        'GA': 'Georgia',
        'HI': 'Hawaii',
        'ID': 'Idaho',
        'IL': 'Illinois',
        'IN': 'Indiana',
        'IA': 'Iowa',
        'KS': 'Kansas',
        'KY': 'Kentucky',
        'LA': 'Louisiana',
        'ME': 'Maine',
        'MB': 'Manitoba',
        'MD': 'Maryland',
        'MA': 'Massachusetts',
        'MX': 'Mexico',
        'MI': 'Michigan',
        'MN': 'Minnesota  ',
        'MS': 'Mississippi',
        'MO': 'Missouri',
        'MT': 'Montana',
        'NE': 'Nebraska',
        'NV': 'Nevada',
        'NB': 'New Brunswick',
        'NH': 'New Hampshire',
        'NJ': 'New Jersey',
        'NM': 'New Mexico',
        'NY': 'New York',
        'NL': 'Newfoundland',
        'NF': 'Newfoundland',
        'NU': 'Nunavut',
        'NC': 'North Carolina',
        'ND': 'North Dakota',
        'NT': 'Northwest Territories',
        'NS': 'Nova Scotia',
        'OH': 'Ohio',
        'OK': 'Oklahoma',
        'ON': 'Ontario',
        'OR': 'Oregon',
        'PA': 'Pennsylvania',
        'PE': 'Prince Edward Island',
        'PR': 'Puerto Rico',
        'PW': 'Palau',
        'QC': 'Quebec',
        'RI': 'Rhode Island',
        'SK': 'Saskatchewan',
        'SC': 'South Carolina',
        'SD': 'South Dakota',
        'TN': 'Tennessee',
        'TX': 'Texas',
        'UT': 'Utah',
        'VT': 'Vermont',
        'VA': 'Virginia',
        'WA': 'Washington',
        'WV': 'West Virginia',
        'WI': 'Wisconsin',
        'WY': 'Wyoming',
        'YT': 'Yukon Territory'
    };

    return translations[statecode.toUpperCase()];

}

function dfAsyncRemoteCall(action, parameters, callback) {

    var parmstr = '';
    for (key in parameters) {
        parmstr += key + '=' + parameters[key] + '&';
    }
    parmstr = parmstr.slice(0, -1);

    switch (action) {

        case "Hidden":
        case "Moved":
        case "Wrong":
        case "UserHide":
        case "UserClick":
            $.ajax({
                type: "POST",
                url: dfBaseURL + "status/" + action,
                data: parmstr,
                dataType: "html",
                success: submitLoadSuccess,
                error: function (msg) {
                    DebugLog("There was an issue marking this result as [" + action + "]:" + msg);
                    hideExpandedRow();
                }
            });
            break;
        case "restoreSingle":
            $.ajax({
                type: "POST",
                url: dfBaseURL + "status/" + action,
                data: parmstr,
                dataType: "html",
                error: function (msg) {
                    DebugLog("There was an issue marking this result as [" + action + "]:" + msg);
                    hideExpandedRow();
                }
            });
            break;
        case "GetResultCount":

            var uri = parameters['uri'];
            if (uri.indexOf('?') > 0) {
                uri = uri.substr(uri.indexOf('?') + 1);
            }
            uri = decodeURIComponent(uri);

            if (parameters.return_only_new) uri += '&return_only_new=1';
            if (parameters.return_only_newtag) uri += '&return_only_newtag=1';

            $.ajax({
                type: "POST",
                url: dfBaseURL + parameters['pagetype'] + "/results_count",
                data: uri,
                dataType: "JSON",
                success: function (data, textStatus, XMLHttpRequest) {

                    let TOTAL_SEARCH_MATCHES_ALL = 0;
                    let TOTAL_SEARCH_MATCHES_FREE = 0;
                    let TOTAL_SEARCH_MATCHES_PREMIUM = 0;
                    let TOTAL_ITEMS_ALL = 0;
                    let TOTAL_ITEMS_FREE = 0;
                    let TOTAL_ITEMS_PREMIUM = 0;

                    if (data.all.total_items && !isNaN(data.all.total_items))
                        TOTAL_ITEMS_ALL = parseInt(data.all.total_items);

                    if (data.free.total_items && !isNaN(data.free.total_items))
                        TOTAL_ITEMS_FREE = parseInt(data.free.total_items);

                    if (data.premium.total_items && !isNaN(data.premium.total_items))
                        TOTAL_ITEMS_PREMIUM = parseInt(data.premium.total_items);

                    if (data.all.total_unviewed_plus_viewed && !isNaN(data.all.total_unviewed_plus_viewed))
                        TOTAL_SEARCH_MATCHES_ALL = parseInt(data.all.total_unviewed_plus_viewed);

                    if (data.free.total_unviewed_plus_viewed && !isNaN(data.free.total_unviewed_plus_viewed))
                        TOTAL_SEARCH_MATCHES_FREE = parseInt(data.free.total_unviewed_plus_viewed);

                    if (data.premium.total_unviewed_plus_viewed && !isNaN(data.premium.total_unviewed_plus_viewed))
                        TOTAL_SEARCH_MATCHES_PREMIUM = parseInt(data.premium.total_unviewed_plus_viewed);

                    $('#resulttotal-changes-all' + parameters['md5']).html("<b>" + TOTAL_ITEMS_ALL + "</b>");
                    $('#resulttotal-changes-free' + parameters['md5']).html("<b>" + TOTAL_ITEMS_FREE + "</b>");
                    $('#resulttotal-changes-premium' + parameters['md5']).html("<b>" + TOTAL_ITEMS_PREMIUM + "</b>");
                    $('#resulttotal-total-all' + parameters['md5']).html("<b>" + TOTAL_SEARCH_MATCHES_ALL + "</b>");
                    $('#resulttotal-total-free' + parameters['md5']).html("<b>" + TOTAL_SEARCH_MATCHES_FREE + "</b>");
                    $('#resulttotal-total-premium' + parameters['md5']).html("<b>" + TOTAL_SEARCH_MATCHES_PREMIUM + "</b>");

                },
                error: function (msg) {
                    DebugLog("Failure-- msg:" + msg.toSource());
                }
            });
            break;
        case "NewLoadsAlert":
            var uri = parameters['uri'];
            if (uri.indexOf('?') > 0) {
                uri = uri.substr(uri.indexOf('?') + 1);
            }
            uri = decodeURIComponent(uri);
            uri += '&return_only_newtag=1&return_count=1';
            uri += '&page_type=' + parameters['pagetype'];

            $.ajax({
                type: "POST",
                url: dfBaseURL + parameters['pagetype'] + "/results_count",
                data: uri,
                dataType: "JSON",
                success: function (data, textStatus, XMLHttpRequest) {

                    let TOTAL_FREE_NEW_LOADS = data.free.total_items;
                    let TOTAL_PREMIUM_NEW_LOADS = data.premium.total_items;
                    let TOTAL_BROWSER_TAB = 0;
                    let ALERT_TEXT = "";

                    if (vueapp.user_subscribed) {
                        if (TOTAL_PREMIUM_NEW_LOADS && TOTAL_PREMIUM_NEW_LOADS > 0) {
                            $("#tab-new-loads-free").text("+" + TOTAL_PREMIUM_NEW_LOADS).show();
                            ALERT_TEXT += TOTAL_PREMIUM_NEW_LOADS;
                            ALERT_TEXT += " New Loads<br>";
                            TOTAL_BROWSER_TAB = TOTAL_PREMIUM_NEW_LOADS;
                        }
                    } else {
                        if (TOTAL_FREE_NEW_LOADS && TOTAL_FREE_NEW_LOADS > 0) {
                            $("#tab-new-loads-free").text("+" + TOTAL_FREE_NEW_LOADS).show();
                            ALERT_TEXT += TOTAL_FREE_NEW_LOADS + " New Free Loads<br>";
                            TOTAL_BROWSER_TAB += TOTAL_FREE_NEW_LOADS;
                        }
                        if (TOTAL_PREMIUM_NEW_LOADS && TOTAL_PREMIUM_NEW_LOADS > 0) {
                            $("#tab-new-loads-premium").text("+" + TOTAL_PREMIUM_NEW_LOADS).show();
                            ALERT_TEXT += TOTAL_PREMIUM_NEW_LOADS;
                            ALERT_TEXT += " New Premium Loads<br>";
                            TOTAL_BROWSER_TAB += TOTAL_PREMIUM_NEW_LOADS;
                        }
                    }

                    if (!ALERT_TEXT.length) $("#tab-new-loads-free").text('').hide();

                    // toaster new load alert
                    if (TOTAL_BROWSER_TAB && TOTAL_BROWSER_TAB > 0) {
                        window.document.title = TOTAL_BROWSER_TAB + " NEW " + vueapp.page_type.toUpperCase() + " FOUND!";
                        if (vueapp.determine_if_audio()) {
                            $("#notification-audio").trigger('play');
                        }
                        setTimeout(function () {
                            window.document.title = "(" + TOTAL_BROWSER_TAB + ") " + vueapp.document_title;
                        }, 3000);
                        if (ALERT_TEXT.length) {
                            $("span#new-loads-alert-text").html(ALERT_TEXT);
                            $("div#new-loads-alert").show().delay(10000).fadeOut("slow");
                        } else {
                            $("#tab-new-loads-free").text('').hide();
                        }
                    }


                },
                error: function (msg) {
                    DebugLog("Failure-- msg:" + msg.toSource());
                }
            });
            break;
        case "ToggleContactSoundAlerts":
            $.ajax({
                type: "GET",
                url: dfBaseURL + "user/ajax/toggle_sounds/?enabled=" + (parameters.enabled ? 1 : 0),
                dataType: "JSON",
                success: function (data, textStatus, XMLHttpRequest) {
                    return true;
                }
            });
            break;
        case "NextPageResults":
            vueapp.processing_next_page = true;
            $("#div-error-message").hide();

            if (__DF_GOOGLE_RECAPTCHA_IS_ACTIVE) {
                grecaptcha.ready(function () {
                    grecaptcha.execute("6LcuTEsaAAAAAG0R486Jz2_o05TNIiuW8lbz9GtY", {
                        action: "GetResults"
                    }).then(function (token) {
                        get_next_page_with_token(parameters, token);
                    }
                    );
                });
            }
            else {
                get_next_page_with_token(parameters, 'RECAPTCHA');
            }            

            break;
        case "GetResults":

            $("#search-results-begin-search").hide();
            $("#search-results-loading").show();
            $("#div-error-message").hide();

            vueapp.results = [];
            vueapp.notes = {};
            vueapp.processing_results = true;
            vueapp.total_unviewed_plus_viewed = 0;
            vueapp.total_all_destination_items = 0;
            vueapp.destination_string = null;
            vueapp.new_label = 'Total';
            vueapp.total_items = 0;
            vueapp.total_pages = 0;
            vueapp.total_free_loads = 0;
            vueapp.total_premium_loads = 0;
            vueapp.alert_id = 0;
            vueapp.sound_counter = 0;
            vueapp.search_tier = null;
            window.document.title = vueapp.document_title;

            parameters.searchParams.item_count = 100;

            let h1_main_title = get_h1_main_title(parameters.searchParams);
            $("#h1-main-title").text(h1_main_title);
            $("title").text(h1_main_title);

            if ( parameters.page_number == "NaN" ) { // JJC: Hack to block possible bad data. #RT55460.
                parameters.page_number = 0
            }
            if (parameters.page_number) parameters.searchParams.page_number = parameters.page_number;

            if (__DF_GOOGLE_RECAPTCHA_IS_ACTIVE) {
                grecaptcha.ready(function () {
                    grecaptcha.execute("6LcuTEsaAAAAAG0R486Jz2_o05TNIiuW8lbz9GtY", {
                        action: "GetResults"
                    }).then(function (token) {
                        get_results_with_token(parameters, token);
                    }
                    );
                });
            }
            else {
                get_results_with_token(parameters, 'RECAPTCHA');
            }

            break;
        case "RenameDoc":
            $.ajax({
                type: "POST",
                url: dfBaseURL + "user/rename_document",
                data: parmstr,
                dataType: "html",
                success: submitDocSuccess,
                error: function (msg) {
                    alert("Failure to rename document, try again later.");
                    hideExpandedRow();
                }
            });
            break;

        case "DeleteDoc":
            $.ajax({
                type: "POST",
                url: dfBaseURL + "user/delete_document",
                data: parmstr,
                dataType: "html",
                success: submitDocSuccess,
                error: function (msg) {
                    alert("Failure to delete files(s), try again later.");
                    hideExpandedRow();
                }
            });
            break;

        case "AddNote":
            $.ajax({
                type: "POST",
                url: vueapp.api_endpoint + 'add_note',
                data: parmstr,
                success: submitNoteSuccess,
                error: function (msg) {
                    alert("Failure to post note, try again later." + msg);
                    hideExpandedRow();
                }
            });
            break;
        case "AddNoteGeneric":
            $.ajax({
                type: "POST",
                url: dfBaseURL + "note",
                data: parmstr,
                dataType: "html",
                success: submitNoteSuccess,
                error: function (msg) {
                    alert("Failure to post note, try again later." + msg);
                    hideExpandedRow();
                }
            });
            break;

        case "EditNote":
            $.ajax({
                type: "POST",
                url: dfBaseURL + "user/edit_note",
                data: parmstr,
                dataType: "html",
                success: submitNoteSuccess,
                error: function (msg) {
                    alert("Failure to update note, try again later.");
                    hideExpandedRow();
                }
            });
            break;

        case "DeleteNote":
            $.ajax({
                type: "POST",
                url: dfBaseURL + "user/delete_note",
                data: parmstr,
                dataType: "html",
                success: submitNoteSuccess,
                error: function (msg) {
                    alert("Failure to delete note(s), try again later.");
                    hideExpandedRow();
                }
            });
            break;

        case "GetCompanyTotalLoads":

            var serializedParams = jQuery.param(parameters.searchParams, true);

            $.ajax({
                type: "GET",
                url: vueapp.api_endpoint + vueapp.page_type,
                data: serializedParams,
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json'
                },
                dataType: "json",
                success: function (data) {
                    let count = 0;
                    if (data.tier === "free") {
                        count = data.total_free_loads;
                    } else {
                        count = data.total_items;
                    }
                    updateSpanTotalCompanyLoads(
                        parameters.searchParams.company_name,
                        (count || 0))
                },
                error: function (data) {
                    alert("unable to get total company loads.");
                }
            });
            break;

        case "LoadProfitReport":

            if (!vueapp.user_subscribed) {
                vueapp.$set(vueapp.profit_reports, parameters.md5sum.toUpperCase(), {});
                return false;
            }

            vueapp.$set(vueapp.profit_reports, parameters.md5sum.toUpperCase(), null);
            var serializedParams = jQuery.param({
                'origin_city': parameters.origin_city,
                'origin_state': parameters.origin_state,
                'destination_city': parameters.destination_city,
                'destination_state': parameters.destination_state,
                'deadhead_distance': parameters.deadhead_distance,
                'pay_rate': parameters.pay_rate,
            }, true);

            $.ajax({
                type: "GET",
                url: vueapp.api_endpoint + 'profit_report',
                data: serializedParams,
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json'
                },
                dataType: "json",
                success: function (data) {

                    vueapp.$set(vueapp.profit_reports, parameters.md5sum.toUpperCase(), data);

                    let labels = data.freight_rate["FLAT"].dates.map(a => a.date);

                    let datasets = [{
                        label: "Flat: " + vueapp.currency_format(data.freight_rate["FLAT"].rate),
                        fill: false,
                        data: data.freight_rate["FLAT"].dates.map(a => a.rate),
                        borderColor: "#466ba1",
                        backgroundColor: "#466ba1",
                        borderWidth: 2
                    },
                    {
                        label: "Reefer: " + vueapp.currency_format(data.freight_rate["REEFER"].rate),
                        fill: false,
                        data: data.freight_rate["REEFER"].dates.map(a => a.rate),
                        borderColor: "#f7ab27",
                        backgroundColor: "#f7ab27",
                        borderWidth: 2
                    },
                    {
                        label: "Van: " + vueapp.currency_format(data.freight_rate["VAN"].rate),
                        fill: false,
                        data: data.freight_rate["VAN"].dates.map(a => a.rate),
                        borderColor: "red",
                        backgroundColor: "red",
                        borderWidth: 2
                    }
                    ];

                    vueapp.$set(vueapp.complete_graph_data, parameters.md5sum.toUpperCase(), {
                        labels: labels,
                        datasets: datasets
                    });

                    vueapp.$set(vueapp.render_graph_datasets, parameters.md5sum.toUpperCase(), datasets);
                    vueapp.$set(vueapp.graph_lines_checked, parameters.md5sum.toUpperCase(), [true, true, true]);
                    vueapp.$set(vueapp.render_graphs, parameters.md5sum.toUpperCase(), true);

                },
                error: function (data) {
                    alert("API Error.");
                }
            });
            break;

        default:
            $.ajax({
                type: "POST",
                url: dfBaseURL + "status/whoops",
                data: parmstr,
                dataType: "html",
                success: function (data) {
                    alert("A problem has occurred. Try again later.");
                },
                error: function (msg) {
                    alert("An issue occurred trying to access Direct Freight.");
                }
            });

    }

}

function get_results_with_token(parameters, token) {

    if (parameters.searchParams.sort_parameter.length) {
        if (parameters.searchParams.sort_parameter === vueapp.sort_parameter) {
            if (vueapp.sort_reverse) {
                vueapp.sort_reverse = false;
            } else {
                parameters.searchParams.sort_direction = "reverse";
                vueapp.sort_reverse = true;
            }
        } else {
            vueapp.sort_reverse = false;
        }
        vueapp.sort_parameter = parameters.searchParams.sort_parameter;
    }

    parameters.searchParams.google_recaptcha_response = token;
    let allParams = jQuery.extend(parameters.searchParams, parameters.alertParams);
    var serializedParams = jQuery.param(allParams, true);

    $.ajax({
        url: vueapp.api_endpoint + vueapp.page_type,
        type: 'GET',
        data: serializedParams,
        headers: {
            accept: 'application/json',
            'content-type': 'application/json'
        },
        dataType: 'json',
        success: function (data) {

            if (data.error && data.error.length) {
                //vueapp.results = [];
                $("#div-error-message span.alert-error-message").html(data.error);
                $("#div-error-message").show()
                $(window).scrollTop($('#div-error-message').offset().top - 100);
            }

            if (data.list && data.list.length) {

                vueapp.results = data.list;
                vueapp.total_items = data.total_items ? data.total_items : 0;
                vueapp.total_pages = data.total_pages;
                vueapp.page_number = data.page_number;

                if (parameters.searchParams.return_only_new)
                    vueapp.new_label = 'NEW';

                if (data.notes)
                    vueapp.notes = data.notes;

                if (parameters.searchParams.destination_state) {
                    if (parameters.searchParams.destination_city) {
                        vueapp.destination_string = ' with destination ' +
                            parameters.searchParams.destination_city +
                            ', ' +
                            parameters.searchParams.destination_state[0];
                    } else {
                        vueapp.destination_string = ' with destination ' +
                            parameters.searchParams.destination_state.join(',');
                    }
                }

            }

            if (data.alert_id && data.alert_id !== 0)
                vueapp.alert_id = data.alert_id;

            if (data.total_all_destination_items)
                vueapp.total_all_destination_items = data.total_all_destination_items;

            if (data.total_unviewed_plus_viewed)
                vueapp.total_unviewed_plus_viewed = data.total_unviewed_plus_viewed;

            if (data.tier === "free" || data.tier === "premium") {
                vueapp.return_tier = data.tier;
                vueapp.total_free_loads = data.total_free_loads;
                vueapp.total_premium_loads = data.total_premium_loads;
            }

        },
        error: function (data) {
            alert("GetResults error: " + data.responseText);
        },
        complete: function () {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ ecommerce: null }); // Clear the previous ecommerce object.
            window.dataLayer.push({
                'ecommerce': {
                    'checkout': {
                        'actionField': {
                            'step': 1
                        },
                    }
                }
            });
            $("#search-results-loading").hide();
            TOTAL_COMPANY_LOADS_CACHE = {};
            // vueapp.toggle_next_page();
            vueapp.processing_results = false;
        }
    });

}

function get_next_page_with_token(parameters, token) {

    if (parameters.searchParams.sort_parameter.length && parameters.searchParams.sort_parameter === vueapp.sort_parameter && vueapp.sort_reverse) {
        parameters.searchParams.sort_direction = "reverse";
    }

    parameters.searchParams.google_recaptcha_response = token;
    parameters.searchParams.page_number = (vueapp.page_number + 1);

    var serializedParams = jQuery.param(parameters.searchParams, true);

    $.ajax({
        url: vueapp.api_endpoint + vueapp.page_type,
        type: 'GET',
        data: serializedParams,
        headers: {
            accept: 'application/json',
            'content-type': 'application/json'
        },
        dataType: 'json',
        success: function (data) {

            if (data.error && data.error.length) {
                //vueapp.results = [];
                $("#div-error-message span.alert-error-message").html(data.error);
                $("#div-error-message").show();
                $(window).scrollTop($('#div-error-message').offset().top - 100);
            }

            vueapp.total_items = data.total_items ? data.total_items : 0;
            vueapp.total_pages = data.total_pages;
            vueapp.page_number = data.page_number;
            if (data.notes) vueapp.notes = data.notes;

            if (data.total_all_destination_items)
                vueapp.total_all_destination_items = data.total_all_destination_items;

            if (data.total_unviewed_plus_viewed)
                vueapp.total_unviewed_plus_viewed = data.total_unviewed_plus_viewed;

            if (data.tier === "free" || data.tier === "premium") {
                vueapp.return_tier = data.tier;
                vueapp.total_free_loads = data.total_free_loads;
                vueapp.total_premium_loads = data.total_premium_loads;
            }

            if (data.list && data.list.length) {
                var merged_results = vueapp.results.concat(data.list);
                vueapp.results = merged_results;
            }

        },
        error: function (data) {
            vueapp.processing_next_page = false;
            $("#div-trigger-next-page").hide();
            alert("GetResults error: " + data.responseText);
        },
        complete: function () {
            TOTAL_COMPANY_LOADS_CACHE = {};
            vueapp.processing_next_page = false;
            $("#div-trigger-next-page").hide();
        }
    });

}
