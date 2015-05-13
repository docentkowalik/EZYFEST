var ObjectId = require('mongodb').ObjectID;

exports.index = function(req, res) {
    var msgValue = req.session.reqMsg ? req.session.reqMsg : "Fill in the form below to get instant access:"; //message variable that holds the string of sessions

    var topBar;

    if (req.session.fest_id) {
        topBar = "render";
    } else {
        topBar = "notrender";

    }
    res.render('landing_business', {
        barState: topBar,
        msg: msgValue
    });
};

exports.ezyfestivals = function(req, res) {
    var db = req.app.settings.db;

    db.collection('festivalwebsite', function(err, allFestivalsList) {
        if (err) {
            throw err;
        }

        allFestivalsList.find().toArray(function(err, allFests) {
            if (err) {
                throw err
            };
            res.render('ezyfestivals', {
                festivals: allFests
            });
        });
    });
};


exports.admin = function(req, res) {
    var db = req.app.settings.db;

    var ownerName = req.session.email;

    console.log(req.session.fest_id);
    var festivalId = new ObjectId(req.session.fest_id);

    db.collection('festivalwebsite', function(err, listsColl) {

        if (err) {
            throw err;
        }

        listsColl.find({
            _id: festivalId
        }).toArray(function(err, festivalsArr) {
            if (err) {
                throw err
            };

            req.session.FESTIVALTTLE = festivalsArr[0].festival_title;
            req.session.FESTIVALURL = festivalsArr[0].festival_url;
            var festival_site_name = req.session.FESTIVALTTLE;
            var festival_site_URL = req.session.FESTIVALURL;

            req.session.festivalUserArray = festivalsArr;

            var userFestival = req.session.festivalUserArray;
            console.log(festival_site_URL);

            db.collection('post_comments', function(err, commentsColl) {
                if (err) {
                    throw err;
                }

                commentsColl.find({
                    released: false
                }).toArray(function(err, commentsArr) {
                    if (err) {
                        throw err
                    };
                    res.render('dashboard', {
                        festival: festivalsArr,
                        site_title: festival_site_name,
                        site_URL: festival_site_URL,
                        username: req.session.username,
                        comments: commentsArr,
                        user: userFestival,
                        first: req.session.firstname,
                        last: req.session.lastname
                    });
                });
            });
        });
    });
};

exports.processLogo = function(req, res) {
    var db = req.app.settings.db;

    var cloudinary = require('cloudinary');

    var logo = req.files.logo_image;



    var festivalObjectID = new ObjectId(req.session.fest_id);

    var imgPATH = logo.path;
    var imgNAME = logo.originalFilename;


    if (imgNAME == "") {
        console.log("no IMAGE");

        db.collection('festivalwebsite', function(err, festivalCollection) {

            festivalCollection.update({
                _id: festivalObjectID
            }, {
                $set: {
                    logo: null
                }
            }, function(err, result) {
                if (err) throw err;

                res.redirect('/admin');
            });
        });
    } else {

        cloudinary.uploader.upload(logo.path, function(result) {

                if (result.url) {

                    var urlIMG = result.url;

                    db.collection('festivalwebsite', function(err, festivalCollection) {

                        festivalCollection.update({
                            _id: festivalObjectID
                        }, {
                            $set: {
                                logo: urlIMG
                            }
                        }, function(err, result) {
                            if (err) throw err;

                            res.redirect('/admin');
                        });
                    });

                } else {
                    /*
                     * There was an error and the file did not upload.
                     */

                    console.log('Error uploading to cloudinary: ', result);
                    res.send('did not get url');
                }
            },

            {
                width: 160,
                height: 50,
                crop: "limit"
            }
        );
    }

};



exports.processRegister = function(req, res) {
    // function for the registratin of the user
    var db = req.app.settings.db;

    var site_title_post = req.param('title');
    var site_site_url = req.param('url');
    var first_name_post = req.param('first');
    var last_name_post = req.param('last');
    var username_post = req.param('username');
    var user_email_post = req.param('emailAdd');
    var user_password_post = req.param('password');
    var role = 'administrator';


    db.collection('festivalwebsite', function(err, listsColl) {
        // Getting the collection called 'lists' from the database
        if (err) {
            throw err;
        }

        listsColl.find({
            user_email: user_email_post
        }).toArray(function(err, festivalsArr) {
            if (err) {
                throw err
            };
            var festival_site_name = festivalsArr;
            console.log(festival_site_name.length);

            if (festival_site_name.length == 0) {
                var URLpath = site_site_url.replace(/\s+/g, '-').toLowerCase();

                db.collection('festivalwebsite', function(err, collectionFest) {

                    var newFestivalRegistered = {
                        festival_title: site_title_post,
                        festival_url: URLpath,
                        user_first_name: first_name_post,
                        user_last_name: last_name_post,
                        user_username: username_post,
                        user_email: user_email_post,
                        user_password: user_password_post,
                        logo: null,
                        user_role: role
                    };

                    collectionFest.insert(newFestivalRegistered, {
                        w: 1
                    }, function(err, result) {
                        if (err) throw err;



                        console.log("Registered Festival: ", result);
                        res.redirect('/login');
                    });
                });


            } else {


                console.log("festival bum");
                var value = "Sorry. This email is already taken..."; //if nothing has been entered in the login form redirect back to the login page and send
                res.render('landing_business', {
                    msg: value
                }); //a message that both fields are reqired in order to log in
            }

        });
    });
};

exports.login = function(req, res) {
    var msgValue = req.session.loginMsg ? req.session.loginMsg : "please sign in "; //message variable that holds the string of sessions

    res.render('login', {
        msg: msgValue
    }); // which are storing the messages from the processLogin function 
};

exports.processLogin = function(req, res) {
    var db = req.app.settings.db;
    var fest_email = req.param('festival_Email');
    var fest_password = req.param('festival_Password');

    if (fest_email || fest_password) {

        db.collection('festivalwebsite', function(err, checkAdmins) {
            if (err) throw err;
            checkAdmins.find({
                user_email: fest_email
            }).toArray(function(err, adminsArr) {

                if (adminsArr.length == 1) {
                    loginAdmin();
                } else {

                    db.collection('users', function(err, checkUsers) {
                        if (err) throw err;
                        checkUsers.find({
                            sub_user_email: fest_email
                        }).toArray(function(err, userArr) {

                            if (userArr.length == 1) {
                                loginUser();

                            } else {
                                req.session.loginMsg = "Sorry, User was not found";
                                res.redirect('/login');
                            }
                        });
                    });
                }
            });
        });

        function loginAdmin() {
            db.collection('festivalwebsite', function(err, collection) {
                if (err) throw err;

                collection.find({
                    user_email: fest_email
                }).toArray(function(err, adminsCollection) {
                    if (err) throw err;

                    if (adminsCollection.length == 0) { //if the array is empty and the user hasn't been found redirect to the login page and send a message about it
                        req.session.loginMsg = "Sorry, User was not found";
                        res.redirect('/login');
                    } else {
                        if (adminsCollection[0].user_password == fest_password) { //if the array is not empty get the value of password and compare it with the password value entered in the 
                            var ownerName = req.session.email = fest_email; //with the password value entered in the  login password field and if they match redirect to the dashboard
                            req.session.fest_id = adminsCollection[0]._id;

                            req.session.firstname = adminsCollection[0].user_first_name;
                            req.session.lastname = adminsCollection[0].user_last_name;
                            req.session.username = adminsCollection[0].user_username;


                            res.redirect('/admin');
                            console.log("Logged in as:", req.session.username);
                        } else {
                            req.session.loginMsg = "Sorry, Wrong password"; //but if the values don't match redirect back to the login page and send 
                            res.redirect('/login'); //a message password doesn't match
                        }
                    }
                });
            });
        }

        function loginUser() {

            db.collection('users', function(err, collection) {
                if (err) throw err;

                collection.find({
                    sub_user_email: fest_email
                }).toArray(function(err, usersCollection) {
                    if (err) throw err;

                    if (usersCollection.length == 0) { //if the array is empty and the user hasn't been found redirect to the login page and send a message about it
                        req.session.loginMsg = "Sorry, User was not found";
                        res.redirect('/login');
                    } else {
                        if (usersCollection[0].sub_user_password == fest_password) { //if the array is not empty get the value of password and compare it with the password value entered in the 
                            var ownerName = req.session.email = fest_email; //with the password value entered in the  login password field and if they match redirect to the dashboard

                            req.session.firstname = usersCollection[0].sub_user_firstname;
                            req.session.lastname = usersCollection[0].sub_user_lastname;
                            req.session.username = usersCollection[0].sub_user_username;

                            req.session.fest_id = usersCollection[0].parent_fest_id;
                            console.log(req.session.fest_id);

                            res.redirect('/admin');
                            console.log("Logged in as:", ownerName);
                        } else {
                            req.session.loginMsg = "Sorry, Wrong password"; //but if the values don't match redirect back to the login page and send 
                            res.redirect('/login'); //a message password doesn't match
                        }
                    }
                });
            });
        }
    } else {
        req.session.loginMsg = "Both fields are required"; //if nothing has been entered in the login form redirect back to the login page and send
        res.redirect('/login'); //a message that both fields are reqired in order to log in
    }
};

exports.logoutFestival = function(req, res) {
    if (req.session.email) { //check if the session for the user eqists
        delete req.session.email; //if it does exists delete it and render login page
    } //then authorisation middleware will prevent the users form going to the restricted pages again
    console.log("User Logged Out");
    res.redirect('/login');
};

exports.all_pages = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;

    db.collection('pages', function(err, pagesList) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(req.session.fest_id);
        console.log(festival_id);
        pagesList.find({
            parent_fest_id: festival_id
        }).sort('_id', 'desc').toArray(function(err, pagesListArr) {
            console.log(pagesListArr.page_title);
            if (err) {
                throw err
            };

            res.render('all_pages', {
                objs: pagesListArr,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.new_page = function(req, res) {
    res.render('new_page', {
        first: req.session.firstname,
        last: req.session.lastname
    });
};

exports.processNewPage = function(req, res) {
    var db = req.app.settings.db;

    var fest_page_tile = req.param('page_title');
    var fest_page_shortcodes = req.param('shortcode');
    var fest_page_status = 'published';
    var fest_page_author = req.session.username;

    var currentTime = new Date(); //creating new date variable
    var month = currentTime.getMonth() + 1; //getting the current month
    var day = currentTime.getDate(); //getting the current day
    var year = currentTime.getFullYear(); //getting the current year
    var date_published = (day + "/" + month + "/" + year); //creating a daye string and storing it in the time variable
    var fest_page_date = date_published;

    var page_slug = fest_page_tile.replace(/[`~!@#$%^&*()_|+\=?;:'",.<>\{\}\[\]\\\/]/gi, '').toLowerCase();

    var festivalObjectID = new ObjectId(req.session.fest_id);

    db.collection('pages', function(err, pagesCollection) {

        var newPage = {
            parent_fest_id: festivalObjectID,
            page_title: fest_page_tile,
            page_slug: page_slug,
            page_shortcodes: fest_page_shortcodes,
            page_status: fest_page_status,
            page_author: fest_page_author,
            page_date: fest_page_date
        };

        if (err) throw exception;

        pagesCollection.insert(newPage, {
            w: 1
        }, function(err, publishedPage) {
            if (err) throw err;

            console.log("Page Published: ", publishedPage);

            res.redirect('/all_pages');
        });
    });
};

exports.edit_page = function(req, res) {
    var db = req.app.settings.db;
    var page_id = req.param('page_id');
    var pageObjectID = new ObjectId(page_id); //id of the current item

    var festivalRoute = req.session.FESTIVALURL;
    db.collection('pages', function(err, editPages) {
        if (err) {
            throw err;
        }

        editPages.find({
            _id: pageObjectID
        }).toArray(function(err, editedPage) {
            if (err) {
                throw err
            };

            res.render('edit_page', {
                result: editedPage,
                festivalURL: festivalRoute,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.processEditPage = function(req, res) {

    var db = req.app.settings.db;
    var update_page_id = req.param('page_id');
    var update_page_title = req.param('page_title_update');
    var update_page_shortcodes = req.param('shortcode');

    var editPageID = new ObjectId(update_page_id); //id of the current item

    console.log(editPageID);

    db.collection('pages', function(err, pagesCollection) {
        pagesCollection.update({
            _id: editPageID
        }, {
            $set: {
                page_title: update_page_title,
                page_shortcodes: update_page_shortcodes
            }
        }, function(err, result) {
            if (err) throw err;

            res.redirect('/edit_page?page_id=' + editPageID);
        });
    });
};

exports.social_links = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;
    var viewData;
    var festival_site_name = req.session.FESTIVALTTLE;


    db.collection('social_links', function(err, pagesList) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(req.session.fest_id);
        console.log(festival_id);
        pagesList.find({
            parent_fest_id: festival_id
        }).toArray(function(err, pagesListArr) {
            if (err) {
                throw err
            };
            if (pagesListArr.length == 0) {
                viewData = "no";
            } else {
                viewData = "yes";
            }
            console.log(pagesListArr);

            res.render('social_links', {
                socialLinks: pagesListArr,
                view: viewData,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};
exports.processSocialLinks = function(req, res) {
    var db = req.app.settings.db;

    var facebook = req.param('facebook');
    var twitter = req.param('twitter');
    var google = req.param('google');
    var youtube = req.param('youtube');
    var instagram = req.param('instagram');
    var flickr = req.param('flickr');

    var validfacebook = facebook.replace('https://', '');
    var validtwitter = twitter.replace('https://', '');
    var validgoogle = google.replace('https://', '');
    var validyoutube = youtube.replace('https://', '');
    var validinstagram = instagram.replace('https://', '');
    var validflickr = flickr.replace('https://', '');



    var festivalObjectID = new ObjectId(req.session.fest_id);

    db.collection('social_links', function(err, pagesCollection) {
        pagesCollection.find({
            parent_fest_id: festivalObjectID
        }).toArray(function(err, socialCheckArr) {

            if (socialCheckArr.length == 0) {

                var newLinkks = {
                    parent_fest_id: festivalObjectID,
                    facebook: validfacebook,
                    twitter: validtwitter,
                    google: validgoogle,
                    youtube: validyoutube,
                    instagram: validinstagram,
                    flickr: validflickr,
                    collection: "social-links"
                };

                if (err) throw exception;

                pagesCollection.insert(newLinkks, {
                    w: 1
                }, function(err, publishedPage) {
                    if (err) throw err;

                    console.log("newLinkks: ", publishedPage);

                    res.redirect('/social_links');
                });
            } else {
                pagesCollection.update({
                    parent_fest_id: festivalObjectID
                }, {
                    $set: {
                        facebook: validfacebook,
                        twitter: validtwitter,
                        google: validgoogle,
                        youtube: validyoutube,
                        instagram: validinstagram,
                        flickr: validflickr

                    }
                }, function(err, publishedPage) {
                    if (err) throw err;

                    res.redirect('/social_links');
                });
            }
        });
    });
};
exports.fest_programme = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;
    var festival_site_name = req.session.FESTIVALTTLE;


    db.collection('programme_day', function(err, pagesList) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(req.session.fest_id);
        console.log(festival_id);
        pagesList.find({
            parent_fest_id: festival_id
        }).toArray(function(err, pagesListArr) {
            console.log(pagesListArr.page_title);
            if (err) {
                throw err
            };

            res.render('fest_programme', {
                programmeDays: pagesListArr,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};
exports.new_programme_day = function(req, res) {
    res.render('new_programme_day', {
        first: req.session.firstname,
        last: req.session.lastname
    });
};
exports.processNewProgrammeDay = function(req, res) {
    var db = req.app.settings.db;

    var programmeDate = req.param('datePickerR');


    var arr = programmeDate.split("-");

    var dayList = arr[2];



    var festivalObjectID = new ObjectId(req.session.fest_id);

    db.collection('programme_day', function(err, pagesCollection) {

        pagesCollection.find({
            parent_fest_id: festivalObjectID
        }).toArray(function(err, progCheckArr) {

            if (progCheckArr.length == 0) {


                var newProgrammeDay = {
                    parent_fest_id: festivalObjectID,
                    programme_date: programmeDate,
                    event_event: null,
                    event_artist_name: null,
                    event_venue: null,
                    event_time_start: null,
                    event_time_end: null,
                    event_day: dayList,
                    collection: "programme"
                };

                if (err) throw exception;

                pagesCollection.insert(newProgrammeDay, function(err, insertProgramme) {
                    if (err) throw err;

                    console.log(insertProgramme[0]._id);

                    var renderID = insertProgramme[0]._id;
                    res.redirect('/programme_day_schedule?dayID=' + renderID);
                });
            } else {

                var newProgrammeDay = {
                    parent_fest_id: festivalObjectID,
                    programme_date: programmeDate,
                    event_event: null,
                    event_artist_name: null,
                    event_venue: null,
                    event_time_start: null,
                    event_time_end: null,
                    event_day: dayList
                };

                if (err) throw exception;

                pagesCollection.insert(newProgrammeDay, function(err, insertProgramme) {
                    if (err) throw err;

                    console.log(insertProgramme[0]._id);

                    var renderID = insertProgramme[0]._id;
                    res.redirect('/programme_day_schedule?dayID=' + renderID);
                });
            }
        });
    });
};


exports.programme_day_schedule = function(req, res) {
    var programme_day_id = req.param('dayID');

    res.render('programme_day_schedule', {
        dayID: programme_day_id,
        first: req.session.firstname,
        last: req.session.lastname
    });
};

exports.processDayEvent = function(req, res) {
    var db = req.app.settings.db;

    var day_event_event = req.param('event');
    var day_event_artist = req.param('artist');
    var day_event_venue = req.param('venue');
    var day_event_timeFrom = req.param('timeFrom')
    var day_event_timeTo = req.param('timeTo');
    var day_event_dayID = req.param('dayID');

    var eventObjectID = new ObjectId(day_event_dayID);

    db.collection('programme_day', function(err, pagesCollection) {
        pagesCollection.update({
            _id: eventObjectID
        }, {
            $set: {
                event_event: day_event_event,
                event_artist_name: day_event_artist,
                event_venue: day_event_venue,
                event_time_start: day_event_timeFrom,
                event_time_end: day_event_timeTo

            }
        }, function(err, publishedPage) {
            if (err) throw err;

            res.redirect('/fest_programme');
        });
    });
};


exports.fest_lineup = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;
    var festival_site_name = req.session.FESTIVALTTLE;

    db.collection('lineup', function(err, pagesList) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(req.session.fest_id);
        console.log(festival_id);
        pagesList.find({
            parent_fest_id: festival_id
        }).toArray(function(err, pagesListArr) {
            console.log(pagesListArr.page_title);
            if (err) {
                throw err
            };

            res.render('fest_lineup', {
                festLineUps: pagesListArr,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};


exports.new_line_up = function(req, res) {
    var festival_site_name = req.session.FESTIVALTTLE;

    res.render('new_line_up', {
        site: festival_site_name,
        first: req.session.firstname,
        last: req.session.lastname
    });
};

exports.processNewLineUp = function(req, res) {
    var db = req.app.settings.db;

    var cloudinary = require('cloudinary');



    var lineup_artist_img = req.files.lineup_artist_img;
    var lineup_artist_name = req.param('lineup_artist_name');
    var lineup_venue = req.param('lineup_venue');

    var lineup_facebook_link = req.param('lineup_facebook_link');
    var lineup_twitter_link = req.param('lineup_twitter_link');
    var lineup_google_link = req.param('lineup_google_link');
    var lineup_youtube_link = req.param('lineup_youtube_link');

    var validfacebook = lineup_facebook_link.replace('https://', '');
    var validtwitter = lineup_twitter_link.replace('https://', '');
    var validgoogle = lineup_google_link.replace('https://', '');
    var validyoutube = lineup_youtube_link.replace('https://', '');


    var festivalObjectID = new ObjectId(req.session.fest_id);

    var imgPATH = lineup_artist_img.path;
    var imgNAME = lineup_artist_img.originalFilename;


    if (imgNAME == "") {
        console.log("no IMAGE");

        db.collection('lineup', function(err, pagesCollection) {
            pagesCollection.find({
                parent_fest_id: festivalObjectID
            }).toArray(function(err, lineupCheckArr) {

                if (lineupCheckArr.length == 0) {

                    var newLineUp = {
                        parent_fest_id: festivalObjectID,
                        lineup_artist_img: null,
                        lineup_artist_name: lineup_artist_name,
                        lineup_venue: lineup_venue,

                        lineup_facebook_link: validfacebook,
                        lineup_twitter_link: validtwitter,
                        lineup_google_link: validgoogle,
                        lineup_youtube_link: validyoutube,
                        collection: "line-up"
                    };

                    if (err) throw exception;

                    pagesCollection.insert(newLineUp, {
                        w: 1
                    }, function(err, sponsorsArr) {
                        if (err) throw err;

                        console.log("fest_lineup: ", sponsorsArr);
                        res.redirect('/fest_lineup');
                    });
                } else {

                    var newLineUp = {
                        parent_fest_id: festivalObjectID,
                        lineup_artist_img: null,
                        lineup_artist_name: lineup_artist_name,
                        lineup_venue: lineup_venue,

                        lineup_facebook_link: validfacebook,
                        lineup_twitter_link: validtwitter,
                        lineup_google_link: validgoogle,
                        lineup_youtube_link: validyoutube
                    };

                    if (err) throw exception;

                    pagesCollection.insert(newLineUp, {
                        w: 1
                    }, function(err, sponsorsArr) {
                        if (err) throw err;

                        console.log("fest_lineup: ", sponsorsArr);
                        res.redirect('/fest_lineup');
                    });
                }
            });
        });
    } else {




        cloudinary.uploader.upload(lineup_artist_img.path, function(result) {

                if (result.url) {

                    var urlIMG = result.url;

                    db.collection('lineup', function(err, pagesCollection) {
                        pagesCollection.find({
                            parent_fest_id: festivalObjectID
                        }).toArray(function(err, lineupCheckArr) {

                            if (lineupCheckArr.length == 0) {

                                var newLineUp = {
                                    parent_fest_id: festivalObjectID,
                                    lineup_artist_img: urlIMG,
                                    lineup_artist_name: lineup_artist_name,
                                    lineup_venue: lineup_venue,

                                    lineup_facebook_link: validfacebook,
                                    lineup_twitter_link: validtwitter,
                                    lineup_google_link: validgoogle,
                                    lineup_youtube_link: validyoutube,
                                    collection: "line-up"
                                };

                                if (err) throw exception;

                                pagesCollection.insert(newLineUp, {
                                    w: 1
                                }, function(err, sponsorsArr) {
                                    if (err) throw err;

                                    console.log("fest_lineup: ", sponsorsArr);
                                    res.redirect('/fest_lineup');
                                });
                            } else {

                                var newLineUp = {
                                    parent_fest_id: festivalObjectID,
                                    lineup_artist_img: urlIMG,
                                    lineup_artist_name: lineup_artist_name,
                                    lineup_venue: lineup_venue,

                                    lineup_facebook_link: validfacebook,
                                    lineup_twitter_link: validtwitter,
                                    lineup_google_link: validgoogle,
                                    lineup_youtube_link: validyoutube
                                };

                                if (err) throw exception;

                                pagesCollection.insert(newLineUp, {
                                    w: 1
                                }, function(err, sponsorsArr) {
                                    if (err) throw err;

                                    console.log("fest_lineup: ", sponsorsArr);
                                    res.redirect('/fest_lineup');
                                });
                            }
                        });
                    });
                } else {
                    /*
                     * There was an error and the file did not upload.
                     */

                    console.log('Error uploading to cloudinary: ', result);
                    res.send('did not get url');
                }
            },

            {
                width: 200,
                height: 200,
                crop: "fill",
                radius: "max"
            }
        );
    }

};

exports.edit_lineup = function(req, res) {
    var db = req.app.settings.db;
    var page_id = req.param('page_id');
    var pageObjectID = new ObjectId(page_id); //id of the current item
    var festival_site_name = req.session.FESTIVALTTLE;


    db.collection('lineup', function(err, editLineup) {
        if (err) {
            throw err;
        }

        editLineup.find({
            _id: pageObjectID
        }).toArray(function(err, editedLineup) {
            if (err) {
                throw err
            };

            res.render('edit_lineup', {
                result: editedLineup,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.processEdit_lineup = function(req, res) {
    var db = req.app.settings.db;

    var cloudinary = require('cloudinary');



    var lineup_artist_img = req.files.lineup_artist_img;
    var lineup_artist_name = req.param('lineup_artist_name');
    var lineup_venue = req.param('lineup_venue');

    var lineup_facebook_link = req.param('lineup_facebook_link');
    var lineup_twitter_link = req.param('lineup_twitter_link');
    var lineup_google_link = req.param('lineup_google_link');
    var lineup_youtube_link = req.param('lineup_youtube_link');


    var validfacebook = lineup_facebook_link.replace('https://', '');
    var validtwitter = lineup_twitter_link.replace('https://', '');
    var validgoogle = lineup_google_link.replace('https://', '');
    var validyoutube = lineup_youtube_link.replace('https://', '');

    var update_lineUP_id = req.param('page_id');

    console.log(update_lineUP_id);

    var lineUp_ID = new ObjectId(update_lineUP_id);

    var imgPATH = lineup_artist_img.path;
    var imgNAME = lineup_artist_img.originalFilename;


    if (imgNAME == "") {
        console.log("no IMAGE");

        db.collection('lineup', function(err, pagesCollection) {
            pagesCollection.update({
                _id: lineUp_ID
            }, {
                $set: {
                    lineup_artist_name: lineup_artist_name,
                    lineup_venue: lineup_venue,

                    lineup_facebook_link: validfacebook,
                    lineup_twitter_link: validtwitter,
                    lineup_google_link: validgoogle,
                    lineup_youtube_link: validyoutube

                }
            }, function(err, result) {
                if (err) throw err;

                res.redirect('/fest_lineup');
            });
        });
    } else {
        cloudinary.uploader.upload(lineup_artist_img.path, function(result) {

                if (result.url) {

                    var urlIMG = result.url;

                    db.collection('lineup', function(err, pagesCollection) {

                        pagesCollection.update({
                            _id: lineUp_ID
                        }, {
                            $set: {
                                lineup_artist_img: urlIMG,
                                lineup_artist_name: lineup_artist_name,
                                lineup_venue: lineup_venue,

                                lineup_facebook_link: validfacebook,
                                lineup_twitter_link: validtwitter,
                                lineup_google_link: validgoogle,
                                lineup_youtube_link: validyoutube

                            }
                        }, function(err, result) {
                            if (err) throw err;

                            res.redirect('/fest_lineup');
                        });

                    });

                } else {
                    /*
                     * There was an error and the file did not upload.
                     */
                    console.log('Error uploading to cloudinary: ', result);
                    res.send('did not get url');
                }
            },

            {
                width: 200,
                height: 200,
                crop: "fill",
                radius: "max"
            }
        );
    }

};


exports.fest_sponsors = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;
    var festival_site_name = req.session.FESTIVALTTLE;

    db.collection('sponsors', function(err, pagesList) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(req.session.fest_id);
        console.log(festival_id);
        pagesList.find({
            parent_fest_id: festival_id
        }).toArray(function(err, pagesListArr) {
            console.log(pagesListArr.page_title);
            if (err) {
                throw err
            };

            res.render('fest_sponsors', {
                festSponsors: pagesListArr,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.new_sponsor = function(req, res) {
    var festival_site_name = req.session.FESTIVALTTLE;

    res.render('new_sponsor', {
        site: festival_site_name,
        first: req.session.firstname,
        last: req.session.lastname
    });
};

exports.processNewSponsor = function(req, res) {
    var db = req.app.settings.db;
    var cloudinary = require('cloudinary');

    var festival_site_name = req.session.FESTIVALTTLE;


    var festivalObjectID = new ObjectId(req.session.fest_id);


    var img = req.files.sponsor_image;
    var sName = req.param('sponsor_name');
    var sLink = req.param('sponsor_link');

    var validLink = sLink.replace('https://', '');


    var imgNAME = img.originalFilename;

    cloudinary.uploader.upload(img.path, function(result) {

            if (result.url) {

                var urlIMG = result.url;

                db.collection('sponsors', function(err, pagesCollection) {
                    pagesCollection.find({
                        parent_fest_id: festivalObjectID
                    }).toArray(function(err, lineupCheckArr) {

                        if (lineupCheckArr.length == 0) {

                            var newSponsor = {
                                parent_fest_id: festivalObjectID,
                                sponsor_name: sName,
                                sponsor_link: validLink,
                                sponsor_img: urlIMG,
                                collection: "sponsors"
                            };

                            if (err) throw exception;

                            pagesCollection.insert(newSponsor, {
                                w: 1
                            }, function(err, sponsorsArr) {
                                if (err) throw err;

                                console.log("fest_sponsors: ", sponsorsArr);
                                res.redirect('/fest_sponsors');
                            });
                        } else {

                            var newSponsor = {
                                parent_fest_id: festivalObjectID,
                                sponsor_name: sName,
                                sponsor_link: validLink,
                                sponsor_img: urlIMG,
                            };

                            if (err) throw exception;

                            pagesCollection.insert(newSponsor, {
                                w: 1
                            }, function(err, sponsorsArr) {
                                if (err) throw err;

                                console.log("fest_sponsors: ", sponsorsArr);
                                res.redirect('/fest_sponsors');
                            });
                        }
                    });
                });
            } else {
                /*
                 * There was an error and the file did not upload.
                 */

                console.log('Error uploading to cloudinary: ', result);
                res.render('new_sponsor', {
                    site: festival_site_name,
                    first: req.session.firstname,
                    last: req.session.lastname
                });
            }
        },

        {
            width: 120,
            height: 65,
            crop: "limit"
        }
    );



};

exports.edit_sponsor = function(req, res) {
    var db = req.app.settings.db;
    var sponsor_id = req.param('sponsor_id');
    var pageObjectID = new ObjectId(sponsor_id); //id of the current item
    var renderIMG;
    var festival_site_name = req.session.FESTIVALTTLE;

    db.collection('sponsors', function(err, editSponsor) {
        if (err) {
            throw err;
        }

        editSponsor.find({
            _id: pageObjectID
        }).toArray(function(err, editedSponsor) {
            if (err) {
                throw err
            };

            if (editedSponsor[0].sponsor_img == null) {
                renderIMG = "false";
            } else {
                renderIMG = "true";
            }
            console.log(renderIMG);

            res.render('edit_sponsor', {
                result: editedSponsor,
                render: renderIMG,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};


exports.processEdit_sponsor = function(req, res) {
    var db = req.app.settings.db;

    var cloudinary = require('cloudinary');



    var img_SPONSOR = req.files.sponsor_image;
    var sName = req.param('sponsor_name');
    var sLink = req.param('sponsor_link');

    var update_lineUP_id = req.param('sponsor_id');

    console.log(update_lineUP_id);

    var lineUp_ID = new ObjectId(update_lineUP_id);

    var imgPATH = img_SPONSOR.path;
    var imgNAME = img_SPONSOR.originalFilename;


    if (imgNAME == "") {
        console.log("no IMAGE");

        db.collection('sponsors', function(err, sponsCollection) {
            sponsCollection.update({
                _id: lineUp_ID
            }, {
                $set: {
                    sponsor_name: sName,
                    sponsor_link: sLink
                }
            }, function(err, result) {
                if (err) throw err;
                console.log(result);

                res.redirect('/fest_sponsors');
            });
        });
    } else {
        cloudinary.uploader.upload(img_SPONSOR.path, function(result) {

                if (result.url) {

                    var urlIMG = result.url;

                    db.collection('sponsors', function(err, sponsCollection) {

                        sponsCollection.update({
                            _id: lineUp_ID
                        }, {
                            $set: {
                                sponsor_name: sName,
                                sponsor_link: sLink,
                                sponsor_img: urlIMG

                            }
                        }, function(err, result) {
                            if (err) throw err;

                            res.redirect('/fest_sponsors');
                        });

                    });

                } else {
                    /*
                     * There was an error and the file did not upload.
                     */
                    console.log('Error uploading to cloudinary: ', result);
                    res.send('did not get url');
                }
            },

            {
                width: 120,
                height: 65,
                crop: "limit"
            }
        );
    }

};



exports.fest_blog = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;

    var festival_site_name = req.session.FESTIVALTTLE;


    db.collection('posts', function(err, pagesList) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(req.session.fest_id);
        console.log(festival_id);
        pagesList.find({
            parent_fest_id: festival_id
        }).sort('_id', 'desc').toArray(function(err, pagesListArr) {
            console.log(pagesListArr.page_title);
            if (err) {
                throw err
            };

            res.render('fest_blog', {
                posts: pagesListArr,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.add_post = function(req, res) {
    var festival_site_name = req.session.FESTIVALTTLE;

    res.render('add_post', {
        site: festival_site_name,
        first: req.session.firstname,
        last: req.session.lastname
    });
};

exports.processNewPost = function(req, res) {
    var db = req.app.settings.db;

    var post_title = req.param('post_title');
    var post_content = req.param('editor-post');
    var post_status = 'published';
    var post_tags = req.param('tags');
    var post_tags_array = post_tags.split(",");
    console.log(post_tags_array);

    var post_author = req.session.username;

    var currentTime = new Date(); //creating new date variable
    var month = currentTime.getMonth() + 1; //getting the current month
    var day = currentTime.getDate(); //getting the current day
    var year = currentTime.getFullYear(); //getting the current year
    var date_published = (day + "/" + month + "/" + year); //creating a daye string and storing it in the time variable
    var post_date = date_published;

    var festivalObjectID = new ObjectId(req.session.fest_id);

    db.collection('posts', function(err, pagesCollection) {
        pagesCollection.find({
            parent_fest_id: festivalObjectID
        }).toArray(function(err, blogCheckArr) {

            if (blogCheckArr.length == 0) {

                var newPost = {
                    parent_fest_id: festivalObjectID,
                    post_title: post_title,
                    post_content: post_content,
                    post_status: post_status,
                    post_tags: post_tags_array,
                    post_author: post_author,
                    post_date: post_date,
                    collection: "blog"
                };

                if (err) throw exception;

                pagesCollection.insert(newPost, {
                    w: 1
                }, function(err, publishedPage) {
                    if (err) throw err;

                    console.log("Post: ", publishedPage);

                    res.redirect('/fest_blog');
                });
            } else {
                var newPostAdd = {
                    parent_fest_id: festivalObjectID,
                    post_title: post_title,
                    post_content: post_content,
                    post_status: post_status,
                    post_tags: post_tags_array,
                    post_author: post_author,
                    post_date: post_date
                };

                if (err) throw exception;

                pagesCollection.insert(newPostAdd, {
                    w: 1
                }, function(err, publishedPage) {
                    if (err) throw err;

                    console.log("Post: ", publishedPage);
                    res.redirect('/fest_blog');
                });
            }

        });
    });
};

exports.edit_post = function(req, res) {
    var db = req.app.settings.db;
    var post_id = req.param('postID');
    var postObjectID = new ObjectId(post_id); //id of the current item
    var festival_site_name = req.session.FESTIVALTTLE;

    db.collection('posts', function(err, editPages) {
        if (err) {
            throw err;
        }

        editPages.find({
            _id: postObjectID
        }).toArray(function(err, editedPost) {
            if (err) {
                throw err
            };

            res.render('edit_post', {
                editPosts: editedPost,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname

            });
        });
    });
};

exports.processEditPost = function(req, res) {

    var db = req.app.settings.db;
    var update_post_id = req.param('postID');
    var update_post_title = req.param('post-title-edit');
    var update_post_content = req.param('editor-post-edit');
    var update_post_tags = req.param('tags');

    var editPostID = new ObjectId(update_post_id); //id of the current item

    var currentTime = new Date(); //creating new date variable
    var month = currentTime.getMonth() + 1; //getting the current month
    var day = currentTime.getDate(); //getting the current day
    var year = currentTime.getFullYear(); //getting the current year
    var date_published = (day + "/" + month + "/" + year); //creating a daye string and storing it in the time variable
    var post_date = date_published;


    db.collection('posts', function(err, postsCollection) {

        postsCollection.find({
            collection: "blog"
        }).toArray(function(err, blogCheckArr) {

            if (blogCheckArr.length == 1) {

                console.log("aaa");

                postsCollection.update({
                    _id: editPostID
                }, {
                    $set: {
                        post_title: update_post_title,
                        post_content: update_post_content,
                        post_tags: update_post_tags,
                        post_date: post_date

                    }
                }, function(err, result) {
                    if (err) throw err;

                    res.redirect('/edit_post?postID=' + editPostID);
                });
            } else {
                console.log("bbb");

                postsCollection.update({
                    _id: editPostID
                }, {
                    $set: {
                        post_title: update_post_title,
                        post_content: update_post_content,
                        post_tags: update_post_tags,
                        post_date: post_date,
                        collection: "blog"

                    }
                }, function(err, result) {
                    if (err) throw err;

                    res.redirect('/edit_post?postID=' + editPostID);
                });

            }

        });
    });
};

exports.processApproveComment = function(req, res) {

    var db = req.app.settings.db;
    var comment_id = req.param('commentID');

    var comment = new ObjectId(comment_id); //id of the current item


    db.collection('post_comments', function(err, postsCollection) {

        postsCollection.find({
            _id: comment
        }).toArray(function(err, commentCheckArr) {

            if (commentCheckArr[0].released == false) {

                postsCollection.update({
                    _id: comment
                }, {
                    $set: {
                        released: true

                    }
                }, function(err, result) {
                    if (err) throw err;

                    res.redirect('/admin');
                });
            } else {
                res.redirect('/admin');

            }
        });
    });
};




exports.fest_gallery = function(req, res) {
    var db = req.app.settings.db;

    var fest_owner = req.session.fest_id;

    var renderValue;
    var festival_site_name = req.session.FESTIVALTTLE;


    db.collection('gallery', function(err, gallleryList) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(fest_owner);

        gallleryList.find({
            parent_fest_id: festival_id
        }).toArray(function(err, galleryListArr) {
            if (err) {
                throw err
            };

            if (galleryListArr.length <= 0) {
                renderValue = "new";
            } else {
                renderValue = "exists";
            }

            res.render('fest_gallery', {
                galleryArr: galleryListArr,
                galRender: renderValue,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.processNewGallery = function(req, res) {
    var db = req.app.settings.db;

    var gallery_service = req.param('gallery_service');
    var gallery_account_id = req.param('gallery_account_id');
    var gallery_thumb_width = req.param('gallery_thumb_width');
    var gallery_thumb_height = req.param('gallery_thumb_height');

    var festivalObjectID = new ObjectId(req.session.fest_id);

    var galleryID = gallery_account_id.replace(/\s+/g, '');

    db.collection('gallery', function(err, gallleryList) {
        if (err) {
            throw err;
        }


        gallleryList.find({
            parent_fest_id: festivalObjectID
        }).toArray(function(err, galleryListArr) {
            if (err) {
                throw err
            };

            if (galleryListArr.length <= 0) {

                var newGallery = {
                    parent_fest_id: festivalObjectID,
                    gallery_service: gallery_service,
                    gallery_account_id: galleryID,
                    gallery_thumb_width: gallery_thumb_width,
                    gallery_thumb_height: gallery_thumb_height,
                    collection: "gallery"
                };

                gallleryList.insert(newGallery, {
                    w: 1
                }, function(err, gallArr) {
                    if (err) throw err;


                    res.redirect('/fest_gallery');
                });
            } else {
                gallleryList.update({
                    parent_fest_id: festivalObjectID
                }, {
                    $set: {
                        gallery_service: gallery_service,
                        gallery_account_id: galleryID,
                        gallery_thumb_width: gallery_thumb_width,
                        gallery_thumb_height: gallery_thumb_height,
                    }
                }, function(err, result) {
                    if (err) throw err;

                    res.redirect('/fest_gallery');
                });
            }
        });
    });
};



exports.fest_carousel = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;
    var festival_site_name = req.session.FESTIVALTTLE;

    db.collection('slides', function(err, pagesList) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(req.session.fest_id);
        console.log(festival_id);
        pagesList.find({
            parent_fest_id: festival_id
        }).sort('_id', 'desc').toArray(function(err, pagesListArr) {
            if (err) {
                throw err
            };

            res.render('fest_carousel', {
                slides: pagesListArr,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.new_carousel = function(req, res) {
    var festival_site_name = req.session.FESTIVALTTLE;

    res.render('new_carousel', {
        site: festival_site_name,
        first: req.session.firstname,
        last: req.session.lastname
    });
};


exports.processNewSlide = function(req, res) {
    var db = req.app.settings.db;
    var cloudinary = require('cloudinary');

    var festivalObjectID = new ObjectId(req.session.fest_id);

    var slideImg = req.files.slide_img;
    var slideHeader = req.param('caption_header');
    var slideContent = req.param('caption_content');
    var slideLink = req.param('link');

    var validLink = slideLink.replace('https://', '');

    var post_author = req.session.username;


    var festivalObjectID = new ObjectId(req.session.fest_id);

    var imgNAME = slideImg.originalFilename;
    if (imgNAME == "") {
        console.log("no IMAGE");

        db.collection('slides', function(err, pagesCollection) {
            pagesCollection.find({
                parent_fest_id: festivalObjectID
            }).toArray(function(err, slidesCheckArr) {

                if (slidesCheckArr.length == 0) {

                    var newSlide = {
                        parent_fest_id: festivalObjectID,
                        slide_img: null,
                        slide_header: slideHeader,
                        slide_content: slideContent,
                        slide_link: validLink,
                        collection: "slides"
                    };

                    if (err) throw exception;

                    pagesCollection.insert(newSlide, {
                        w: 1
                    }, function(err, sponsorsArr) {
                        if (err) throw err;

                        console.log("fest_carousel: ", sponsorsArr);
                        res.redirect('/fest_carousel');
                    });
                } else {

                    var newSlide = {
                        parent_fest_id: festivalObjectID,
                        slide_img: null,
                        slide_header: slideHeader,
                        slide_content: slideContent,
                        slide_link: validLink
                    };

                    if (err) throw exception;

                    pagesCollection.insert(newSlide, {
                        w: 1
                    }, function(err, sponsorsArr) {
                        if (err) throw err;

                        console.log("fest_carousel: ", sponsorsArr);
                        res.redirect('/fest_carousel');
                    });
                }
            });
        });
    } else {

        cloudinary.uploader.upload(slideImg.path, function(result) {

                if (result.url) {

                    var urlIMG = result.url;

                    db.collection('slides', function(err, pagesCollection) {
                        pagesCollection.find({
                            parent_fest_id: festivalObjectID
                        }).toArray(function(err, slidesCheckArr) {

                            if (slidesCheckArr.length == 0) {

                                var newSlide = {
                                    parent_fest_id: festivalObjectID,
                                    slide_img: urlIMG,
                                    slide_header: slideHeader,
                                    slide_content: slideContent,
                                    slide_link: validLink,
                                    collection: "slides"

                                };

                                if (err) throw exception;

                                pagesCollection.insert(newSlide, {
                                    w: 1
                                }, function(err, sponsorsArr) {
                                    if (err) throw err;

                                    console.log("fest_carousel: ", sponsorsArr);
                                    res.redirect('/fest_carousel');
                                });
                            } else {

                                var newSlide = {
                                    parent_fest_id: festivalObjectID,
                                    slide_img: urlIMG,
                                    slide_header: slideHeader,
                                    slide_content: slideContent,
                                    slide_link: validLink
                                };

                                if (err) throw exception;

                                pagesCollection.insert(newSlide, {
                                    w: 1
                                }, function(err, sponsorsArr) {
                                    if (err) throw err;

                                    console.log("fest_carousel: ", sponsorsArr);
                                    res.redirect('/fest_carousel');
                                });
                            }
                        });
                    });
                } else {
                    /*
                     * There was an error and the file did not upload.
                     */

                    console.log('Error uploading to cloudinary: ', result);
                    res.send('did not get url');
                }
            },

            {
                width: 1920,
                height: 1080,
                crop: "limit"
            }
        );
    }

};

exports.edit_carousel = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;
    var festival_site_name = req.session.FESTIVALTTLE;

    var slideHeader = req.param('page_id');


    db.collection('slides', function(err, slidesColl) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(slideHeader);

        slidesColl.find({
            _id: festival_id
        }).toArray(function(err, slidesListArr) {
            if (err) {
                throw err
            };
            console.log(slidesListArr);
            res.render('edit_carousel', {
                slides: slidesListArr,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.processEditCarousel = function(req, res) {
    var db = req.app.settings.db;
    var cloudinary = require('cloudinary');

    var festivalObjectID = new ObjectId(req.session.fest_id);

    var slideImg = req.files.slide_img;
    var slideHeader = req.param('caption_header');
    var slideContent = req.param('caption_content');
    var slideLink = req.param('link');
    var slide_id = req.param('slide_id');

    var validLink = slideLink.replace('https://', '');

    var post_author = req.session.username;


    var slideCurrent = new ObjectId(slide_id);
    var imgPATH = slideImg.path;
    var imgNAME = slideImg.originalFilename;


    if (imgNAME == "") {
        console.log("no IMAGE");

        db.collection('slides', function(err, pagesCollection) {
            pagesCollection.update({
                _id: slideCurrent
            }, {
                $set: {
                    slide_header: slideHeader,
                    slide_content: slideContent,
                    slide_link: validLink

                }
            }, function(err, result) {
                if (err) throw err;
                console.log(result);

                res.redirect('/fest_carousel');
            });
        });
    } else {
        cloudinary.uploader.upload(slideImg.path, function(result) {

                if (result.url) {

                    var urlIMG = result.url;

                    db.collection('slides', function(err, pagesCollection) {

                        pagesCollection.update({
                            _id: slideCurrent
                        }, {
                            $set: {
                                slide_header: slideHeader,
                                slide_content: slideContent,
                                slide_link: validLink,
                                slide_img: urlIMG

                            }
                        }, function(err, result) {
                            if (err) throw err;
                            console.log(result);

                            res.redirect('/fest_carousel');
                        });

                    });

                } else {
                    /*
                     * There was an error and the file did not upload.
                     */
                    console.log('Error uploading to cloudinary: ', result);
                    res.send('did not get url');
                }
            },

            {
                width: 1920,
                height: 1080,
                crop: "limit"
            }
        );
    }

};


exports.fest_contact_form = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;
    var festival_site_name = req.session.FESTIVALTTLE;

    var contactRender;
    db.collection('contactformsetup', function(err, pagesList) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(req.session.fest_id);
        console.log(festival_id);
        pagesList.find({
            parent_fest_id: festival_id
        }).toArray(function(err, pagesListArr) {
            if (err) {
                throw err
            };
            if (pagesListArr.length == 0) {
                contactRender = "false";
            } else {
                contactRender = "true";
            }
            res.render('fest_contact_form', {
                formData: pagesListArr,
                render: contactRender,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.processContactSetup = function(req, res) {
    var db = req.app.settings.db;


    var add1 = req.param('address-line-one');
    var add2 = req.param('address-line-two');
    var city = req.param('city');
    var county = req.param('county');
    var mail = req.param('mail_form');



    var post_author = req.session.username;


    var festivalObjectID = new ObjectId(req.session.fest_id);

    db.collection('contactformsetup', function(err, cFList) {
        if (err) {
            throw err;
        }

        cFList.find({
            parent_fest_id: festivalObjectID
        }).toArray(function(err, cFArray) {
            if (err) {
                throw err
            };

            if (cFArray.length == 0) {

                db.collection('contactformsetup', function(err, pagesCollection) {

                    var newForm = {
                        parent_fest_id: festivalObjectID,

                        form_add_one: add1,
                        form_add_two: add2,
                        form_city: city,
                        form_county: county,
                        mail: mail,
                        collection: "contact-form"
                    };

                    if (err) throw exception;

                    pagesCollection.insert(newForm, {
                        w: 1
                    }, function(err, publishedPage) {
                        if (err) throw err;

                        console.log("Form Insert: ", publishedPage);

                        res.redirect('/fest_contact_form');
                    });
                });

            } else {

                db.collection('contactformsetup', function(err, pagesCollection) {
                    pagesCollection.update({
                        parent_fest_id: festivalObjectID
                    }, {
                        $set: {

                            form_add_one: add1,
                            form_add_two: add2,
                            form_city: city,
                            form_county: county,
                            mail: mail,
                            collection: "contact-form"
                        }
                    }, function(err, result) {
                        if (err) throw err;
                        console.log("Form Update: ", result);

                        res.redirect('/fest_contact_form');
                    });
                });

            }

        });
    });
};




exports.menu_navigation = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;
    var festival_site_name = req.session.FESTIVALTTLE;

    db.collection('pages', function(err, pagesList) {
        if (err) {
            throw err;
        }
        var festival_id = new ObjectId(req.session.fest_id);

        pagesList.find({
            parent_fest_id: festival_id
        }).sort('_id', 'desc').toArray(function(err, pagesListArr) {
            if (err) {
                throw err
            };

            db.collection('menupages', function(err, menuPages) {
                if (err) {
                    throw err;
                }

                menuPages.find({
                    parent_fest_id: festival_id
                }).sort('_id', 'desc').toArray(function(err, menuPagesArr) {
                    if (err) {
                        throw err
                    };

                    if (menuPagesArr.length == 0) {
                        console.log("buuuuuuuuuuum");
                        res.render('menu_navigation', {
                            menupages: pagesListArr,
                            menuSerialized: "Please",
                            site: festival_site_name,
                            first: req.session.firstname,
                            last: req.session.lastname
                        });

                    } else {
                        var menuPagesIDArray = menuPagesArr[0].menu_page_id;
                        var currentPage = 0;
                        var currpage_ID = menuPagesIDArray[currentPage];


                        var pagesMenuArray = new Array();

                        db.collection('pages', function(err, menuPagesCollection) {
                            if (err) {
                                throw err;
                            }

                            function getStudent(currpage_ID) {
                                console.log(currpage_ID);
                                var pageObejctIDCurrent = new ObjectId(currpage_ID);

                                menuPagesCollection.find({
                                    _id: pageObejctIDCurrent
                                }).toArray(function(err, pageNameListArray) {
                                    if (err) {
                                        throw err
                                    };
                                    pagesMenuArray.push(pageNameListArray);


                                    if (currentPage < menuPagesIDArray.length - 1) {
                                        currentPage++;
                                        currpage_ID = menuPagesIDArray[currentPage];
                                        pageObejctIDCurrent = new ObjectId();
                                        getStudent(currpage_ID);
                                    } else {
                                        console.log(pagesMenuArray);

                                        res.render('menu_navigation', {
                                            menupages: pagesListArr,
                                            menuSerialized: pagesMenuArray,
                                            site: festival_site_name,
                                            first: req.session.firstname,
                                            last: req.session.lastname
                                        });
                                    }

                                });
                            }

                            getStudent(currpage_ID);
                        });
                    }
                });
            });
        });
    });
};

exports.processAddMenuPages = function(req, res) {
    var db = req.app.settings.db;

    var pagesCheckboxes = req.param('menuPages');
    console.log(pagesCheckboxes);

    var post_author = req.session.username;

    var festivalObjectID = new ObjectId(req.session.fest_id);

    db.collection('menupages', function(err, pagesCollection) {

        var newMenuPage = {
            parent_fest_id: festivalObjectID,
            menu_page_id: pagesCheckboxes
        };

        if (err) throw exception;

        pagesCollection.insert(newMenuPage, {
            w: 1
        }, function(err, publishedPage) {
            if (err) throw err;

            console.log("menu pages: ", publishedPage);

            res.redirect('/menu_navigation');
        });
    });
};

exports.processSaveMenu = function(req, res) {
    var db = req.app.settings.db;
    console.log("#################################");

    var serializedOutput = req.param('nestable-output');

    console.log(serializedOutput);

    var pageIDS = [];

    var obj = JSON.parse(serializedOutput)
    var festivalObjectID = new ObjectId(req.session.fest_id);




    for (i = 0; i < obj.length; i++) {
        pageIDS.push(obj[i]);

    }


    db.collection('navigation_menu', function(err, navMenColl) {
        if (err) {
            throw err;
        }

        navMenColl.find({
            parent_fest_id: festivalObjectID
        }).toArray(function(err, naviArr) {
            if (err) {
                throw err
            };

            if (naviArr.length == 0) {

                db.collection('navigation_menu', function(err, navigationMenu) {

                    var menu = {
                        parent_fest_id: festivalObjectID,
                        nav_pages_ids: pageIDS
                    };

                    if (err) throw exception;

                    navigationMenu.insert(menu, {
                        w: 1
                    }, function(err, newMenuCreated) {
                        if (err) throw err;

                        console.log("Medu Added: ", newMenuCreated);

                        res.redirect('/menu_navigation');
                    });
                });

            } else {

                db.collection('navigation_menu', function(err, navigationMenu) {
                    navigationMenu.update({
                        parent_fest_id: festivalObjectID
                    }, {
                        $set: {
                            nav_pages_ids: pageIDS
                        }
                    }, function(err, result) {
                        if (err) throw err;
                        console.log("Menu Update: ", result);

                        res.redirect('/menu_navigation');
                    });
                });

            }

        });
    });
};


exports.reading_settings = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;
    var festival_site_name = req.session.FESTIVALTTLE;
    var homePage;
    db.collection('pages', function(err, pagesList) {
        if (err) {
            throw err;
        }
        var festival_id = new ObjectId(req.session.fest_id);

        pagesList.find({
            parent_fest_id: festival_id
        }).toArray(function(err, pagesListArr) {
            if (err) {
                throw err
            };

            console.log(pagesListArr);
            res.render('reading_settings', {
                pagesListArr: pagesListArr,
                site: festival_site_name,
                first: req.session.firstname,
                last: req.session.lastname
            });

        });
    });
};

exports.processReading = function(req, res) {
    var db = req.app.settings.db;

    var reading_home_page = req.param('home_reading');

    var festivalObjectID = new ObjectId(req.session.fest_id);
    var pageID = new ObjectId(reading_home_page);


    db.collection('home_page_menu', function(err, readingPages) {
        if (err) {
            throw err;
        }

        readingPages.find({
            parent_fest_id: festivalObjectID
        }).toArray(function(err, readArr) {
            if (err) {
                throw err
            };

            if (readArr.length == 0) {

                db.collection('home_page_menu', function(err, pagesCollection) {

                    var newSetup = {
                        parent_fest_id: festivalObjectID,
                        reading_page_id: reading_home_page
                    };

                    if (err) throw exception;

                    pagesCollection.insert(newSetup, {
                        w: 1
                    }, function(err, publishedPage) {
                        if (err) throw err;

                        console.log("Home Page Insert: ", publishedPage);

                        res.redirect('/reading_settings');
                    });
                });

            } else {

                db.collection('home_page_menu', function(err, pagesCollection) {
                    pagesCollection.update({
                        parent_fest_id: festivalObjectID
                    }, {
                        $set: {
                            reading_page_id: reading_home_page
                        }
                    }, function(err, result) {
                        if (err) throw err;
                        console.log("Home Page Insert Update: ", result);

                        res.redirect('/reading_settings');
                    });
                });

            }

        });
    });
};




//Users-->
exports.users_all = function(req, res) {
    var db = req.app.settings.db;
    var fest_owner = req.session.username;

    db.collection('festivalwebsite', function(err, festUsers) {
        if (err) {
            throw err;
        }

        var festival_id = new ObjectId(req.session.fest_id);
        console.log(festival_id);
        festUsers.find({
            _id: festival_id
        }).toArray(function(err, festUserArr) {
            if (err) {
                throw err
            };

            db.collection('users', function(err, subUsers) {
                if (err) {
                    throw err;
                }


                subUsers.find({
                    parent_fest_id: festival_id
                }).toArray(function(err, subUserArr) {
                    if (err) {
                        throw err
                    };
                    console.log(subUserArr);

                    res.render('users_all', {
                        admins: festUserArr,
                        editiors: subUserArr,
                        first: req.session.firstname,
                        last: req.session.lastname
                    });
                });
            });

        });
    });
};

exports.users_add = function(req, res) {
    res.render('users_add', {
        first: req.session.firstname,
        last: req.session.lastname
    });
};

exports.processAddUser = function(req, res) {
    var db = req.app.settings.db;

    var first_name_post = req.param('first_name');
    var last_name_post = req.param('last_name');
    var username_post = req.param('user_name');
    var user_email_post = req.param('user_email');
    var user_password_post = req.param('password');
    var role = 'editor';

    var festivalObjectID = new ObjectId(req.session.fest_id);


    if (first_name_post && last_name_post && username_post && user_email_post && user_password_post && role) {
        db.collection('users', function(err, collection) {

            var newAdminUser = {
                parent_fest_id: festivalObjectID,
                sub_user_username: username_post,
                sub_user_firstname: first_name_post,
                sub_user_lastname: last_name_post,
                sub_user_email: user_email_post,
                sub_user_password: user_password_post,
                sub_user_role: role
            };

            collection.insert(newAdminUser, {
                w: 1
            }, function(err, result) {
                if (err) throw err;

                console.log("User Added: ", result);
                res.redirect('/users_all');
            });
        });
    }
};

exports.users_edit = function(req, res) {
    var db = req.app.settings.db;


    var admin_id = req.param('admin_id');


    var festivalObjectID = new ObjectId(admin_id);


    db.collection('festivalwebsite', function(err, pagesList) {
        if (err) {
            throw err;
        }

        pagesList.find({
            _id: festivalObjectID
        }).toArray(function(err, adminsListArr) {
            if (err) {
                throw err
            };
            console.log(adminsListArr);
            res.render('users_edit', {
                adminData: adminsListArr,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};

exports.sub_edit = function(req, res) {
    var db = req.app.settings.db;


    var admin_id = req.param('sub_admin_id');


    var festivalObjectID = new ObjectId(admin_id);


    db.collection('users', function(err, pagesList) {
        if (err) {
            throw err;
        }

        pagesList.find({
            _id: festivalObjectID
        }).toArray(function(err, subadminsListArr) {
            if (err) {
                throw err
            };

            console.log(subadminsListArr);
            res.render('sub_edit', {
                subAdminData: subadminsListArr,
                first: req.session.firstname,
                last: req.session.lastname
            });
        });
    });
};


exports.processEditAdmin = function(req, res) {
    var db = req.app.settings.db;
    var cloudinary = require('cloudinary');


    var first_name_post = req.param('first');
    var last_name_post = req.param('last');
    var username_post = req.param('username');


    var festival_id = new ObjectId(req.session.fest_id);

    db.collection('festivalwebsite', function(err, pagesCollection) {
        pagesCollection.update({
            _id: festival_id
        }, {
            $set: {
                user_first_name: first_name_post,
                user_last_name: last_name_post,
                user_username: username_post

            }
        }, function(err, result) {
            if (err) throw err;
            console.log(result);

            res.redirect('/users_all');
        });
    });
};

exports.processEditSubAdmin = function(req, res) {
    var db = req.app.settings.db;
    var cloudinary = require('cloudinary');


    var first_name_post = req.param('first');
    var last_name_post = req.param('last');
    var username_post = req.param('username');

    var user_id = req.param('user_id');



    var festival_id = new ObjectId(user_id);

    db.collection('users', function(err, pagesCollection) {
        pagesCollection.update({
            _id: festival_id
        }, {
            $set: {
                sub_user_firstname: first_name_post,
                sub_user_lastname: last_name_post,
                sub_user_username: username_post

            }
        }, function(err, result) {
            if (err) throw err;
            console.log(result);

            res.redirect('/users_all');
        });
    });
};


exports.about_us = function(req, res) {
    var db = req.app.settings.db;

    var festival_site_name = req.session.FESTIVALTTLE;
    var render;

    db.collection('about_us', function(err, pagesList) {
        if (err) {
            throw err;
        }
        var festival_id = new ObjectId(req.session.fest_id);

        pagesList.find({
            parent_fest_id: festival_id
        }).toArray(function(err, aboutPages) {
            if (err) {
                throw err
            };
            console.log(aboutPages.length);
            
            if(aboutPages.length == 0)
                {
                    render = false;
                }
            else{
                                render = true;
            }

            res.render('about_us', {
                site: festival_site_name,
                pages: aboutPages,
                first: req.session.firstname,
                last: req.session.lastname,
                render:render
            });

        });
    });

};

exports.process_about_us = function(req, res) {
    var db = req.app.settings.db;

    var fest_page_content = req.param('editor-post');
    var fest_page_author = req.session.username;

    var festivalObjectID = new ObjectId(req.session.fest_id);

    db.collection('about_us', function(err, aboutCollection) {
        aboutCollection.find({
            parent_fest_id: festivalObjectID
        }).toArray(function(err, socialCheckArr) {

            if (socialCheckArr.length == 0) {

                var newAbout = {
                    parent_fest_id: festivalObjectID,
                    about_content: fest_page_content,
                    collection: "about_us"
                };

                if (err) throw exception;

                aboutCollection.insert(newAbout, {
                    w: 1
                }, function(err, publishedPage) {
                    if (err) throw err;

                    console.log("newLinkks: ", publishedPage);

                    res.redirect('/about_us');
                });
            } else {
                aboutCollection.update({
                    parent_fest_id: festivalObjectID
                }, {
                    $set: {
                        parent_fest_id: festivalObjectID,
                        about_content: fest_page_content

                    }
                }, function(err, publishedPage) {
                    if (err) throw err;

                    res.redirect('/about_us');
                });
            }
        });
    });
};