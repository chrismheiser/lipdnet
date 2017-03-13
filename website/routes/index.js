var express = require('express');
var fs = require("fs");
var archiver = require('archiver');
var gladstone = require('gladstone');
var path = require("path");
var process = require("process");
var lipdValidator = require("../public/scripts/validator_node.js");
var router = express.Router();

// create a directory, but catch error when the dir already exists.
var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch(e) {
    if ( e.code == 'EEXIST' ){
      console.log("folder exists: " + path);
    } else {
      console.log(e);
    }
  }
};

// create a random string of numbers/letters for the TMP folder
var makeid = function(prefix, cb){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    cb(prefix + text);
    return prefix + text;
};

// use the archiver model to create the LiPD file
var createArchive = function(pathTmpZip, pathTmpBag, filename, cb){
  console.log("Creating ZIP/LiPD archive...");
  var archive = archiver('zip');
  // path where the LiPD will ultimately be located in "/zip" dir.
  var pathTmpZipLipd = path.join(pathTmpZip, filename);
  // open write stream to LiPD file location
  var output = fs.createWriteStream(pathTmpZipLipd);
  console.log("Write Stream Open: " + pathTmpZipLipd);

  // "close" event. processing is finished.
  output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      // console.log('archiver has been finalized and the output file descriptor has closed.');
      console.log("LiPD Created at: " + pathTmpZipLipd);
      // callback to finish POST request
      cb();
  });

  // error event
  archive.on('error', function(err){
      console.log("archive error");
      throw err;
  });

  archive.pipe(output);
  // Add the data directory to the archive
  console.log("add dir to archive");
  try{
    // read in all filenames from the "/bag" dir
    var files = fs.readdirSync(pathTmpBag);
    for(var i in files) {
      // current file to process
      var currPath = path.join(pathTmpBag, files[i]);

      // if this is a bagit file (.txt), use "archive.file"
      if(path.extname(files[i]) === ".txt") {
        console.log("archiving file from: " + currPath);
        console.log("archiving file to: " + files[i]);
        archive.file(currPath, { name: files[i]});

      }
      // if this is the "/data" directory, use "archive.directory"
      else {
        console.log("archiving dir from: " + currPath);
        console.log("archiving dir to: /" + files[i]);
        archive.directory(currPath, "/" + files[i]);
      }

    }

  }catch(err){
    console.log(err);
  }

  // all files are done, finalize the archive
  archive.finalize();
}; // end createArchive

// Get the home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

// Receive a POST from the contact form on the home page
router.post('/', function(req, res, next){
  console.log(req.body);

});

// Get the schema page
router.get('/schema', function(req, res, next){
    res.render('schema', {title: 'Schema'});
});

// Get the upload page
router.get('/validator', function(req, res, next){
  res.render('validator', {title: 'Validator'});
});

router.post("/files", function(req, res, next){
  console.log("POST: /files");

  // set data about the file
  var files = req.body.file;
  var filename = req.body.filename;
  console.log("POST: build path names");

  // path that stores lipds
  var pathTop = path.join(process.cwd(), "tmp");
  var _pathTmpPrefix = path.join(pathTop, "lipd-");
  // create tmp folder at "/files/<lipd-xxxxx>"
  console.log("POST: creating tmp dir...");
  var pathTmp = makeid(_pathTmpPrefix, function(_pathTmp){
    console.log("POST: created tmp dir str: " + _pathTmp);
    mkdirSync(_pathTmp);
    return _pathTmp;
  });

  console.log("POST: tmp path: " + pathTmp);

  // tmp bagit level folder. will be removed before zipping.
  var pathTmpBag = path.join(pathTmp, "bag");
  var pathTmpZip = path.join(pathTmp, "zip");
  var pathTmpFiles = path.join(pathTmp, "files");

  console.log("POST: make other dirs...");
  mkdirSync(pathTmpZip);
  mkdirSync(pathTmpFiles);

  console.log("POST: created dir: " + pathTmpZip);
  console.log("POST: created dir: " + pathTmpFiles);

  // use req data to write csv and jsonld files into "/files/<lipd-xxxxx>/files/"
  console.log("POST: begin writing files");
  files.forEach(function(file){
    console.log("POST: writing: " + path.join(pathTmpFiles,  file.filename));
    fs.writeFileSync(path.join(pathTmpFiles, file.filename), file.dat);
  });

  console.log("POST: Initiate Bagit...");
  // Call bagit process on folder of files
  gladstone.createBagDirectory({
     bagName: pathTmpBag,
     originDirectory: pathTmpFiles,
     cryptoMethod: 'md5',
     sourceOrganization: 'LiPD Project',
     contactName: 'Chris Heiser',
     contactEmail: 'lipd.contact@gmail.com',
     externalDescription: 'Source: LiPD Online Validator'
  }).then(function(resp){
    // When a successful Bagit Promise returns, start creating the ZIP/LiPD archive
    if(resp){
      createArchive(pathTmpZip, pathTmpBag, filename, function(){
        console.log("POST: response: " + path.basename(pathTmp));
        res.send(path.basename(pathTmp));
      });
    }
  });
  console.log("POST complete");
});

router.get("/files/:tmp", function(req, res, next){
  // Tmp string provided by client
  console.log("GET: /files");
  var tmpStr = req.params.tmp;
  console.log("GET: tmpStr: " + tmpStr);
  // Path to the zip dir that holds the LiPD file
  var pathTmpZip = path.join(process.cwd(), "tmp", tmpStr, "zip");
  console.log("GET: " + pathTmpZip);
  // Read in all filenames from the dir
  console.log("GET: read zip dir");
  var files = fs.readdirSync(pathTmpZip);
  // Loop over the files found
  for(var i in files) {
    // Get the first lipd file you find (there should only be one)
     if(path.extname(files[i]) === ".lpd") {
       // set headers and initiate download.
       var pathLipd = path.join(pathTmpZip, files[i]);
       res.setHeader('Content-disposition', 'attachment; filename=' + files[i]);
       res.setHeader('Content-type', "application/zip");
       console.log("sending response to client.");
       res.download(pathLipd);
     }
  }
});

router.get("/create", function(req, res, next){
  res.render('create', {title: 'Create & Edit LiPD'});
});

router.get("/modal", function(req, res, next){
  res.render('modal', {title: ''});
});

router.get("/modalJson", function(req, res, next){
  res.render('modalJson', {title: ''});
});

router.get("/modalCsv", function(req, res, next){
  res.render('modalCsv', {title: ''});
});

router.get("/modalTxt", function(req, res, next){
  res.render('modalTxt', {title: ''});
});

// API
router.get("/api/validator", function(req, res, next){
  console.log("enter /api/validator");
  // We are using this as a validation call for our desktop utilities.
  // GET with some JSON, and we'll tell you if it pass/fail and what errors came up.

  try {
    // receive some json data
    console.log("Parsing JSON request");
    var json_data = JSON.parse(req.body["json_payload"]);
    console.log("Starting process...");
    lipdValidator.sortBeforeValidate(json_data, function(j){
      console.log("sortBeforeValidate callback: sending to validate");
      lipdValidator.validate(j, function(x){
        try {
          console.log("Validate callback, preparing response");
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify(x, null, 3));
          console.log("Response sent to origin");
        } catch(err) {
          console.log("Error trying to prepare response. Ending request: " + err);
          res.end();
        }
      });
    });
  } catch(err) {
    console.log("Error: overall process failed: " + err);
    res.end();
  }

  console.log("exit /api/validator");
});


module.exports = router;
