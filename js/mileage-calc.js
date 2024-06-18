const routingBaseURL = 'https://router.hereapi.com/v8/routes?apiKey=d_wA_3ri7d0gHDtB4yvQ0EpvxKEotZ6Td9GJ5MoLGI0&' + hereBillingTags;
var waypointArr = [];

var mapContainer = document.getElementById('map');
var platform;
var defaultLayers;
var map;
var behavior;
var ui;
var bubble;
var route = "";

function calculate_route(origin, destination, metricSystem, avoidTollRoads, pageType) {

    if (pageType === "route") {
        $('#toggle-calc').removeClass('show');
        $('#toggle-calc').html('Open Filter');
    }
    else {
        $('#mileage-calc-results').show();
        $('#toggle-calc').removeClass('show').html('Open Filter');
        if (route == origin + "|" + destination) return;
        route = origin + "|" + destination;
    }

    waypointArr = [];

    var destinations = $('.destination').length;
    var minimumHeightVal = $('#minimumHeight option:selected').val() || ___DF_HEIGHT;
    var minimumHeight = '';

    if (minimumHeightVal.length > 0) {
        minimumHeight = ((minimumHeightVal / 3.28084).toFixed(2)) * 100;;
    }

    var costPer = $('input[name="costPer"]').val();
    var season = $('input[name="season"]:checked').val() || "Summer";
    var crossBorders = $('input[name="crossBorders"]:checked').val() || "Y";
    var representation = $('input[name="representation"]:checked').val() || "turnByTurn";

    $('#heightPlaceholder').html(minimumHeightVal);
    $('#costPerPlaceholder').html(costPer);
    $('#seasonPlaceholder').html(season);
    $('#avoidTollRoadsPlaceholder').html($('input[name="avoidTollRoads"]:checked').val());

    $('#locations').html('<strong id="location1"></strong>' +
        '<br />To <strong id="location2"></strong>');
    $('#location1').html(origin);
    $('#location2').html(destination);

    let all_origin_destinations_list = [origin.toUpperCase()];

    var waypoints = '';
    waypoints = '&origin=' + getWaypoint(origin);
    let destination_waypoint = getWaypoint(destination);

    if (pageType === "route") {

        $('#crossBordersPlaceholder').html(crossBorders);
        $('#distanceIsInPlaceholder').html(metricSystem === 'imperial' ? 'Miles' : 'Kilometers');

        var destination_selects = $('select').filter(function () {
            return this.name.match(/destination\d+/);
        }).toArray();

        if (destination_selects.length > 1) {
            $(destination_selects).each(function (index) {
                let dest = $(this).find('option:selected').val();
                if (dest) {
                    if (index === destination_selects.length - 1) {
                        destination_waypoint = getWaypoint(dest);
                    }
                    else {
                        $('#location' + (index + 1)).after('<br />To <strong id="location' + (index + 2) + '">' + dest + '</strong>');
                        waypoints += '&via=' + getWaypoint(dest);
                    }
                    all_origin_destinations_list.push(dest.toUpperCase());
                }
            });
        }
        else {
            all_origin_destinations_list.push(destination.toUpperCase());
        }

        $('#submit').attr("disabled", "disabled").html("Calculating, please wait...");

    }

    waypoints += '&destination=' + destination_waypoint;

    var url = routingBaseURL;
    url += '&' + hereBillingTags;
    url += '&transportMode=truck';
    url += '&units=' + metricSystem;
    url += '&avoid[features]=seasonalClosure';
    url += "&return=polyline,summary,instructions,actions,tolls";
    url += "&spans=stateCode,length,tollSystems,duration";
    url += waypoints;

    if (avoidTollRoads) {
        url += '&avoid[features]=tollRoad';
    }

    if (crossBorders === 'N') {
        url += '&exclude[countries]=CAN,MEX';
    }

    if (minimumHeight && minimumHeight > 0) {
        url += '&vehicle[height]=' + parseInt(minimumHeight);
    }

    $.ajax({
        dataType: 'json',
        crossDomain: true,
        url: url,
        timeout: 0, // no timeout
        success: function (data) {

            let total_summary_length = 0;
            let total_summary_duration = 0;
            let html = '';
            let stateTotals = {};
            let tollDistance = 0;
            let nonTollDistance = 0;
            let stateTotalsTbody = $('#stateTotals').find('tbody');
            stateTotalsTbody.html('');

            for (let section_index = 0; data.routes[0].sections.length > section_index; section_index++) {

                let summary = data.routes[0].sections[section_index].summary;
                let summaryByCountry = data.routes[0].sections[section_index].spans;

                total_summary_length += summary.length;
                total_summary_duration += summary.duration;

                for (var i = 0; i < summaryByCountry.length; i++) {

                    if (!stateTotals[summaryByCountry[i].stateCode]) {
                        stateTotals[summaryByCountry[i].stateCode] = { tollDistance: 0, nonTollDistance: 0, duration: 0 };
                    }

                    if (summaryByCountry[i].tollSystems && summaryByCountry[i].tollSystems.length > 0) {
                        tollDistance += summaryByCountry[i].length;
                        stateTotals[summaryByCountry[i].stateCode].tollDistance += summaryByCountry[i].length;
                    } else {
                        nonTollDistance += summaryByCountry[i].length;
                        stateTotals[summaryByCountry[i].stateCode].nonTollDistance += summaryByCountry[i].length;
                    }

                    stateTotals[summaryByCountry[i].stateCode].duration += summaryByCountry[i].duration;

                }

            }

            for (let stateCode in stateTotals) {

                html += '<tr>';
                html += '<td>' + stateCode + '</td>';
                html += '<td>' + convertMeters(stateTotals[stateCode].tollDistance + stateTotals[stateCode].nonTollDistance) + '</td>';

                if (stateTotals[stateCode].tollDistance > 0) {
                    html += '<td>' + convertMeters(stateTotals[stateCode].tollDistance) + '</td>';
                    html += '<td>' + convertMeters(stateTotals[stateCode].nonTollDistance) + '</td>';
                } else {
                    html += '<td>0</td>';
                    html += '<td>' + convertMeters(stateTotals[stateCode].nonTollDistance) + '</td>';
                }

                html += '<td>' + convertSecondsToHours(stateTotals[stateCode].duration) + '</td>';
                html += '</tr>';

            }

            let maneuvers = data.routes[0].sections.reduce((accumulator, currentSection, index, array) => {
                let actionsWithExtraElement = [...currentSection.actions,
                {
                    action: "arrive-red",
                    duration: 0,
                    length: 0,
                    instruction: "Destination reached: " + all_origin_destinations_list[index + 1] + ", Next destination: " + all_origin_destinations_list[index + 2]
                }];
                if (index !== array.length - 1) {
                    return accumulator.concat(actionsWithExtraElement);
                } else {
                    return accumulator.concat(currentSection.actions);
                }
            }, []);

            turnByTurn(maneuvers);

            stateTotalsTbody.html(stateTotalsTbody.html() + html);

            $('#optModePlaceholder').html('Time');
            $('#distancePlaceholder').html(convertMeters(total_summary_length, 1));
            $('#totalDistancePlaceholder').html(convertMeters(total_summary_length, 1));
            $('#timePlaceholder').html(convertSecondsToHours(total_summary_duration));
            $('#totalTimePlaceholder').html(convertSecondsToHours(total_summary_duration));
            $('#tollDistancePlaceholder').html(convertMeters(tollDistance));
            $('#nonTollDistancePlaceholder').html(convertMeters(nonTollDistance));
            $('#totalCostPlaceholder').html('$' + parseFloat(convertMeters(total_summary_length, 1, true) * (costPer || 0)).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
            $('#mileage-form').hide();

            if (pageType === "route") {
                $('#results').show();
                $('html,body').animate({
                    scrollTop: $('#results').offset().top
                });
            }
            else {
                $('#mileage-calc-results').show();
            }

            $('#map').html('');

            var mapMode = 'fastest;truck';

            if (avoidTollRoads) {
                mapMode = 'fastest;truck;tollroad:-3';
            }

            calculateRoute(mapMode, metricSystem, minimumHeight, (season === 'Winter' ? true : false), crossBorders, representation);

        },
        error: function (jqXHR, text_status, error) {
            if (pageType === "route") {
                logMileageCalcError(origin, destination, waypoints);
                alert('Unable to calculate route.')
            }
        },
        complete: function () {
            if (pageType === "route") {
                $('#submit').removeAttr("disabled").html("Calculate Mileage");
            }
        }
    });

}

function getWaypoint(thelocation) {
    var latitude = '';
    var longitude = '';

    let autocomplete_url = '/home/ajax/autocomplete?return_only=cities&page=1&searchtext=' + thelocation + '&limit=1';

    $.ajax({
        async: false,
        dataType: 'json',
        crossDomain: false,
        url: autocomplete_url
    }).done(function (data) {
        if (data && data[0] && data[0].latitude && data[0].longitude) {
            latitude = data[0].latitude;
            longitude = data[0].longitude;
        } else {
            alert("city not found: " + thelocation);
        }
    });

    waypointArr.push(latitude + ',' + longitude);
    return latitude + ',' + longitude;
}

function logMileageCalcError(origin, destination, waypoints) {
    if (!origin || !destination || !waypoints) return false;

    let matches = waypoints.split(/!|&|\,/);
    let origin_lat = 0;
    let origin_lng = 0;
    let destination_lat = 0;
    let destination_lng = 0;

    if (matches.length) {
        origin_lat = matches[2];
        origin_lng = matches[3];
        destination_lat = matches[5];
        destination_lng = matches[6];
    }

    $.ajax({
        type: "POST",
        url: '/home/ajax/log_mileage_calc_error',
        data: {
            origin: origin,
            destination: destination,
            origin_lat: origin_lat,
            origin_lng: origin_lng,
            destination_lat: destination_lat,
            destination_lng: destination_lng,
        },
        dataType: "json"
    });

    return true;

};

function navigation(legs) {
    $('#directionsNav').show();
    $('#directionsTurnByTurn').hide();
    var directionsTbody = $('#directionsNav > tbody');
    directionsTbody.html('');

    for (var i = 0; i < legs.length; i++) {
        var maneuvers = legs[i].maneuver;

        for (var x = 0; x < maneuvers.length; x++) {
            var html = '<tr>';
            html += '<td>' + maneuvers[x].roadName + '</td>';
            html += '<td>' + maneuvers[x].roadNumber + '</td>';
            html += '<td>' + maneuvers[x].nextRoadName + '</td>';
            html += '<td>' + maneuvers[x].nextRoadNumber + '</td>';
            html += '<td>' + convertMeters(maneuvers[x].length, 1) + '</td>';
            html += '<td>' + convertSecondsToHours(maneuvers[x].travelTime) + '</td>';
            html += '</tr>';

            directionsTbody.html(directionsTbody.html() + html);
        }
    }
}

function turnByTurn(maneuvers) {
    $('#directionsNav').hide();
    $('#directionsTurnByTurn').show();
    var directionsTbody = $('#directionsTurnByTurn > tbody')
    directionsTbody.html('');

    for (var x = 0; x < maneuvers.length; x++) {
        var html = '<tr' + (maneuvers[x].action === 'arrive-red' ? ' class="arrive-red"' : '') + '>';
        html += '<td>' + maneuvers[x].instruction;
        html += '</td>';
        html += '<td>' + convertMeters(maneuvers[x].length, 1) + '</td>';
        html += '<td>' + convertSecondsToHours(maneuvers[x].duration) + '</td>';
        html += '</tr>';
        directionsTbody.html(directionsTbody.html() + html);
    }
}

function convertMeters(meters, decimals, dontShowLabel) {
    var metricSystem = $('input[name="metricSystem"]:checked').val() || "imperial";

    if (metricSystem === 'imperial') {
        var val = (meters * 0.00062137).toFixed(decimals);

        if (dontShowLabel) {
            return val;
        }

        return val + '  Mile(s)';
    } else {
        var val = (meters * 0.001).toFixed(decimals);

        if (dontShowLabel) {
            return val;
        }

        return val + '  Kilometers(s)';
    }
}

function convertSecondsToHours(seconds) {
    var minutes = seconds / 60;
    var roundedHours = (minutes / 60).toFixed(2);
    var hours = roundedHours.substr(0, roundedHours.indexOf('.'));
    var leftoverMinutes = roundedHours.substr(roundedHours.indexOf('.') + 1);

    leftoverMinutes = leftoverMinutes * 60 / 100;

    return hours + ' Hour(s) ' + leftoverMinutes + ' Minute(s)';
}

function calculateRoute(mode, metricSystem, height, avoidSeasonClosurees, crossBorders, representation) {

    let billing_tag_value = hereBillingTags.split("=")[1];

    platform = new H.service.Platform({
        apikey: 'd_wA_3ri7d0gHDtB4yvQ0EpvxKEotZ6Td9GJ5MoLGI0',
        useHTTPS: true,
        billingTag: 'calculateRoute-web+' + billing_tag_value
    });

    defaultLayers = platform.createDefaultLayers();

    // let midpoint = get_lat_long_midpoint(waypointArr);
    // let distance = get_lat_long_distance(waypointArr);
    // let map_zoom = get_distance_zoom(distance);
    let bounding_box_corners = get_bounding_box_corners(waypointArr);

    map = new H.Map(mapContainer, defaultLayers.vector.normal.map);

    let origin = waypointArr[0].split(",");
    let destination = waypointArr[1].split(",");

    let box = new H.geo.Rect(bounding_box_corners[0], bounding_box_corners[1], bounding_box_corners[2], bounding_box_corners[3]);
    map.getViewModel().setLookAtData({ bounds: box });

    behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    behavior.disable(H.mapevents.Behavior.WHEELZOOM);
    behavior.disable(H.mapevents.Behavior.DRAGGING);
    behavior.disable(H.mapevents.Behavior.DBLTAPZOOM);

    ui = H.ui.UI.createDefault(map, defaultLayers);

    var router = platform.getRoutingService(),
        routeRequestParams = {
            mode: mode,
            representation: representation,
            height: parseInt(height / 100),
            metricSystem: metricSystem,
            excludeCountries: crossBorders === 'N' ? 'CAN,MEX' : '',
            routeattributes: "waypoints,summary,shape,legs",
            maneuverattributes: "direction,action",
            truckRestrictionPenalty: "soft",
            billingTag: billing_tag_value
        };

    for (var i = 0; i < waypointArr.length; i++) {
        routeRequestParams['waypoint' + i] = waypointArr[i];
    }

    router.calculateRoute(
        routeRequestParams,
        onSuccess,
        onError
    );

}

function onSuccess(result) {
    var route = result.response.route[0];
    addRouteShapeToMap(route);
    addManueversToMap(route);
    let current_zoom = map.getZoom();
    map.setZoom(current_zoom - .5);
}

function onError(error) {
    alert(error);
}

function openBubble(position, text) {
    if (!bubble) {
        bubble = new H.ui.InfoBubble(
            position,
            // The FO property holds the province name.
            {
                content: text
            });
        ui.addBubble(bubble);
    } else {
        bubble.setPosition(position);
        bubble.setContent(text);
        bubble.open();
    }
}

function addRouteShapeToMap(route) {
    var lineString = new H.geo.LineString(),
        routeShape = route.shape,
        polyline;

    routeShape.forEach(function (point) {
        var parts = point.split(',');
        lineString.pushLatLngAlt(parts[0], parts[1]);
    });

    polyline = new H.map.Polyline(lineString, {
        style: {
            lineWidth: 4,
            strokeColor: 'rgba(0, 128, 255, 0.7)'
        }
    });
    // Add the polyline to the map
    map.addObject(polyline);
    // And zoom to its bounding rectangle
    // map.setViewBounds(polyline.getBounds(), true);
}

function addManueversToMap(route) {
    var svgMarkup = '<svg width="18" height="18" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="8" cy="8" r="8" ' +
        'fill="#1b468d" stroke="white" stroke-width="1"  />' +
        '</svg>',
        dotIcon = new H.map.Icon(svgMarkup, {
            anchor: {
                x: 8,
                y: 8
            }
        }),
        group = new H.map.Group(),
        i,
        j;

    // Add a marker for each maneuver
    for (i = 0; i < route.leg.length; i += 1) {
        for (j = 0; j < route.leg[i].maneuver.length; j += 1) {
            // Get the next maneuver.
            maneuver = route.leg[i].maneuver[j];
            // Add a marker to the maneuvers group
            var marker = new H.map.Marker({
                lat: maneuver.position.latitude,
                lng: maneuver.position.longitude
            }, {
                icon: dotIcon
            });
            marker.instruction = maneuver.instruction;
            group.addObject(marker);
        }
    }

    group.addEventListener('tap', function (evt) {
        map.setCenter(evt.target.getPosition());
        openBubble(
            evt.target.getPosition(), evt.target.instruction);
    }, false);

    // Add the maneuvers group to the map
    map.addObject(group);
}

Number.prototype.toMMSS = function () {
    return Math.floor(this / 60) + ' minutes ' + (this % 60) + ' seconds.';
}

function get_lat_long_midpoint(waypointArr) {

    let origin = waypointArr[0].split(",");
    let destination = waypointArr[1].split(",");

    let origin_lat = origin[0] * Math.PI / 180;
    let origin_lng = origin[1] * Math.PI / 180;

    let origin_a = Math.cos(origin_lat) * Math.cos(origin_lng);
    let origin_b = Math.cos(origin_lat) * Math.sin(origin_lng);
    let origin_c = Math.sin(origin_lat);

    let destination_lat = destination[0] * Math.PI / 180;
    let destination_lng = destination[1] * Math.PI / 180;

    let destination_a = Math.cos(destination_lat) * Math.cos(destination_lng);
    let destination_b = Math.cos(destination_lat) * Math.sin(destination_lng);
    let destination_c = Math.sin(destination_lat);

    let x = (origin_a + destination_a) / 2;
    let y = (origin_b + destination_b) / 2;
    let z = (origin_c + destination_c) / 2;

    let lon = Math.atan2(y, x);
    let hyp = Math.sqrt(x * x + y * y);
    let lat = Math.atan2(z, hyp);

    let mid_lat = (lat * 180 / Math.PI);
    let mid_lng = (lon * 180 / Math.PI);

    return [mid_lat, mid_lng];

}

function get_lat_long_distance(waypointArr) {

    let origin = waypointArr[0].split(",");
    let destination = waypointArr[1].split(",");

    var radlat1 = Math.PI * origin[0] / 180;
    var radlat2 = Math.PI * destination[0] / 180;

    var theta = origin[1] - destination[1];
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

    if (dist > 1) {
        dist = 1;
    }

    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;

    dist = dist * 1.609344;

    return dist;

}

function get_distance_zoom(distance) {
    if (distance < 200) return 8;
    if (distance < 500) return 7;
    if (distance < 750) return 6;
    if (distance < 2000) return 4.5;
    return 4;
}

function get_bounding_box_corners(waypointArr) {
    let latitudes = [];
    let longitudes = [];

    for (var index = 0; index < waypointArr.length; index++) {
        let lat_lng = waypointArr[index].split(",");
        latitudes.push(parseFloat(lat_lng[0]));
        longitudes.push(parseFloat(lat_lng[1]));
    }

    return [Math.max.apply(Math, latitudes), Math.min.apply(Math, longitudes), Math.min.apply(Math, latitudes), Math.max.apply(Math, longitudes)];

}
