function init() {
    if (originDefault.length > 0 && destination1Default.length > 0) {
        $('#mileage-form').hide();
        $('#results').show();
        calculate_route(originDefault, destination1Default, 'imperial', false, "route");
        convertSelect2('#origin', originDefault);
        convertSelect2('#destination1', destination1Default);
    } else {
        convertSelect2('#origin', originDefault);
        convertSelect2('#destination1', destination1Default);
        $('#mileage-form').show();
    }
}

function get_geoip_location() {
    if (geoIPStateCode.length > 1) return; //already called
    $.getJSON(geoIPUrl).done(function (result) {
        if (result.status) {
            geoIPCity = result.city;
            geoIPStateCode = result.state;
            geoIPStateName = result.statename;
            geoIPCountryCode = result.countrycode;
        }
    });
}

setTimeout(get_geoip_location, 20);

function convertSelect2(elem, defaultVal) {
    var obj = elem.substr(1);

    window[obj] = $(elem).select2({
        templateResult: function (item) {
            return select2_templateResult(item, window[obj], 1);
        }, //outside of ajax
        ajax: {
            cache: false,
            data: function (params) {
                return {
                    return_only: "cities",
                    page: params.page || 1,
                    searchtext: params.term || ''
                };
            },
            dataType: 'json',
            delay: 5,
            processResults: function (data, query) {
                return select2_processResults(data, query, window[obj], geoIPCity, geoIPStateCode, geoIPStateName, geoIPCountryCode, 1);
            },
            transport: function (params, success, failure) {
                return select2_Transport(params, success, failure, window[obj]);
            },
            url: 'ajax/autocomplete'
        },
        dropdownPosition: 'below',
        language: {
            inputTooLong: function () {
                return 'You may select 1 city or 1 state';
            },
            maximumSelected: function () {
                return 'You may select 1 city or 1 state';
            },
            searching: function (params) {
                query = params;
                return 'Searching…';
            }
        },
        maximumInputLength: 100,
        minimumInputLength: 0,
        maximumSelectionLength: 5,
        placeholder: 'City, State or Zipcode',
        selectOnClose: true,
        //sorter: select2_Sorter,
        width: '100%'
    });

    window['setLocation_callback_' + obj] = function (position) {
        select2_setLocation_callback(position, window[obj], geoIPCity, geoIPStateCode);
    }

    window[obj].on('select2:selecting', function (e) {
        select2_selecting(e, window['setLocation_callback_' + obj], window[obj]);
    });

    if (defaultVal) {
        var option = new Option(defaultVal, defaultVal, true, true);
        window[obj].val(defaultVal).append(option).trigger('change');
        //select2_templateResult(defaultVal, window[obj]);
    }
}

$(document).ready(function () {

    init();

    // this global number keeps incrementing every time a destination is added
    // the reason for this, is that is destinations are removed its hard to 
    // keep the correct index of each one, and if two of them have the same
    // index, the autocomplete wont work, rt:41485
    var destination_index = 2;

    $('#add-destination').on('click', function (e) {

        var current_destination_count = parseInt($('.destination').length);

        var clone = $('<div class="form-element destination" data-attr-dest="1">' +
            '<label for="destination1">DESTINATION:</label>' +
            '<div class="inputs">' +
            '<select id="destination1" name="destination1"></select>' +
            '<button type="button" class="button remove-destination">Remove</button>' +
            '</div>' +
            '</div>');

        if (current_destination_count === 1) {
            $('label[for="destination1"]').html('DESTINATION 1:');
        }

        // dont allow more than 10 destinations
        if (current_destination_count >= 9) $(this).hide();

        clone.attr('data-attr-dest', (destination_index + 1));
        clone.find('label').html('DESTINATION ' + (current_destination_count + 1) + ':');
        clone.find('select').attr('id', 'destination' + (destination_index + 1)).attr('name', 'destination' + (destination_index + 1)).val('');
        $('.destination:last').after(clone);

        convertSelect2('#destination' + (destination_index + 1));
        destination_index++;

    });

    $(document).on('click', '.remove-destination', function (e) {
        $(this).parents('.destination').remove();

        var i = 1;

        // re-number the destinations 
        $('.destination').each(function (destination) {
            $(this).find('label').html('DESTINATION ' + i + ':');
            i++;
        });

        // re-appear add destination button if some were removed and now we have less than 10
        var count = parseInt($('.destination').length);
        if (count <= 9) $('#add-destination').show();

    });

    $('#toggle-calc').on('click', function (e) {
        if ($(this).hasClass('show')) {

            $(this).removeClass('show');
            $('#mileage-form').hide();
            $(this).html('Open Filter');

            $('html,body').animate({
                scrollTop: $('#results').offset().top
            });
        } else {

            $(this).addClass('show');
            $('#mileage-form').show();
            $(this).html('Close Filter');

            $('html,body').animate({
                scrollTop: $('#content').offset().top
            });
        }
    });

    $('h2 .fa').on('click', function (e) {
        if ($(this).hasClass('fa-chevron-down')) {
            $(this).removeClass('fa-chevron-down');
            $(this).addClass('fa-chevron-up');
            $(this).parents('.tbl').addClass('hide-rows');
        } else {
            $(this).removeClass('fa-chevron-up');
            $(this).addClass('fa-chevron-down');
            $(this).parents('.tbl').removeClass('hide-rows');
        }
    });

    $('#submit').on('click', function (e) {
        e.preventDefault();
        var origin = originDefault;
        var destination = destination1Default;
        if ($('#origin').val()) {
            origin = $('#origin').val();
        }
        if ($('#destination1').val()) {
            destination = $('#destination1').val();
        }

        var metricSystem = $('input[name="metricSystem"]:checked').val();
        var avoidTollRoads = $('input[name="avoidTollRoads"]:checked').val() === 'Y' ? true : false;
        calculate_route(origin, destination, metricSystem, avoidTollRoads, "route");
    });

});