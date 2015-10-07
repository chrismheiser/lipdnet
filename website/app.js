// app.js
// Modules
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var sys = require('sys');
var multer = require('multer');
var routes = require('./routes/index');
var users = require('./routes/users');
var favicon = require('serve-favicon');
var app = express();
// console.log(__dirname + '/public/scripts/test.py');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './tmp/')
  },
  onFileUploadStart: function (file) {
    console.log(file.originalname + ' is starting ...');
  },
  onFileUploadComplete: function (file) {
      console.log(file.fieldname + ' uploaded to  ' + file.path)
  }

});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.bodyParser( { keepExtensions: true, uploadDir: __dirname + '/photos' } ));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'tmp')));
app.use(multer({ storage: storage }).single('file'));
app.use('/', routes);
app.use('/users', users);

// app.use(function(req, res, next){
// 	// req.db = db;
// 	next();
// });

// error handlers

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).render('404.jade');
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(app.get('port'), function() {
  console.log('Node port: ', app.get('port'));
});


module.exports = app;


// Executing Python script
// var spawn  = require('child_process').spawn;
// var child = spawn('python',['/Users/chrisheiser1/Documents/code/geoChronR/website/public/scripts/test.py']);
// // while cp is still processing data ...
// child.stdout.on('data', function(data){
//   console.log("child data");
//   out += data;
// });
// // once the cp flags as closing process
// child.stdout.on('close', function(){
//   console.log('Spawned child pid: ' + child.pid);
//   console.log('Data: ' + out);
// });

// Database Stuff
//var mongo = require('mongodb');
//var monk = require('monk');
//var db = monk('localhost:27017/gcr_proto');
//var port = process.env.PORT || 8080;
