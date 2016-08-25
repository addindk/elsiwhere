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
        latlng = map.getCenter();
        marker.setPosition(latlng);
    });
    navigator.geolocation.getCurrentPosition(function (position) {
        var myLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        marker.setPosition(myLatLng)
        map.setCenter(myLatLng);
    });
}


/*********
 * Firebase
 *******/
firebase.database().ref('post').orderByChild("c").equalTo(id).on("child_added", function (snapshot) {
    var item = snapshot.val();
    var key = snapshot.key;
    console.log(key, item);
    var html = '<a href="/sight/'  + key + '.html" class="mdl-list__item mdl-list__item--three-line mdl-list--border">';
    html += '<span class="mdl-list__item-primary-content">';
    html += '<span>' + item.t + '</span>';
    html += '<span class="mdl-list__item-text-body">' + item.d + '</span>';
    html += '</span>';
    html += '<span class="mdl-list__item-secondary-content">';
    html += '<span class="list-img" style="background: url(/assets/post/256/' + key + '.jpg) center / cover;"></span>';
    html += '</span>';
    html += '</a>';
    $('#items').append(html);
});

firebase.database().ref('post').orderByChild("c").equalTo(id).on("child_removed", function (snapshot) {
    $('#' + snapshot.key).remove();
});


var storageRef = firebase.storage().ref('post');
var dialogAdd = $("#dialog-add-post")[0];
var dialogRemove = $("#dialog-remove-subcategory")[0];
if (!dialogAdd.showModal) {
    dialogPolyfill.registerDialog(dialogAdd);
    dialogPolyfill.registerDialog(dialogRemove);
}
dialogAdd.querySelector("input[name=uploadBtn]").onchange = function () {
    dialogAdd.querySelector("#uploadFile").value = this.files[0].name;
};
dialogAdd.querySelector('.mdl-progress').addEventListener('mdl-componentupgraded', function () {
    this.MaterialProgress.setProgress(0);
});

dialogAdd.querySelector('.accept').addEventListener('click', function () {
    var title = $('#title').val();
    var description = $('#description').val();
    var btn = dialogAdd.querySelector("input[name=uploadBtn]");
    if (!title) {
        $('#error').text('Mangler titel');
        return;
    }
    if (!description) {
        $('#error').text('Mangler beskrivelse');
        return;
    }
    if (btn.files.length !== 1) {
        $('#error').text('Mangler billede');
        return;
    }
    if (!latlng) {
        $('#error').text('Mangler lokation i kort');
        return;
    }

    var key = firebase.database().ref('queue/tasks').push().key;
    if (!firebase.auth().currentUser) {
        dialogLogin.showModal();
        return;
    }
    var uploadTask = storageRef.child(key).put(btn.files[0]);


    uploadTask.on('state_changed', function (snapshot) {
        console.log('state', snapshot);
        // Observe state change events such as progress, pause, and resume
        // See below for more detail
        var p = 100 * snapshot.b / snapshot.h;
        dialogAdd.querySelector('.mdl-progress').MaterialProgress.setProgress(p);
    }, function (err) {
        $('#error').text(err.message);
        // Handle unsuccessful uploads
    }, function () {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        var downloadURL = uploadTask.snapshot.downloadURL;
        console.log('success', uploadTask.snapshot);
        var doc = {
            action: 'add',
            item: 'post',
            title: title,
            category: id,
            description: description,
            lat: latlng.lat(),
            lng: latlng.lng(),
            uid: firebase.auth().currentUser.uid
        };
        if (dateStart.value !== '') {
            doc.start = dialogStartDate.time.valueOf()
        }
        if (dateSlut.value !== '') {
            doc.slut = dialogSlutDate.time.valueOf()
        }
        firebase.database().ref('queue/tasks/' + key).set(doc).then(function (res) {
            $('#form-add-post')[0].reset();
            dialogAdd.close();
        }).catch(function (err) {
            $('#error').text(err.message);
        });
    });

});

dialogAdd.querySelector('.close').addEventListener('click', function () {
    dialogAdd.close();
});
dialogRemove.querySelector('.accept').addEventListener('click', function () {
    var key = id;
    firebase.database().ref('queue/tasks/' + key).set({ action: 'remove', item: 'subcategory', category: category }).then(function (res) {
        window.location.href = "/";
    }).catch(function (err) {
        $('#error').text(err.message);
    });

});
dialogRemove.querySelector('.close').addEventListener('click', function () {
    dialogRemove.close();
});
$("#add").on('click', function () {
    dialogAdd.showModal();
    google.maps.event.trigger(map, 'resize');
});
$("#remove").on('click', function () {
    dialogRemove.showModal();
});
var dateStart = document.getElementById('dateStart');
var dateSlut = document.getElementById('dateSlut');
var dialogStartDate = new mdDateTimePicker.default({
    type: 'date',
    future: moment().add(1, 'years'),
    trigger: dateStart,
    cancel: 'fortryd'
});
var dialogSlutDate = new mdDateTimePicker.default({
    type: 'date',
    future: moment().add(1, 'years'),
    trigger: dateSlut,
    cancel: 'fortryd'
});

document.getElementById('btn-dateStart').addEventListener('click', function () {
    dialogAdd.close();
    dialogStartDate.toggle();
});
document.getElementById('btn-dateSlut').addEventListener('click', function () {
    dialogAdd.close();
    dialogSlutDate.toggle();
});
dateStart.addEventListener('onOk', function () {
    this.value = dialogStartDate.time.format('LL');
    this.parentNode.MaterialTextfield.checkDirty();
    dialogAdd.showModal();
});
dateStart.addEventListener('onCancel', function () {
    dialogAdd.showModal();
});
dateSlut.addEventListener('onCancel', function () {
    dialogAdd.showModal();
});

dateSlut.addEventListener('onOk', function () {
    this.value = dialogSlutDate.time.format('LL');
    this.parentNode.MaterialTextfield.checkDirty();
    dialogAdd.showModal();
});




