//  1. First steps in the api file validate the requested festival URL and check if the festival exist, if not error page is rendered.
//
//  2. If the festival is found api validates the requested page_slug value checking if it is defined or not. If page slug has not been specified 
//    in the url the api tries to see it the home page for the festival exists in the home_page_menu collection in MongoDB databases. If it doesn’t
//    exist error page is rendered because no page request was specified. If the home_page_menu exists in the database then the api system finds the page
//    in pages collection and renders its content.
//
//  3. Content of the pages can be only shortcodes so the api validates the content of the page and if shortcodes are not found it checks if the navigation menu 
//    data exists and renders the navigation menu with no page content because no shortcodes were found on the page.
//
//  4. If shortcodes are found on the requested page for each loop checks for what shortcodes exist on the page and for each shortcode that has been found a shortcode function is called.
//
//  5. For each of the nine shortcodes there is a setup function so when a shortcode is found on a page its function retrieves the data form the database.
//    After all the shortcodes validations are completed and the data associated with the shortcode is ready to be displayed in a festival website, a renderSite function gets called.
//
//  6. Render site function has access to all the data for each shortcode and then the requested data is rendered on the festival website.


var ObjectId = require('mongodb').ObjectID;

exports.indexfest = function(req, res) {
    var db = req.app.settings.db;
    var festURL = req.params.festival_url;
    var pageSlug = req.params.page_slug;

    req.session.slug = pageSlug;
    var renderResponse = [];

    req.session.postArr = null;
    req.session.sponsorsArr = null;
    console.log(pageSlug);

    var urlValidate = festURL.replace(/\s/g, '').toLowerCase().substr(0, 50);

    db.collection('festivalwebsite', function(err, fest) {
        if (err) {
            throw err;}

        fest.find({
            festival_url: urlValidate
        }).toArray(function(err, festArray) {
            if (err) {
                throw err
            };

            if (festArray.length == 0) {
                console.log('no festival was found');
                res.render('errorpage');
            } 
            
            else {

                console.log('festival was found');
                var festID = festArray[0]._id;
                var festival_id = new ObjectId(festID);

                req.session.URLFESTIVAL = festArray[0].festival_url;
                req.session.titleFest = festArray[0].festival_title;

                if (pageSlug == undefined) {
                    console.log("no Slug");

                    db.collection('festivalwebsite', function(err, fest) {
                        if (err) {
                            throw err;
                        }

                        fest.find({
                            festival_url: urlValidate
                        }).toArray(function(err, festArray) {
                            if (err) {
                                throw err
                            };

                            var festID = festArray[0]._id;
                            var festival_id = new ObjectId(festID);


                            db.collection('home_page_menu', function(err, homepage) {
                                if (err) {
                                    throw err;
                                }

                                homepage.find({
                                    parent_fest_id: festival_id
                                }).toArray(function(err, menuArray) {
                                    if (err) {
                                        throw err
                                    };


                                    if (menuArray.length == 0) {
                                        console.log('no homepage was found');
                                        res.render('errorpage');
                                    } else {

                                        console.log(menuArray[0].reading_page_id);
                                        var ID = menuArray[0].reading_page_id;

                                        req.session.pageID = ID;

                                        var festObj = new ObjectId(ID);


                                        db.collection('pages', function(err, pageHomePage) {
                                            if (err) {
                                                throw err;
                                            }

                                            pageHomePage.find({
                                                _id: festObj
                                            }).toArray(function(err, renderPage) {
                                                if (err) {
                                                    throw err
                                                };
                                                console.log(renderPage);

                                                var slugDunamic = renderPage[0].page_slug;

                                                var festCurrent = req.session.URLFESTIVAL;
                                                req.session.slug = slugDunamic;
                                                res.redirect("/" + festCurrent + "/" + slugDunamic);
                                            });
                                        });
                                    }
                                });
                            });
                        });
                    });
                } else {

                    var slug = req.session.slug;

                    console.log(req.session.slug);

                    console.log(slug);


                    db.collection('pages', function(err, pages) {
                        if (err) {
                            throw err;
                        }

                        pages.find({
                            page_slug: pageSlug
                        }).toArray(function(err, pgArray) {
                            if (err) {
                                throw err
                            };

                            if (pgArray.length == 0) {

                                res.render('errorpage');
                            } else {

                                if (pgArray[0].page_shortcodes == "") {
                                    console.log("no page shortcode found");



                                    var respo = "shortcodes-not-found";

                                    var navRespArr = new Array();
                                    var menuLoopArr = [];


                                    db.collection('navigation_menu', function(err, menu) {
                                        if (err) {
                                            throw err;
                                        }

                                        menu.find({
                                            parent_fest_id: festival_id
                                        }).toArray(function(err, menuList) {
                                            if (err) {
                                                throw err
                                            };

                                            for (var i = 0; i < menuList.length; i++) {
                                                var temp = menuList[i].nav_pages_ids
                                                for (var q = 0; q < temp.length; q++) {
                                                    menuLoopArr.push(temp[q].id);
                                                }
                                            }

                                            var currentMenuItem = 0;

                                            var menuIDArray = [];
                                            menuIDArray = menuLoopArr[0];


                                            var menuNav = menuLoopArr[currentMenuItem];

                                            var responseArray = new Array();


                                            db.collection('pages', function(err, pagesColl) {
                                                if (err) {
                                                    throw err;
                                                }

                                                function getPages(pid) {
                                                    console.log("call");
                                                    var festival_id = new ObjectId(pid);
                                                    console.log(pid);

                                                    var menuRender = "";


                                                    pagesColl.find({
                                                        "_id": festival_id
                                                    }).toArray(function(err, pagesList) {
                                                        if (err) {
                                                            throw err
                                                        };


                                                        responseArray.push(pagesList);


                                                        if (currentMenuItem < menuLoopArr.length - 1) {
                                                            currentMenuItem++;
                                                            menuNav = menuLoopArr[currentMenuItem];
                                                            getPages(menuNav);

                                                        } else {
                                                            console.log(responseArray[0].length);

                                                            if (responseArray[0].length == 0) {
                                                                menuRender = "renderNO";
                                                            } else {
                                                                menuRender = "renderYES";
                                                            }

                                                            res.render('indexfest', {
                                                                festivalData: festArray,
                                                                resp: respo,
                                                                menu: responseArray,
                                                                renderMenu: menuRender
                                                            });
                                                        }
                                                    });
                                                }
                                                getPages(menuNav);
                                            });
                                        });
                                    });

                                } else {
                                    console.log("hittttt");
                                    str = pgArray[0].page_shortcodes;


                                    var post_tags_array = str.split(",");

                                    for (var i = 0; i < post_tags_array.length; i++) {
                                        console.log(post_tags_array[i]);

                                        if (post_tags_array[i] == "[shortcode_blog]") {
                                            blogRender(festival_id, festArray, renderResponse, post_tags_array);
                                            console.log("shortcode_blog");
                                        } else if (post_tags_array[i] == "[shortcode_sponsors]") {
                                            sponsorsRender(festival_id, festArray, renderResponse, post_tags_array);
                                            console.log("shortcode_sponsors");
                                        } else if (post_tags_array[i] == "[shortcode_contact_form]") {
                                            contactFormRender(festival_id, festArray, renderResponse, post_tags_array);
                                            console.log("shortcode_contact_form");
                                        } else if (post_tags_array[i] == "[shortcode_line_up]") {
                                            lineUpRender(festival_id, festArray, renderResponse, post_tags_array);
                                            console.log("shortcode_line_up");
                                        } else if (post_tags_array[i] == "[shortcode_social_links]") {
                                            socialLinksRender(festival_id, festArray, renderResponse, post_tags_array);
                                            console.log("shortcode_social_links");
                                        } else if (post_tags_array[i] == "[shortcode_programme]") {
                                            programmeRender(festival_id, festArray, renderResponse, post_tags_array);
                                            console.log("shortcode_programme");
                                        } else if (post_tags_array[i] == "[shortcode_carousel]") {
                                            carouselRender(festival_id, festArray, renderResponse, post_tags_array);
                                            console.log("shortcode_carousel");
                                        } else if (post_tags_array[i] == "[shortcode_gallery]") {
                                            galleryRender(festival_id, festArray, renderResponse, post_tags_array);
                                            console.log("shortcode_gallery");
                                        } else if (post_tags_array[i] == "[shortcode_about_us]") {
                                            aboutRender(festival_id, festArray, renderResponse, post_tags_array);
                                            console.log("shortcode_about_us");
                                        }
                                    }
                                }
                            }
                        });
                    });
                }
            }
        });
    });

    function blogRender(festival_id, festArray, renderResponse, post_tags_array) {
        console.log("blogRender");
        db.collection('posts', function(err, posts) {
            if (err) {
                throw err;
            }

            posts.find({
                parent_fest_id: festival_id
            }).toArray(function(err, postArr) {
                if (err) {
                    throw err
                };
                renderResponse.push(postArr);

                req.session.postArr = postArr;

                db.collection('post_comments', function(err, coms) {
                    if (err) {
                        throw err;
                    }

                    coms.find().toArray(function(err, comments) {
                        if (err) {
                            throw err
                        };

                        req.session.comments = comments;
                        if (post_tags_array.length === renderResponse.length) {
                            var response = renderResponse;
                            renderSite(festival_id, festArray, renderResponse);
                        }
                    });
                });
            });
        });
    }

    function sponsorsRender(festival_id, festArray, renderResponse, post_tags_array) {
        console.log("sponsorsRender");
        db.collection('sponsors', function(err, sponsors) {
            if (err) {
                throw err;
            }

            sponsors.find({
                parent_fest_id: festival_id
            }).toArray(function(err, sponsorsArr) {
                if (err) {
                    throw err
                };
                renderResponse.push(sponsorsArr);

                req.session.sponsorsArr = sponsorsArr;

                if (post_tags_array.length === renderResponse.length) {
                    var response = renderResponse;
                    renderSite(festival_id, festArray, renderResponse);
                }

            });
        });
    }

    function contactFormRender(festival_id, festArray, renderResponse, post_tags_array) {
        console.log("contactFormRender");
        db.collection('contactformsetup', function(err, contactSetup) {
            if (err) {
                throw err;
            }

            contactSetup.find({
                parent_fest_id: festival_id
            }).toArray(function(err, contactSetupArr) {
                if (err) {
                    throw err
                };
                renderResponse.push(contactSetupArr);

                req.session.contactSetupArr = contactSetupArr;

                if (post_tags_array.length === renderResponse.length) {
                    var response = renderResponse;
                    renderSite(festival_id, festArray, renderResponse);
                }

            });
        });
    }

    function lineUpRender(festival_id, festArray, renderResponse, post_tags_array) {
        console.log("lineUpRender");
        db.collection('lineup', function(err, lineupColl) {
            if (err) {
                throw err;
            }

            lineupColl.find({
                parent_fest_id: festival_id
            }).toArray(function(err, lineUpArr) {
                if (err) {
                    throw err
                };
                renderResponse.push(lineUpArr);

                req.session.lineUpArr = lineUpArr;

                if (post_tags_array.length === renderResponse.length) {
                    var response = renderResponse;
                    renderSite(festival_id, festArray, renderResponse);
                }

            });
        });
    }


    function socialLinksRender(festival_id, festArray, renderResponse, post_tags_array) {
        console.log("socialLinksRender");
        db.collection('social_links', function(err, links) {
            if (err) {
                throw err;
            }

            links.find({
                parent_fest_id: festival_id
            }).toArray(function(err, linksArr) {
                if (err) {
                    throw err
                };
                renderResponse.push(linksArr);

                req.session.linksArr = linksArr;

                if (post_tags_array.length === renderResponse.length) {
                    var response = renderResponse;
                    renderSite(festival_id, festArray, renderResponse);
                }

            });
        });
    }

    function programmeRender(festival_id, festArray, renderResponse, post_tags_array) {
        console.log("programmeRender");
        db.collection('programme_day', function(err, progColls) {
            if (err) {
                throw err;
            }

            progColls.find({
                parent_fest_id: festival_id
            }).toArray(function(err, programmeArr) {
                if (err) {
                    throw err
                };
                renderResponse.push(programmeArr);

                req.session.programmeArr = programmeArr;

                if (post_tags_array.length === renderResponse.length) {
                    var response = renderResponse;
                    renderSite(festival_id, festArray, renderResponse);
                }

            });
        });
    }

    function carouselRender(festival_id, festArray, renderResponse, post_tags_array) {
        console.log("carouselRender");
        db.collection('slides', function(err, slidesColl) {
            if (err) {
                throw err;
            }

            slidesColl.find({
                parent_fest_id: festival_id
            }).toArray(function(err, slidesArr) {
                if (err) {
                    throw err
                };
                renderResponse.push(slidesArr);

                req.session.slidesArr = slidesArr;

                if (post_tags_array.length === renderResponse.length) {
                    var response = renderResponse;
                    renderSite(festival_id, festArray, renderResponse);
                }

            });
        });
    }

    function galleryRender(festival_id, festArray, renderResponse, post_tags_array) {
        console.log("galleryRender");
        db.collection('gallery', function(err, gallColl) {
            if (err) {
                throw err;
            }

            gallColl.find({
                parent_fest_id: festival_id
            }).toArray(function(err, galleryArr) {
                if (err) {
                    throw err
                };
                renderResponse.push(galleryArr);

                req.session.galleryArr = galleryArr;

                if (post_tags_array.length === renderResponse.length) {
                    var response = renderResponse;
                    renderSite(festival_id, festArray, renderResponse);
                }

            });
        });
    }

    function aboutRender(festival_id, festArray, renderResponse, post_tags_array) {
        console.log("aboutRender");
        db.collection('about_us', function(err, aboutColl) {
            if (err) {
                throw err;
            }

            aboutColl.find({
                parent_fest_id: festival_id
            }).toArray(function(err, aboutArr) {
                if (err) {
                    throw err
                };
                renderResponse.push(aboutArr);
                console.log("aboutArraboutArraboutArraboutArr");

                console.log(aboutArr);
                console.log("aboutArraboutArraboutArraboutArr");

                req.session.aboutArr = aboutArr;

                if (post_tags_array.length === renderResponse.length) {
                    var response = renderResponse;
                    renderSite(festival_id, festArray, renderResponse);
                }

            });
        });
    }



    function renderSite(festival_id, festArray, renderResponse) {

        var respondPosts = req.session.postArr;
        var respondSponsors = req.session.sponsorsArr;
        var respondContactSetup = req.session.contactSetupArr;
        var respondLineUp = req.session.lineUpArr;
        var respondSocialLinks = req.session.linksArr;
        var respondSlides = req.session.slidesArr;
        var respondGallery = req.session.galleryArr;
        var respondProgramme = req.session.programmeArr;
        var respondAbout = req.session.aboutArr;

        var menuLoopArr = [];

        var navigationMenuResponseArray = new Array();

        var resp = "shortcodes-found";


        console.log(renderResponse);

        db.collection('navigation_menu', function(err, menu) {
            if (err) {
                throw err;
            }

            menu.find({
                parent_fest_id: festival_id
            }).toArray(function(err, menuList) {
                if (err) {
                    throw err
                };
                console.log("######################################################3");

                for (var i = 0; i < menuList.length; i++) {
                    var temp = menuList[i].nav_pages_ids
                    for (var q = 0; q < temp.length; q++) {
                        menuLoopArr.push(temp[q].id);
                    }
                }

                var currentMenuItem = 0;


                var menuIDArray = [];
                menuIDArray = menuLoopArr[0];


                var menuNav = menuLoopArr[currentMenuItem];


                var responseArray = new Array();

                db.collection('pages', function(err, pagesColl) {
                    if (err) {
                        throw err;
                    }

                    function getPages(pid) {
                        console.log("call");
                        var festival_id = new ObjectId(pid);
                        console.log(pid);
                        var menuRender = "";


                        pagesColl.find({
                            "_id": festival_id
                        }).toArray(function(err, pagesList) {
                            if (err) {
                                throw err
                            };


                            responseArray.push(pagesList);


                            if (responseArray[0].length == 0) {
                                menuRender = "renderNO";
                            } else {
                                menuRender = "renderYES";
                            }


                            if (currentMenuItem < menuLoopArr.length - 1) {
                                currentMenuItem++;
                                menuNav = menuLoopArr[currentMenuItem];
                                getPages(menuNav);

                            } else {

                                console.log(req.session.comments);

                                var titleFest = req.session.titleFest;

                                res.render('indexfest', {
                                    festivalData: festArray,
                                    blogOBJ: respondPosts,
                                    sponsorsOBJ: respondSponsors,
                                    contactSetupOBJ: respondContactSetup,
                                    lineUpOBJ: respondLineUp,
                                    socialLinksOBJ: respondSocialLinks,
                                    slidesOBJ: respondSlides,
                                    galleryOBJ: respondGallery,
                                    programmeOBJ: respondProgramme,
                                    aboutOBJ: respondAbout,
                                    renderOrder: renderResponse,
                                    resp: resp,
                                    menu: responseArray,
                                    renderMenu: menuRender,
                                    festSite: req.session.titleFest,
                                    comments: req.session.comments,
                                    title: titleFest
                                });


                            }

                        });
                    }
                    getPages(menuNav);

                });




            });
        });
    }
};


exports.errorpage = function(req, res) {
    res.render('errorpage');
};


exports.processComment = function(req, res) {
    var db = req.app.settings.db;

    var comment = req.param('comment');
    var author = req.param('author');
    var festivalBlogID = req.param('idPost');

    var currentDate = new Date;
    var Day = currentDate.getDate();
    if (Day < 10) {
        Day = '0' + Day;
    } //end if
    var Month = currentDate.getMonth() + 1;
    if (Month < 10) {
        Month = '0' + Month;
    } //end if
    var Year = currentDate.getFullYear();
    var fullDate = Month + '/' + Day + '/' + Year;

    var currentTime = new Date;
    var Minutes = currentTime.getMinutes();
    if (Minutes < 10) {
        Minutes = '0' + Minutes;
    }
    var Hour = currentTime.getHours();
    if (Hour > 12) {
        Hour -= 12;
    } //end if
    var Time = Hour + ':' + Minutes;
    if (currentTime.getHours() <= 12) {
        Time += ' AM';
    } //end if
    if (currentTime.getHours() > 12) {
        Time += ' PM';
    } //end if

    var dateTime = "";
    dateTime = fullDate + " at " + Time;
    console.log(dateTime);

    var festURLComment = req.session.URLFESTIVAL;
    var festSlugComment = req.session.slug;

    var blogID = new ObjectId(festivalBlogID);

    db.collection('post_comments', function(err, blogCommentsColl) {

        var blogComment = {
            blog_fest_id: blogID,
            comment: comment,
            author: author,
            date: dateTime,
            released: false

        };

        if (err) throw exception;

        blogCommentsColl.insert(blogComment, {
            w: 1
        }, function(err, publishedComment) {
            if (err) throw err;

            console.log("Comment: ", publishedComment);

            res.redirect('/' + festURLComment + '/' + festSlugComment);

        });
    });
};