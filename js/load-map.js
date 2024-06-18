// Find the clickmap.css file
const clickmap_css = Object.values(document.styleSheets).filter((sheet) => {
    if (sheet.href != null && sheet.href.match(/clickmap/)) {
        return sheet
    }
})

// Locate one of the media rules that contain a list of states and provinces expected.
const media_rule = Object.values(clickmap_css[0].cssRules).filter(
    (rule) => rule.conditionText != null && rule.conditionText.match(/960px/))

const map = L.map('map').setView([39.5, -95], 4);
var USAbounds = [
    //[24.521208, -124.736342], // Southwestern point of the bounding box
    //[49.382808, -66.945392]  // Northeastern point of the bounding box
    [24.686952411999155, -124.736342], // Southwestern point of the bounding box
    [51.72702815704777, -66.945392]  // Northeastern point of the bounding box
    ];
map.fitBounds(USAbounds); //for mobile

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 9,
    minZoom: 2,
    attribution: '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// control that shows state info on hover
const info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

let contents = 'Hover over a state';
info.update = function (props) {
    if (props) {
        let state_values = get_state_in_out_values(props.name);
        contents = `<b>${props.name}</b><br>`;
        contents += `Outbound: ${state_values.outbound}</sup><br>`;
        contents += `Inbound: ${state_values.inbound}</sup><br>`;
        contents += `Percent Outbound: ${state_values.outbound_percentage}%</sup>`;
        //this._div.innerHTML = `<h4 style="margin-bottom:0;text-align:center">Percentage of ${props.name} Loads <span class=abbr><br></span>Outbound</h4>`;
    }
    else {
        this._div.innerHTML = '<h4 style="margin-bottom:0;text-align:center">Percentage of ' + trailer_type_path.replace('-',' ') + ' Loads <span class=abbr><br></span>Outbound</h4>';
    }
};

info.addTo(map);

function getHexColor(percentage) {
    if (!percentage) percentage = 0;
    if (percentage >= 50) {
        var alpha = Math.round(((percentage / 100) * 2 - 1) * 255);
        return "#34a853" + alpha.toString(16).padStart(2, '0'); //google green
    }
    var alpha = Math.round((1 - (percentage / 100) * 2) * 255);
    return "#ea4335" + alpha.toString(16).padStart(2, '0'); //google red
}

function style(feature) {
    let state_values = get_state_in_out_values(feature.properties.name);
    return {
        weight: 2,
        opacity: 1,
        color: 'white', //border color unhighlight
        //dashArray: '3',
        fillOpacity: 1,
        fillColor: getHexColor(state_values.outbound_percentage || 0)
    };
}

function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#808080',  //highlighted state border color
        dashArray: '',
        fillOpacity: 0.7
    });

    layer.bringToFront();

    let state_values = get_state_in_out_values(layer.feature.properties.name);
    layer.feature.properties.in_out_percentage = state_values.outbound_percentage;
    layer.feature.properties.state_code = state_values.state_code;

    info.update(layer.feature.properties);
}

/* global statesData */
const geojson = L.geoJson(statesData, {
    style,
    onEachFeature
}).addTo(map);

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    if (e.originalEvent) {
        let forward_url = "/home/loads/map/" + ( trailer_type_path || "All" ) + "/" + e.target.feature.properties.name;
        window.location = forward_url;
    }
    else {
        highlightFeature(e);
        map.fitBounds(e.target.getBounds());
    }
}

function onEachFeature(feature, layer) {
    layer.on({
        //mouseover: highlightFeature,
        //mouseout: resetHighlight,
        click: zoomToFeature
    });
}

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {

    const div = L.DomUtil.create('div', 'info legend fullname');
    const labels = [];

    for (let i = 100; i >= 0; i -= 10) {
        labels.push(`<i style="background:${getHexColor(i)}"></i> ${i}% `);
    }

    div.innerHTML = labels.join('<br>');
    return div;
};

legend.addTo(map);

geojson.eachLayer(function (layer) {
    let state_values = get_state_in_out_values(layer.feature.properties.name);
        contents = `<b>${layer.feature.properties.name}</b><br><br>`;
        contents += `Outbound: ${state_values.outbound} <a onclick='document.getElementById("${state_values.state_code}_out").click();'>(view)</a></sup><br><br>`;
        contents += `Inbound: ${state_values.inbound} <a onclick='document.getElementById("${state_values.state_code}_in").click();'>(view)</a></sup><br><br>`;
        contents += `Percent Outbound: ${state_values.outbound_percentage}%</sup>`;
    //layer.bindPopup(contents);
});

function trigger_state_click(state) {
    geojson.eachLayer(function (layer) {
        if (layer.feature.properties.name.toUpperCase() === state.toUpperCase()) {
            layer.fireEvent('click');
        }
    });
}

function get_state_in_out_values(full_state_name) {

    let map_value_key = full_state_name.toUpperCase().replace(/\s+/gi, '-');
    if (map_values[map_value_key] === undefined) {
        return {
            inbound: 0,
            outbound: 0,
            outbound_percentage: 0
        };
    }
    let state_values = map_values[map_value_key];


    return state_values;

}

