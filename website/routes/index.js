var express = require('express');
var nodemailer = require('nodemailer');
var fs = require("fs");
var archiver = require('archiver');
var gladstone = require('gladstone');
var path = require("path");
var step = require("../node_modules/step/step");
var request = require("request");
var process = require("process");

// var sys = require('sys');
var router = express.Router();

// Nodemailer reusable transport object
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'lipd.contact@gmail.com',
        pass: 'aC9Un3Fudd2eJ0loU1wiT1'
    }
});

var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch(e) {
    if ( e.code != 'EEXIST' ) throw e;
  }
}


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
};

// Get the home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

// Receive a POST from the contact form on the home page
router.post('/', function(req, res, next){
  console.log(req.body);

  // use req data from contact form to build email object
  var mailOptions = {
      from: req.body.name + ' <' + req.body.email + '>',
      to: "LiPD Contact Form <" + req.body.email + '>',
      subject: "Message from " + req.body.name,
      text: "Organization:\n" + req.body.org + "\n\nSubject:\n" +
      req.body.subject + "\n\nMessage:\n" + req.body.message
  };
  // send mail with transport object and defined mail options
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      console.log('Message sent: ' + info.response);
  });
});

// Get the schema page
router.get('/schema', function(req, res, next){
    res.render('schema', {title: 'Schema'});
});

// Get the upload page
router.get('/upload', function(req, res, next){
  res.render('upload', {title: 'Upload'});
});

router.post("/files", function(req, res, next){
  // set data about the file
  var files = req.body.file;
  var filename = req.body.filename;

  // path that stores lipds
  var pathTop = path.join(__dirname, "files");

  // create tmp folder at "/files/<lipd-xxxxx>"
  var pathTmp = fs.mkdtempSync(path.join(pathTop, "lipd-"), (err, folder) => {
    if (err) throw err;
    console.log(folder);
  });

  console.log("tmp path: " + pathTmp);

  // tmp bagit level folder. will be removed before zipping.
  var pathTmpBag = path.join(pathTmp, "bag");
  var pathTmpZip = path.join(pathTmp, "zip");
  var pathTmpFiles = path.join(pathTmp, "files");

  mkdirSync(pathTmpZip);
  mkdirSync(pathTmpFiles);

  console.log("created dir: " + pathTmpZip);
  console.log("created dir: " + pathTmpFiles);

  // use req data to write csv and jsonld files into "/files/<lipd-xxxxx>/files/"
  files.forEach(function(file){
    console.log("writing: " + path.join(pathTmpFiles,  file.filename));
    fs.writeFileSync(path.join(pathTmpFiles, file.filename), file.dat);
  });

  console.log("Initiate Bagit...");
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
        console.log("Send to Client: " + path.basename(pathTmp));
        res.send(path.basename(pathTmp));
      });
    }
  });
  console.log("POST complete");
});

router.get("/files/:tmp", function(req, res, next){
  // Tmp string provided by client
  var tmpStr = req.params.tmp;
  // Path to the zip dir that holds the LiPD file
  var pathTmpZip = path.join(__dirname, "files", tmpStr, "zip");
  // Read in all filenames from the dir
  var files = fs.readdirSync(pathTmpZip);
  // Loop over the files found
  for(var i in files) {
    // Get the first lipd file you find (there should only be one)
     if(path.extname(files[i]) === ".lpd") {
       // set headers and initiate download.
       var pathLipd = path.join(pathTmpZip, files[i]);
       res.setHeader('Content-disposition', 'attachment; filename=' + files[i]);
       res.setHeader('Content-type', "application/zip");
       res.download(pathLipd);
     }
  }
});

// Get the browse page
// This finds every document since there's no parameters
router.get('/browse', function(req, res, next){
  var db = req.db;
  var collection = db.get('docs');
  var push;
  collection.find({},{},function(e,docs){push = docs;});
  res.render('browse', {title: 'Browse', docs: push});
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

// TESTING TESTING TESTING TESTING TESTING
router.get('/test', function(req, res, next){
  res.render('test', {title: 'Test'});
});

router.post('/test', function(req, res, next){
  console.log(req.file);
  res.json(req.file);
  res.end("END");
});

module.exports = router;
