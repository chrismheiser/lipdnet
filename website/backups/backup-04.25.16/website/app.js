// app.js

// Modules
var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
//var mongo = require('mongodb');
//var monk = require('monk');
//var db = monk('localhost:27017/gcr_proto');
//var stylus = require('stylus');
//var nib = require('nib');
//var port = process.env.PORT || 8080;

 // Local Files
var routes = require('./routes/index');
var users = require('./routes/users');
var favicon = require('serve-favicon');
delete require.cache['./routes/index'];

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

// app.use(function(req, res, next){
// 	// req.db = db;
// 	next();
// });

app.use('/', routes);
app.use('/users', users);

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
  console.log('Node app is running on port', app.get('port'));
});


module.exports = app;