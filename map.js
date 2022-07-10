//Copyright (C) 2022, Tanner Hodges, University of North Georgia
// Additional sources:
// Icons: Created by Andre437, https://en.wikipedia.org/wiki/User:Andr%C3%A9437
// OpenLayers: https://openlayers.org/


var latEl = document.getElementById('lat');
var lonEl = document.getElementById('lon');


// Create pop-up tables to display user submitted data
var popupEl = document.getElementById('popup');
var popupOverlay = new ol.Overlay({
    element: popupEl
});
var popupTableEl = document.createElement('table');
popupTableEl.id = 'popup-table';
popupEl.appendChild(popupTableEl);

// Create map
var map = new ol.Map({
	target: 'map',
	layers: [
		new ol.layer.Tile({
			source: new ol.source.OSM()
		})
	],
	view: new ol.View({
		center: ol.proj.fromLonLat([-83.93,34.16]),
		zoom: 7.5
	}),
	overlays: [popupOverlay]
});

// Display table with click event and feature detection
map.on('singleclick', evt => {
	var lonLat = ol.proj.toLonLat(evt.coordinate);
	latEl.value = Math.round(lonLat[1] * 1e+4) / 1e+4;
	lonEl.value = Math.round(lonLat[0] * 1e+4) / 1e+4;
	var featuresDetected = false;

    map.forEachFeatureAtPixel(evt.pixel, feature => {
        featuresDetected = true;
        var name = feature.get('name');
        var lat = feature.get('lat');
        var lon = feature.get('lon');
        var noise_type = feature.get('noise_type');
        var noise_val = feature.get('noise_val');
        var desc = feature.get('desc');

        for (var i = popupTableEl.rows.length - 1; i >= 0; i--)
            popupTableEl.deleteRow(i);

        var rowEl = popupTableEl.insertRow(-1);
        rowEl.insertCell(-1).innerHTML = 'Name';
        rowEl.insertCell(-1).innerHTML = name;

        rowEl = popupTableEl.insertRow(-1);
        rowEl.insertCell(-1).innerHTML = 'Latitude';
        rowEl.insertCell(-1).innerHTML = lat;

        rowEl = popupTableEl.insertRow(-1);
        rowEl.insertCell(-1).innerHTML = 'Longitude';
        rowEl.insertCell(-1).innerHTML = lon;

        rowEl = popupTableEl.insertRow(-1);
        rowEl.insertCell(-1).innerHTML = "Noise Type";
        rowEl.insertCell(-1).innerHTML = noise_type;

        rowEl = popupTableEl.insertRow(-1);
        rowEl.insertCell(-1).innerHTML = "Noise Value (dBFS)";
        rowEl.insertCell(-1).innerHTML = noise_val;

        rowEl = popupTableEl.insertRow(-1);
        rowEl.insertCell(-1).innerHTML = "Description";
        rowEl.insertCell(-1).innerHTML = desc;

        popupOverlay.setPosition(evt.coordinate);
    });

    popupEl.style.display = featuresDetected ? 'block' : 'none';
});

// Icons displayed according to dBFS value
var iconLayer_high = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        image: new ol.style.Icon({
            src: 'circ_red.svg',
            scale: 0.1
        })
    })
});
map.addLayer(iconLayer_high);

var iconLayer_med = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        image: new ol.style.Icon({
            src: 'circ_yellow.svg',
            scale: 0.1
        })
    })
});
map.addLayer(iconLayer_med);

var iconLayer_low = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        image: new ol.style.Icon({
            src: 'circ_green.svg',
            scale: 0.1
        })
    })
});
map.addLayer(iconLayer_low);

// Retrieve current location from user's device
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        var view = map.getView();
        view.setCenter(ol.proj.fromLonLat([lon, lat]));
        view.setZoom(7.5);
    });
}

// Render tables and plot icons
window.addEventListener('load', evt => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', location.href + 'data');
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var db_entries = JSON.parse(xhr.responseText);
                for (var i = 0; i < db_entries.length; i++) {
                    var data = db_entries[i];
                    var lat = data.lat;
                    var lon = data.lon;
                    var coord = ol.proj.fromLonLat([lon, lat]);
                    var point = new ol.geom.Point(coord);
                    var feat = new ol.Feature({
                        geometry: point,
                        name: data.name,
                        lat: data.lat,
                        lon: data.lon,
                        noise_type: data.noise_type,
                        noise_val: data.noise_val,
                        desc: data.desc,
                    });
                    if (data.noise_val > -25.0 )
                        iconLayer_high.getSource().addFeature(feat);
                    else if (data.noise_val >= -45.0 )
                        iconLayer_med.getSource().addFeature(feat);
                    else
                        iconLayer_low.getSource().addFeature(feat);
                }
            } else
                alert('Error: ' + xhr.status);
        }
    };
    xhr.send();
})
