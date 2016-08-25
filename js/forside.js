var marker;
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


}