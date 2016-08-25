/*var marker;
var latlng
var initMap = function () {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -56, lng: 12 },
        zoom: 8,
        mapTypeControl: true,
        streetViewControl: false,
    });
    marker = new google.maps.Marker({
            position: { lat: -56, lng: 12 },
            map: map
    });
    google.maps.event.addListener(map, 'center_changed', function () {
        var latlng = map.getCenter();
        marker.setPosition(latlng); 
    });
    navigator.geolocation.getCurrentPosition(function (position) {
        
        var myLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(myLatLng);
        marker.setPosition(myLatLng)

    });


}*/
var map;

mapboxgl.accessToken = 'pk.eyJ1IjoicnVuZXR2aWx1bSIsImEiOiJkeUg2WVkwIn0.yoMmv3etOc40RXkPsebXSg';
document.getElementById('mappage').addEventListener('mdl-componentupgraded', function () {
    console.log('upgrade');
    if (!map) {
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/outdoors-v9'
        });
        var nav = new mapboxgl.Navigation({ position: 'top-left' }); // position is optional
        map.addControl(nav);
        var geolocate = new mapboxgl.Geolocate({ position: 'top-left' });
        map.addControl(geolocate);
        geolocate._onClickGeolocate();
        map.on('click', function (e) {
            var features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-points'] });

            if (!features.length) {
                return;
            }

            var feature = features[0];
            window.location.href = "/c" + feature.properties.id+'.html';

            // Populate the popup and set its coordinates
            // based on the feature found.
            /*var popup = new mapboxgl.Popup()
                .setLngLat(feature.geometry.coordinates)
                .setHTML(feature.properties.description)
                .addTo(map);*/
        });
        map.on('mousemove', function (e) {
            var features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-points'] });
            map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
        });
        map.on('load', function () {

            firebase.database().ref('geofire').once('value').then(function (snapshot) {
                var data = snapshot.val();
                var geojson = {
                    "type": "FeatureCollection",
                    "features": []
                };
                for (var key in data) {
                    geojson.features.push({
                        "type": "Feature",
                        "properties": {
                            "id": key
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [data[key].l[1], data[key].l[0]]
                        }
                    })
                }
                map.addSource("items", {
                    type: "geojson",
                    data: geojson,
                    //data: "/js/earthquakes.geojson",
                    cluster: true,
                    clusterMaxZoom: 14, // Max zoom to cluster points on
                    clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
                });
                /*map.addLayer({
                    "id": "unclustered-points",
                    "type": "symbol",
                    "source": "items",
                    "layout": {
                        "icon-image": "marker-15"
                    }
                });*/
                map.addLayer({
                    "id": "unclustered-points",
                    "type": "circle",
                    "source": "items",
                    "paint": {
                        "circle-color": '#E040FB',
                        "circle-radius": 12
                    }
                });
                var layers = [
                    [150, '#f28cb1'],
                    [20, '#f1f075'],
                    [0, '#51bbd6']
                ];

                layers.forEach(function (layer, i) {
                    map.addLayer({
                        "id": "cluster-" + i,
                        "type": "circle",
                        "source": "items",
                        "paint": {
                            "circle-color": layer[1],
                            "circle-radius": 18
                        },
                        "filter": i === 0 ?
                            [">=", "point_count", layer[0]] :
                            ["all",
                                [">=", "point_count", layer[0]],
                                ["<", "point_count", layers[i - 1][0]]]
                    });
                });

                // Add a layer for the clusters' count labels
                map.addLayer({
                    "id": "cluster-count",
                    "type": "symbol",
                    "source": "items",
                    "layout": {
                        "text-field": "{point_count}",
                        "text-font": [
                            "DIN Offc Pro Medium",
                            "Arial Unicode MS Bold"
                        ],
                        "text-size": 12
                    }
                });
                map.addLayer({
                    "id": "marker",
                    "type": "symbol",
                    "source": "items",
                    "layout": {
                        "icon-image": "embassy-15"
                    },
                    "filter": ["!has", "point_count"]
                });
            });
        })
    } else {
        map.resize();
    }
});