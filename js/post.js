

var initMap = function () {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: latitude, lng: longitude },
        zoom: 18,
        mapTypeControl: true,
        streetViewControl: false,
    });
    marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map
    });
};

firebase.database().ref('post').child(id).once('value').then(function (snapshot) {
    currentPost = snapshot.val();
    $("#timestamp").html(moment(currentPost.ts).fromNow());
    var currentUser = firebase.auth().currentUser;
    if (currentUser && currentUser.uid === currentPost.uid) {
        $('.post-edit').show();
    } else {
        $('.post-edit').hide();
    }
    return firebase.database().ref('users').child(currentPost.uid).once('value');
}).then(function (snapshot) {
    var user = snapshot.val();
    console.log(user);
    $("#editorName").html(user.n);
    $("#editorPhotoURL").css('background', 'url(' + user.u + ') center / cover');

});

var dialogRemove = $("#dialog-remove-post")[0];
if (!dialogRemove.showModal) {
    dialogPolyfill.registerDialog(dialogRemove);
}
dialogRemove.querySelector('.accept').addEventListener('click', function () {
    var key = id;
    firebase.database().ref('queue/tasks/' + key).set({ action: 'remove', item: 'post', category: category }).then(function (res) {
        window.location.href = "/b"+category;
    }).catch(function (err) {
        $('#error').text(err.message);
    });

});
dialogRemove.querySelector('.close').addEventListener('click', function () {
    dialogRemove.close();
});
$("#remove").on('click', function () {
    dialogRemove.showModal();
});