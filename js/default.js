$(document).ready(function () {
    $.ajaxSetup({ cache: true });
    $.getScript('//connect.facebook.net/da_DK/sdk.js', function () {
        FB.init({
            appId: '1559938820976000',
            version: 'v2.7' // or v2.1, v2.2, v2.3, ...
        });
    });
});
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
        console.log(user.providerData);
        $("#displayName").text(user.displayName);
        $("#photoURL").attr('src', user.photoURL).show();
        $("#nav-logout").show();
        $("#nav-login").hide();

        if (currentPost && currentPost.uid === user.uid) {
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
            n: user.displayName,
            u: user.photoURL/*,
            e: firebaseUser.email*/
        }).then(function (res) {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
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

$("#nav-login").on('click', function () {
    //$('.mdl-layout')[0].MaterialLayout.toggleDrawer();
    dialogLogin.showModal();
    pendingCred = null;
});
dialogLogin.querySelector('.close').addEventListener('click', function () {
    dialogLogin.close();
});
var providerName = {
    "password": "brugernavn og password",
    "facebook.com": "Facebook",
    "google.com": "Google+",
    "twitter.com": "Twitter"
}
var pendingCred;
var login = function (provider) {
    $('#error').hide();
    firebase.auth().signInWithPopup(provider).then(function (result) {
        if (pendingCred) {
            result.user.link(pendingCred).then(function () {
                pendingCred = null;
                // Twitter account successfully linked to the existing Firebase user.
                //goToApp();
            });
        }
        dialogLogin.close();

    }).catch(function (error) {
        console.log(error);
        // Handle Errors here.
        var errorCode = error.code;
        pendingCred = error.credential;
        if (error.code === 'auth/account-exists-with-different-credential') {

            firebase.auth().fetchProvidersForEmail(error.email).then(function (providers) {
                console.log(providers);
                if (providers[0] === 'google.com') {
                    $('#error').show();
                    $('#error').text('Du har tidligere logget ind med ' + providerName[providers[0]] + '. Hvis du fremover også vil bruge ' + providerName[provider.providerId] + ', så skal du først logge ind med ' + providerName[providers[0]] + ' for at tillade dette.');
                }
            });
        }
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
    });
}
$("#login-facebook").on('click', function () {
    var provider = new firebase.auth.FacebookAuthProvider();
    login(provider);
});
$("#login-twitter").on('click', function () {
    var provider = new firebase.auth.TwitterAuthProvider();
    login(provider);
});
$("#login-google").on('click', function () {
    var provider = new firebase.auth.GoogleAuthProvider();
    login(provider);
});

$('#share-fb').on('click', function () {
    FB.ui({
        method: 'share_open_graph',
        action_type: 'og.likes',
        action_properties: JSON.stringify({
            object: window.location.href
        })
    }, function (response) {
        // Debug response (optional)
        console.log(response);
    });
})