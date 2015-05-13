/**
 * Module dependencies.
 */

 var cloudinaryCredentials = {
  cloud_name: 'docentkowalik',
  api_key:    '551736438131922',
  api_secret: 'TgOYptbHElnIJ9roFux8_4khRU8'
};

//The above code is the config 
//cridentials variable for CLoudinary Photo Service


var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var auth = require('./routes/auth');
var api = require('./routes/api');
var deletes = require('./routes/deletes');

var multipleViews = require('express-multiple-views');
var cheerio = require('cheerio');
var cloudinary = require('cloudinary');
var cloudinary = require('cloudinary');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();


cloudinary.config({
  cloud_name: cloudinaryCredentials.cloud_name,
  api_key:    cloudinaryCredentials.api_key,
  api_secret: cloudinaryCredentials.api_secret
});

var app = express();


var mongo = require('mongodb');
var mongoClient = mongo.MongoClient;
var MONGODB_URI = process.env.CUSTOMCONNSTR_MONGODB_URI || 'mongodb://localhost:27017/festivals';

mongoClient.connect(MONGODB_URI, function(err, db) {
  if(!err) {
    console.log("Connected to mongoDB !");
    app.set('db', db);
  }
  else {
    throw err;
  }
});


// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
multipleViews(app, path.join(__dirname, 'views/admin'));
multipleViews(app, path.join(__dirname, 'views/template'));

app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('FestivalCMS'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


if ('development' == app.get('env')) {
  app.use(express.errorHandler());
  app.locals.pretty = true;
}


//start dashboard administarator back end routes
app.get('/', routes.index);
app.get('/ezyfestivals', routes.ezyfestivals);

app.get('/admin',auth.login, routes.admin);
app.get('/login', routes.login);
app.post('/login', routes.processLogin);

app.post('/processRegister', routes.processRegister);
app.get('/logoutFestival', routes.logoutFestival);

app.post('/processLogo', multipartMiddleware, routes.processLogo);

app.get('/all_pages',auth.login, routes.all_pages);
app.get('/new_page',auth.login, routes.new_page);
app.post('/processNewPage', routes.processNewPage);
app.get('/edit_page',auth.login, routes.edit_page);
app.post('/processEditPage', routes.processEditPage);
app.get('/processDeletePage', deletes.processDeletePage);

app.get('/about_us', auth.login, routes.about_us);
app.post('/process_about_us', routes.process_about_us);

app.get('/social_links',auth.login, routes.social_links);
app.post('/processSocialLinks', routes.processSocialLinks);

app.get('/fest_programme',auth.login, routes.fest_programme);
app.get('/new_programme_day',auth.login, routes.new_programme_day);
app.post('/processNewProgrammeDay', routes.processNewProgrammeDay);
app.get('/programme_day_schedule',auth.login, routes.programme_day_schedule);
app.post('/processDayEvent', routes.processDayEvent);
app.get('/processDeleteProg', deletes.processDeleteProg);

app.get('/fest_lineup',auth.login, routes.fest_lineup);
app.get('/new_line_up',auth.login, routes.new_line_up);
app.post('/processNewLineUp', multipartMiddleware, routes.processNewLineUp);
app.get('/edit_lineup',auth.login, routes.edit_lineup);
app.post('/processEdit_lineup', multipartMiddleware, routes.processEdit_lineup);
app.get('/processDeleteLineup', deletes.processDeleteLineup);

app.get('/fest_sponsors',auth.login, routes.fest_sponsors);
app.get('/new_sponsor',auth.login, routes.new_sponsor);
app.post('/processNewSponsor', multipartMiddleware, routes.processNewSponsor);
app.get('/edit_sponsor',auth.login, routes.edit_sponsor);
app.post('/processEdit_sponsor', multipartMiddleware, routes.processEdit_sponsor);
app.get('/processDeleteSponsor', deletes.processDeleteSponsor);

app.get('/fest_blog',auth.login, routes.fest_blog);
app.get('/add_post',auth.login, routes.add_post);
app.post('/processNewPost', routes.processNewPost);
app.get('/edit_post',auth.login, routes.edit_post);
app.post('/processEditPost', routes.processEditPost);
app.post('/processComment', api.processComment);
app.get('/processApproveComment',auth.login, routes.processApproveComment);
app.get('/processDeleteComment', deletes.processDeleteComment);

app.get('/processDeletePost', deletes.processDeletePost);

app.get('/fest_gallery',auth.login, routes.fest_gallery);
app.post('/processNewGallery', routes.processNewGallery);

app.get('/fest_carousel',auth.login, routes.fest_carousel);
app.get('/new_carousel',auth.login, routes.new_carousel);
app.post('/processNewSlide', multipartMiddleware, routes.processNewSlide);
app.get('/edit_carousel',auth.login, routes.edit_carousel);
app.post('/processEditCarousel', multipartMiddleware ,routes.processEditCarousel);
app.get('/processDeleteSlide', deletes.processDeleteSlide);

app.get('/fest_contact_form',auth.login, routes.fest_contact_form);
app.post('/processContactSetup', routes.processContactSetup);

app.get('/menu_navigation',auth.login, routes.menu_navigation);
app.post('/processSaveMenu', routes.processSaveMenu);

app.get('/reading_settings',auth.login, routes.reading_settings);
app.post('/processReading', routes.processReading);

app.get('/users_all',auth.login, routes.users_all);
app.get('/users_add',auth.login, routes.users_add);
app.post('/processAddUser', routes.processAddUser);
app.get('/users_edit',auth.login, routes.users_edit);
app.get('/sub_edit',auth.login, routes.sub_edit);
app.post('/processEditAdmin', routes.processEditAdmin);
app.post('/processEditSubAdmin', routes.processEditSubAdmin);

app.get('/processDeleteSubUser', deletes.processDeleteSubUser);
//end dashboard administarator back end routes


//start festival templates routes
app.get('/:festival_url/:page_slug?', api.indexfest);
app.get('/errorpage', api.errorpage);
//end festival templates routes

http.createServer(app).listen(app.get('port'), function(){
  console.log('Listening on port ' + app.get('port'));

});
