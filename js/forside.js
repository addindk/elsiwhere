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



firebase.database().ref('category').on("child_added", function (snapshot) {
    var item = snapshot.val();
    var key = snapshot.key;
    console.log(key, item);
    var html = '<div id="' + key + '" class="mdl-cell mdl-cell--2-col-phone mdl-cell--4-col-tablet mdl-cell--4-col-desktop category">';
    html += '<a href="/a' + key + '.html">';
    html += '<img src="/assets/category/256/' + key + '.jpg" class="sq" />';
    html += '<span class="image-title">';
    html += '<span class="name">' + item.t + '</span>';
    html += '</span>';
    html += '</a>';
    html += '</div>';
    $('#items').append(html);
});
firebase.database().ref('category').on("child_removed", function (snapshot) {
    $('#' + snapshot.key).remove();
});