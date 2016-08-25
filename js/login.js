var dialog = $("#dialog-create")[0];
if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
}

$("#nav-login").on('click touchstart', function () {
    dialog.showModal();
});
dialog.querySelector('.close').addEventListener('click', function () {
    dialog.close();
});


var provider = new firebase.auth.FacebookAuthProvider();
$("#login-facebook").on('click touchstart', function () {
    firebase.auth().signInWithPopup(provider).then(function (result) {
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        console.log(result);
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        dialog.close();
        // ...
    }).catch(function (error) {
        console.log(error);
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    });
});
