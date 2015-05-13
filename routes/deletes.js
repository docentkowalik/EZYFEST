
var ObjectId = require('mongodb').ObjectID;


exports.processDeletePage = function (req, res) {

  var db = req.app.settings.db;
  var page_id = req.param('page_id');
  console.log(page_id);

    var pageObjectID = new ObjectId(page_id);

    db.collection('pages', function (err, pagesCollection){
      pagesCollection.remove({_id: pageObjectID}, function (err, pagesResult) {
        if (err) throw err;
        console.log("List Removed: ", pagesResult);
      				res.redirect('/all_pages');  
   });
  });
};

exports.processDeleteLineup = function (req, res) {

  var db = req.app.settings.db;
  var page_id = req.param('page_id');
  console.log(page_id);

    var pageObjectID = new ObjectId(page_id);

    db.collection('lineup', function (err, pagesCollection){
      pagesCollection.remove({_id: pageObjectID}, function (err, pagesResult) {
        if (err) throw err;
        console.log("List Removed: ", pagesResult);
      				res.redirect('/fest_lineup');  
   });
  });
};

exports.processDeleteSponsor = function (req, res) {

  var db = req.app.settings.db;
  var sponsor_id = req.param('sponsor_id');
  console.log(sponsor_id);

    var pageObjectID = new ObjectId(sponsor_id);

    db.collection('sponsors', function (err, pagesCollection){
      pagesCollection.remove({_id: pageObjectID}, function (err, pagesResult) {
        if (err) throw err;
        console.log("List Removed: ", pagesResult);
              res.redirect('/fest_sponsors');  
   });
  });
};
exports.processDeleteSlide = function (req, res) {

  var db = req.app.settings.db;
  var slide_id = req.param('slide_id');
  console.log(slide_id);

    var pageObjectID = new ObjectId(slide_id);

    db.collection('slides', function (err, pagesCollection){
      pagesCollection.remove({_id: pageObjectID}, function (err, pagesResult) {
        if (err) throw err;
        console.log("List Removed: ", pagesResult);
              res.redirect('/fest_carousel');  
   });
  });
};

exports.processDeletePost = function (req, res) {

  var db = req.app.settings.db;
  var post_id = req.param('post_id');
  console.log(post_id);

    var postObjectID = new ObjectId(post_id);

    db.collection('posts', function (err, pagesCollection){
      pagesCollection.remove({_id: postObjectID}, function (err, pagesResult) {
        if (err) throw err;
        console.log("Post Removed: ", pagesResult);
              res.redirect('/fest_blog');  
   });
  });
};


exports.processDeleteComment = function (req, res) {

  var db = req.app.settings.db;
  var comment_id = req.param('commentID');
  var comment = new ObjectId(comment_id); 


    db.collection('post_comments', function (err, pagesCollection){
      pagesCollection.remove({_id: comment}, function (err, pagesResult) {
        if (err) throw err;
        console.log("Comment Removed: ", pagesResult);
              res.redirect('/admin');  
   });
  });
};


exports.processDeleteSubUser = function (req, res) {

  var db = req.app.settings.db;
  var admin_id = req.param('adminID');
  var admin = new ObjectId(admin_id);

    db.collection('users', function (err, pagesCollection){
      pagesCollection.remove({_id: admin}, function (err, pagesResult) {
        if (err) throw err;
        console.log("User Removed: ", pagesResult);
              res.redirect('/users_all');  
   });
  });
};

exports.processDeleteProg = function (req, res) {

  var db = req.app.settings.db;
  var prog = req.param('prog_id');
  var programme = new ObjectId(prog);

    db.collection('programme_day', function (err, pagesCollection){
      pagesCollection.remove({_id: programme}, function (err, pagesResult) {
        if (err) throw err;
        console.log("Prog Removed: ", pagesResult);
              res.redirect('/fest_programme');  
   });
  });
};


