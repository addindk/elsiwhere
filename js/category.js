var storageRef = firebase.storage().ref('subcategory');
var dialogAdd = $("#dialog-add-subcategory")[0];
var dialogRemove = $("#dialog-remove-category")[0];
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
    $('#progress').show();
    var key = firebase.database().ref('queue/category/tasks').push().key;

    var uploadTask = storageRef.child(key).put(btn.files[0]);
    uploadTask.on('state_changed', function (snapshot) {
        console.log('state', snapshot);
        // Observe state change events such as progress, pause, and resume
        // See below for more detail
        var p = 100 * snapshot.b / snapshot.h;
        dialogAdd.querySelector('.mdl-progress').MaterialProgress.setProgress(p);
    }, function (error) {
        console.log('error', error);
        // Handle unsuccessful uploads
    }, function () {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        var downloadURL = uploadTask.snapshot.downloadURL;
        console.log('success', uploadTask.snapshot);
        firebase.database().ref('queue/tasks/' + key).set({
            action: 'add',
            item: 'subcategory',
            title: title,
            description: description,
            category: id
        }).then(function (res) {
            $('#form-add-subcategory')[0].reset();
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
    firebase.database().ref('queue/tasks/' + key).set({ action: 'remove', item: 'category' }).then(function (res) {
        window.location.href = "/search.html";
    }).catch(function (err) {
        $('#error').text(err.message);
    });

});
dialogRemove.querySelector('.close').addEventListener('click', function () {
    dialogRemove.close();
});
$("#add").on('click', function () {
    dialogAdd.showModal();
});
$("#remove").on('click', function () {
    dialogRemove.showModal();
});

firebase.database().ref('subcategory').child(id).on("child_added", function (snapshot) {
    var item = snapshot.val();
    var key = snapshot.key;
    console.log(key, item);
    var html = '<div id="' + key + '" class="mdl-cell mdl-cell--2-col-phone mdl-cell--4-col-tablet mdl-cell--4-col-desktop category">';
    html += '<a href="/b' + key + '.html">';
    html += '<img src="/assets/subcategory/256/' + key + '.jpg" class="sq" />';
    html += '<span class="image-title">';
    html += '<span class="name">' + item.t + '</span>';
    html += '</span>';
    html += '</a>';
    html += '</div>';
    $('#items').append(html);
});
firebase.database().ref('subcategory').child(id).on("child_removed", function (snapshot) {
    $('#' + snapshot.key).remove();
});

