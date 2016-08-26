var fs = require('fs');
var Queue = require('firebase-queue');
var Twitter = require('twitter');
//var FB = require('fb');
var moment = require('moment');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec;
var gm = require('gm').subClass({ nativeAutoOrient: true });;
var request = require('request');
var firebase = require('firebase');
var config_twitter = require('./twitter.json');
//var config_twitter = require('./facebook.json');
var GeoFire = require('geofire');
var config = {
    databaseURL: "https://project-1805673855421320284.firebaseio.com",
    serviceAccount: "elsiwhere-31c60e1177d9.json",
    databaseAuthVariableOverride: {
        uid: "queue"
    }
};
var client = new Twitter(config_twitter);
var mkdir = function (p) {
    return new Promise(function (resolve, reject) {
        mkdirp(p, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
var getAccessToken = function () {
    return new Promise(function (resolve, reject) {
        FB.api('oauth/access_token', config_facebook, function (res) {
            if (!res || res.error) {
                reject(res);
            } else {
                resolve(res.access_token);
            }
        });
    });
};
var fb_post = function (url) {
    return getAccessToken().then(function (token) {
        return new Promise(function (resolve, reject) {
            FB.setAccessToken(token);
            FB.api('Elsiwhere/feed', 'post', { message: 'http://elsiwhere.addin.dk/' + url }, function (res) {
                if (!res || res.error) {
                    reject(res);
                }
                else {
                    resolve();
                }
            });
        });
    });
};

var tweet = function (url) {
    return new Promise(function (resolve, reject) {
        client.post('statuses/update', { status: 'http://elsiwhere.addin.dk/' + url }, function (err, tweet, response) {
            console.log(err, tweet, response)
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
firebase.initializeApp(config);
var gcloud = require('google-cloud')({
    projectId: 'project-1805673855421320284',
    // Specify a path to a keyfile.
    keyFilename: "elsiwhere-31c60e1177d9.json"
});
var gcs = gcloud.storage();
var geofire = new GeoFire(firebase.database().ref('geofire'));


var ref = firebase.database().ref('queue');
var options = {
    'sanitize': false
};

var crop = function (data, size) {
    var p = './assets/' + data.item + '/' + size;
    return mkdir(p).then(function () {
        return new Promise(function (resolve, reject) {
            gm('./assets/' + data.item + '/raw/' + data._id + '.jpg')
                .autoOrient()
                .resize(size, size, '^')
                .noProfile()
                .gravity('Center')
                .crop(size, size)
                .write(p + '/' + data._id + '.jpg', function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });
    });
};
var convert = function (data, size) {
    var p = './assets/' + data.item + '/' + size;
    return mkdir(p).then(function () {
        return new Promise(function (resolve, reject) {
            gm('./assets/' + data.item + '/raw/' + data._id + '.jpg')
                .autoOrient()
                .resize(size, size)
                .noProfile()
                .write(p + '/' + data._id + '.jpg', function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });
    });
};
var download = function (data) {
    var p = './assets/' + data.item + '/raw';
    return mkdir(p).then(function () {
        return new Promise(function (resolve, reject) {
            gcs.bucket('project-1805673855421320284.appspot.com').file(data.item + '/' + data._id).download({ destination: p + '/' + data._id + '.jpg' }, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }).then(function () {
        return convert(data, 1024);
    }).then(function () {
        return crop(data, 512);
    }).then(function () {
        return crop(data, 256);
    }).then(function () {
        return new Promise(function (resolve, reject) {
            gcs.bucket('project-1805673855421320284.appspot.com').file(data.item + '/' + data._id).delete(function (err, apiResponse) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
};
var removeFile = function (name) {
    return new Promise(function (resolve, reject) {
        fs.unlink(name, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

var removeImages = function (data) {
    return removeFile('./assets/' + data.item + '/raw/' + data._id + '.jpg').then(function () {
        return removeFile('./assets/' + data.item + '/1024/' + data._id + '.jpg')
    }).then(function () {
        return removeFile('./assets/' + data.item + '/512/' + data._id + '.jpg')
    }).then(function () {
        return removeFile('./assets/' + data.item + '/256/' + data._id + '.jpg')
    });;
};
var writeFile = function (p, name, content) {
    return mkdir(p).then(function () {
        return new Promise(function (resolve, reject) {
            fs.writeFile(p + '/' + name, content, function (err, success) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
};
var buildJekyll = function () {
    return new Promise(function (resolve, reject) {
        exec('jekyll build --incremental', function (err, stdout, stderr) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};
var categoryAdd = function (data) {
    var date = moment();
    return download(data).then(function () {
        var p = './_posts';
        var name = date.format('YYYY-MM-DD') + '-a' + data._id + '.md';
        var content = '---\nlayout: category\ntitle: ' + data.title + '\nimage: ' + data._id;
        content += '\ncategory: category';
        content += '\n---';
        content += '\n' + data.description;
        return writeFile(p, name, content);
    }).then(function () {
        return buildJekyll();
    }).then(function () {
        return firebase.database().ref('category').child(data._id).set({ t: data.title, d: data.description, ts: date.valueOf() });
    }).then(function () {
        return tweet('a' + data._id);
    });/*.then(function () {
        return fb_post('a' + data._id);
    });*/
};
var subcategoryAdd = function (data) {
    var date = moment();
    return download(data).then(function () {
        var p = './_posts';
        var name = date.format('YYYY-MM-DD') + '-b' + data._id + '.md';
        var content = '---\nlayout: ' + data.item + '\ntitle: ' + data.title + '\nimage: ' + data._id;
        content += '\ndate: ' + date.format('YYYY-MM-DD HH:mm:ss ZZ');
        content += '\ncategory: ' + data.category;
        content += '\n---';
        content += '\n' + data.description;
        return writeFile(p, name, content);
    }).then(function () {
        return buildJekyll();
    }).then(function () {
        return firebase.database().ref(data.item).child(data.category).child(data._id).set({ t: data.title, d: data.description, ts: date.valueOf() });
    }).then(function () {
        return tweet('b' + data._id);
    });/*.then(function () {
        return fb_post('b' + data._id);
    });*/
};
var postAdd = function (data) {
    var date = moment();
    return download(data).then(function () {
        return firebase.database().ref('users').child(data.uid).once('value');
    }).then(function (snapshot) {
        var user = snapshot.val();
        var p = './_posts';
        var name = date.format('YYYY-MM-DD') + '-c' + data._id + '.md';
        var content = '---\nlayout: ' + data.item + '\ntitle: ' + data.title + '\nimage: ' + data._id;
        content += '\nlatitude: ' + data.lat + '\nlongitude: ' + data.lng;
        content += '\ndate: ' + date.format('YYYY-MM-DD HH:mm:ss ZZ');
        content += '\ndisplayname: ' + user.n;
        content += '\nphotourl: ' + user.u;
        content += '\ncategory: ' + data.category;
        content += '\n---';
        content += '\n' + data.description;
        return writeFile(p, name, content);
    }).then(function () {
        return buildJekyll();
    }).then(function () {
        var doc = {
            t: data.title,
            d: data.description,
            c: data.category,
            lat: data.lat,
            lng: data.lng,
            uid: data.uid,
            ts: date.valueOf()
        };
        if (data.start) {
            doc.start = data.start;
        }
        if (data.slut) {
            doc.slut = data.slut;
        }
        return firebase.database().ref(data.item).child(data._id).set(doc);
    }).then(function () {
        return geofire.set(data._id, [data.lat, data.lng]);
    }).then(function () {
        return tweet('c' + data._id);
    });/*.then(function () {
        return fb_post('c' + data._id);
    });*//*.then(function () {
        return new Promise(function (resolve, reject) {
            request({
                method: 'PUT',
                uri: "https://api.mapbox.com/datasets/v1/runetvilum/cis8kq29x003s2pljfjbuieui/features/" + data._id + "?access_token=pk.eyJ1IjoicnVuZXR2aWx1bSIsImEiOiJkeUg2WVkwIn0.yoMmv3etOc40RXkPsebXSg",
                json: {
                    "id": data._id,
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [data.lng, data.lat]
                    },
                    "properties": {
                        "c": data.category
                    }
                }
            }, function (err, res) {
                console.log(err,res);
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
        });
    })*/
};

var categoryRemove = function (data) {
    return firebase.database().ref('subcategory').child(data._id).once('value').then(function (dataSnapshot) {
        var promises = [];
        var items = dataSnapshot.val();
        for (var key in items) {
            var doc = {
                _id: key,
                item: 'subcategory',
                category: data._id
            };
            promises.push(subcategoryRemove(doc));
        }
        return Promise.all(promises);
    }).then(function () {
        return removeImages(data);
    }).then(function () {
        return firebase.database().ref('category').child(data._id).once('value');
    }).then(function (snapshot) {
        var item = snapshot.val();
        return removeFile('./_posts/' + moment(item.ts).format('YYYY-MM-DD') + '-a' + data._id + '.md');
    }).then(function () {
        return buildJekyll();
    }).then(function () {
        return firebase.database().ref(data.item).child(data._id).remove();
    });
};
var subcategoryRemove = function (data) {
    return firebase.database().ref('post').orderByChild("c").equalTo(data._id).once('value').then(function (dataSnapshot) {
        var promises = [];
        var items = dataSnapshot.val();
        for (var key in items) {
            var doc = {
                _id: key,
                item: 'post',
                category: data._id
            };
            promises.push(postRemove(doc));
        }
        return Promise.all(promises);
    }).then(function () {
        return removeImages(data);
    }).then(function () {
        return firebase.database().ref(data.item).child(data.category).child(data._id).once('value');
    }).then(function (snapshot) {
        var item = snapshot.val();
        return removeFile('./_posts/' + moment(item.ts).format('YYYY-MM-DD') + '-b' + data._id + '.md');
    }).then(function () {
        return buildJekyll();
    }).then(function () {
        return firebase.database().ref(data.item).child(data.category).child(data._id).remove();
    });
};
var postRemove = function (data) {
    return removeImages(data).then(function () {
        return firebase.database().ref(data.item).child(data._id).once('value');
    }).then(function (snapshot) {
        var item = snapshot.val();
        return removeFile('./_posts/' + moment(item.ts).format('YYYY-MM-DD') + '-c' + data._id + '.md');
    }).then(function () {
        return buildJekyll();
    }).then(function () {
        return firebase.database().ref(data.item).child(data._id).remove();
    }).then(function () {
        return geofire.remove(data._id);
    });
};
var functions = {
    category: {
        add: categoryAdd,
        remove: categoryRemove
    },
    subcategory: {
        add: subcategoryAdd,
        remove: subcategoryRemove
    },
    post: {
        add: postAdd,
        remove: postRemove
    }
};
var queue = new Queue(ref, options, function (data, progress, resolve, reject) {
    functions[data.item][data.action](data).then(function () {
        console.log(data);
        resolve();
    }).catch(function (err) {
        console.log(err);
        reject(err);
    });
});