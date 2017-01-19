var express = require('express');
var nodemailer = require('nodemailer');
// var zip = require("adm-zip");
var fs = require("fs");
var request = require("request");
var archiver = require('archiver');
var StringStream = require('string-stream');
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
  // get request data about file
  var files = req.body.file;
  var filename = req.body.filename;
  // create path where file will be on server
  var path = __dirname + "/files/" + filename;

  // zip with archiver module

  // console.log("create write stream")
  var output = fs.createWriteStream(path);
  var archive = archiver('zip');

  output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      res.send(filename);
  });

  archive.on('error', function(err){
      console.log("archive error");
      throw err;
  });

  // console.log("pipe output")
  archive.pipe(output);

  files.forEach(function(file){
    // console.log(file.filename);
    // console.log(typeof(file.dat));
    archive.append(file.dat, { name: file.filename });
  });

  // console.log("finalize");
  archive.finalize();

});

router.get("/files/:filename", function(req, res, next){
  var filename = req.params.filename;
  var path = __dirname + "/files/" + filename;
  if (fs.existsSync(path)) {
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', "application/zip");
    res.download(path);
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
