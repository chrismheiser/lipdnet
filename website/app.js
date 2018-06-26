// app.js
var express = require('express');
var process = require("process");
var port = process.env.PORT || 3000;
var logger = require("./node_modules_custom/node_log.js");
var rimraf = require("rimraf");
// chdir to the project folder base. Everything we want to do will be in relation to this location
// logger.info("app.js: Changing process dir to project root: /lipd/nodejs/website");
process.chdir(__dirname);
var fs = require("fs");
var path = require("path");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var logger = require('morgan');
var multer = require("multer");
var sys = require('sys');
var favicon = require('serve-favicon');
var routes = require('./routes/index');
var users = require('./routes/users');
var app = express();


// Get a list of all the directories in the Tmp folder.
var getDirectories = function(srcpath) {
  return fs.readdirSync(srcpath)
    .filter(function(file){
      if(fs.lstatSync(path.join(srcpath, file)).isDirectory()){
        return file;
      }
    });
};

// Recursivley remove all lipd file data in the tmp folder that are older than
var cleanTmpDir = function(){
  // this code will only run when time has elapsed

  var tmpDir = path.join(process.cwd(), "tmp");
  logger.info("app: Starting tmp cleaning...");
  try {
    var _dirs = getDirectories(tmpDir);
    // logger.info("Tmp Directories: [" + _dirs + "]");
    if(_dirs){
      _dirs.forEach(function(innerDir, index) {
        // console.log("Is it a directory?: " + _isDirectory);
        // Only run the cleanup for directories. Not files.
          fs.stat(path.join(tmpDir, innerDir), function(err, stat) {
            var endTime, now;
            if (err) {
              return console.error(err);
            }
            now = new Date().getTime();
            // 60000 - one minute
            // 300000 - five minutes
            // 3600000 - one hour
            endTime = new Date(stat.ctime).getTime() + 60000;
            if (now > endTime) {
              return rimraf(path.join(tmpDir, innerDir), function(err) {
                if (err) {
                  return console.error(err);
                }
                logger.info("app: Removed Dir: " + innerDir);
              });
            }
          });
       });
    }
  } catch(err){
    logger.info(err);
  }

};

// Call the cleaning function every 5 minutes
setTimeout(cleanTmpDir, 100000);

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

if (port === 3000){
  app.set("environment", "development");
} else {
  app.set("environment", "production");
}


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'routes', 'files')));
app.use(multer({ storage: storage, limits:{ fieldSize: 25 * 1024 * 1024 }}).single('file'));

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
  res.status(404).render('404');
});

// development error handler
// will print stacktrace
if (app.get("environment") === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    logger.info(err.message);
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
  logger.info('app: Node port: ', app.get('port'));
  logger.info("app: Node Env: ", app.get("environment"));
});

module.exports = app;
