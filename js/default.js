// Initialize Firebase
// TODO: Replace with your project's customized code snippet    
moment.locale('da-DK');
var config = {
    apiKey: "AIzaSyCByuBNKnBU64oik_Z0qEKgi_czpEN9aL8",
    authDomain: "project-1805673855421320284.firebaseapp.com",
    databaseURL: "https://project-1805673855421320284.firebaseio.com",
    storageBucket: "project-1805673855421320284.appspot.com",
};
var currentPost;
$('.admin').hide();
firebase.initializeApp(config);
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        $("#displayName").text(user.displayName);
        $("#photoURL").attr('src', user.photoURL).show();
        $("#nav-logout").show();
        $("#nav-login").hide();

        if(currentPost && currentPost.uid === user.uid){
            $('.post-edit').show();
        } else {
            $('.post-edit').hide();
        }

        // User is signed in.
        firebase.database().ref('roles').child(user.uid).once('value', function (data) {
            if (data.exists()) {
                if (data.val() === 'admin') {
                    $('.admin').show();
                }
                $('.auth').show();
                $('.not-auth').hide();
            }
        });
        firebase.database().ref('users').child(user.uid).set({
            n: firebaseUser.displayName,
            u: firebaseUser.photoURL,
            e: firebaseUser.email
        });
    } else {
        $("#displayName").text("Ikke logget ind");
        $("#photoURL").hide();
        $("#nav-logout").hide();
        $("#nav-login").show();
        // No user is signed in.
        $('.admin').hide();
        $('.auth').hide();
        $('.not-auth').show();
        $('.post-edit').hide();
    }
});
$("#nav-logout").on("click touchstart", function () {
    //$('.mdl-layout')[0].MaterialLayout.toggleDrawer();
    firebase.auth().signOut().then(function () {
        console.log("Sign-out successful.");
    }, function (error) {
        console.log("An error happened.");
    });
});

/**********
 * Login
 */

var dialogLogin = $("#dialog-login")[0];
if (!dialogLogin.showModal) {
    dialogPolyfill.registerDialog(dialogLogin);
}

$("#nav-login").on('click touchstart', function () {
    //$('.mdl-layout')[0].MaterialLayout.toggleDrawer();
    dialogLogin.showModal();
});
dialogLogin.querySelector('.close').addEventListener('click', function () {
    dialogLogin.close();
});
var provider = new firebase.auth.FacebookAuthProvider();
$("#login-facebook").on('click', function () {
    firebase.auth().signInWithPopup(provider).then(function (result) {
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        console.log(result);
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        dialogLogin.close();
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