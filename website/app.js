// app.js
var express = require('express');
var process = require("process");
var logger = require("./node_modules_custom/node_log.js");
var rimraf = require("rimraf");
// chdir to the project folder base. Everything we want to do will be in relation to this location
logger.info("app.js: Changing process dir to project root: /lipd/nodejs/website");
process.chdir(__dirname);
var fs = require("fs");
var path = require("path");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var multer = require("multer");
var sys = require('sys');
var favicon = require('serve-favicon');
var routes = require('./routes/index');
var users = require('./routes/users');
//var port = process.env.PORT || 8080;
var app = express();

// Recursivley remove all lipd file data in the tmp folder that are older than
var cleanTmpDir = function(){
  // console.log("logging inside cleanTmpDir");
  // this code will only run when time has ellapsed
  var tmpDir = path.join(process.cwd(), "tmp");
  // logger.log("info", "Starting tmp cleaning...");
  console.log("app: Starting tmp cleaning...");
  try {
    fs.readdir(tmpDir, function(err, dirs) {
      // console.log("Started reading tmp dir");
      if(dirs){
        dirs.forEach(function(innerDir, index) {
          var _isDirectory = fs.lstatSync(path.join(tmpDir, innerDir)).isDirectory();
          // console.log("Is it a directory?: " + _isDirectory);
          // Only run the cleanup for directories. Not files.
          if(_isDirectory){
            fs.stat(path.join(tmpDir, innerDir), function(err, stat) {
              var endTime, now;
              if (err) {
                return console.error(err);
              }
              now = new Date().getTime();
              // 60000 - one minute
              // 300000 - five minutes
              // 3600000 - one hour
              endTime = new Date(stat.ctime).getTime() + 300000;
              if (now > endTime) {
                return rimraf(path.join(tmpDir, innerDir), function(err) {
                  if (err) {
                    return console.error(err);
                  }
                  // logger.log("info", 'Removed Folder: ' + innerDir);
                  console.log('app: Removed Dir: ' + innerDir);
                });
              }
            });
          } // end IF DIR
         });
      } else {
        console.log("No directories found");
      }
    });
  } catch(err){
    console.log(err);
  }

};

cleanTmpDir();

// Call the cleaning function every 5 minutes
setTimeout(cleanTmpDir, 300000);

// Multer functions to save uploaded files
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './tmp');
  },
  onFileUploadStart: function (file) {
    console.log("app: " + file.originalname + ' is starting ...');
  },
  onFileUploadComplete: function (file) {
    console.log("app: " + file.fieldname + ' uploaded to  ' + file.path);
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
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'routes', 'files')));
app.use(multer({ storage: storage }).single('file'));

// Give DB access to our routes
// app.use(function(req, res, next){
// 	req.db = db;
// 	next();
// });

// Attach the router to our app.
app.use('/', routes);
app.use('/users', users);

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
