var express = require('express');
var nodemailer = require('nodemailer');
var zip = require("adm-zip");
var fs = require("fs");
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



// router.get('/upload/paths', function(req, res, next){
//   var db = req.db;
//   var collection = db.get('docs');
//   collection.find({},{},function(e,docs){
//     res.json(docs);
//   });
// });

// Upload a file from the upload page, and insert it into the database
// router.post('/upss', function(req, res, next){
//   var result;
//   console.log(req.file);
//   req.file.time = Date.now();
//   res.json(req.file);
// });

// Upload a file from the upload page, and insert it into the database
// router.post('/updb', function(req, res, next){
//   var result;
//   var db = req.db;
//   var collection = db.get('docs');
//   console.log(req.file);
//   req.file.time = Date.now();
//   res.json(req.file);
//   collection.insert(req.file);
// });

router.post("/zipup", function(req, res, next){
  // get request data about file
  var files = req.body.file;
  var filename = req.body.filename;
  console.log("Enter /zipup route");
  // console.log(files);
  // create path where file will be on server
  var path = __dirname + "/zips/" + filename;
  console.log("creating path: " + path);

  // create the zip file
  console.log("creating zip: " + filename)
  var zipper = new zip();
  files.forEach(function(file){
    console.log("add file to zip: " + file.filename);
    zipper.addFile(file.filename, file.dat);
  });
  // store the zip on the server d
  console.log("Write zip to server");
  zipper.writeZip(path, function(){
    fs.stat(path, function(err, stat) {
        if(err == null) {
            console.log('File exists');
        } else if(err.code == 'ENOENT') {
            console.log("file does not exist");
        } else {
            console.log('Some other error: ', err.code);
        }
    });

  });

  //
  // var archive = archiver('zip');
  //
  // //on stream closed we can end the request
  // archive.on('end', function() {
  //   console.log('Archive wrote %d bytes', archive.pointer());
  // });
  // res.attachment(filename);
  // archive.pipe(res);
  // files.forEach(function(file){
  //   var buffer3 = new Buffer(file.dat);
  //   archive.append(buffer3, { name: file.filename });
  // });
  // archive.finalize();

  // // set up response and point to zip on server
  // res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  // res.setHeader('Content-type', "application/zip");
  //
  // // send response
  // console.log("create filestream");
  // var filestream = fs.createReadStream(path);
  // filestream.pipe(res);
  // res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  // res.setHeader('Content-type', mimetype);
  // res.download(path);
  console.log("end /zipup route");

});

router.get("/zipdwn", function(req, res, next){
  console.log("enter /zipdwn route");
  var filename = req.body.filename;
  var path = __dirname + "/zips/" + filename;
  console.log("retrieving path: " + path);

  // send response
  console.log("create filestream");
  var filestream = fs.createReadStream(path);
  filestream.pipe(res);
  res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  res.setHeader('Content-type', mimetype);
  res.download(path);
  console.log("end /zipdwn route");
});

// Download a validated LiPD file, or a file chosen from browsing the DB, to users computer
// router.post("/dwn", function(req, res, next){
//   var result;
//   var db = req.db;
//   var collection = db.get('docs');
//   console.log(req.file);
//   req.file.time = Date.now();
//   res.json(req.file);
//   collection.insert(req.file);
// });

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

// Get the upload page
// router.get('/upload-tree', function(req, res, next){
//   res.render('upload-tree', {title: 'Upload JSON Tree'});
// });
// TESTING TESTING TESTING TESTING TESTING


module.exports = router;
