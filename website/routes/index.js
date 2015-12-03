var express = require('express');
var nodemailer = require('nodemailer');
// var sys = require('sys');
var router = express.Router();

// Nodemailer reusable transport object
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'cheiser22@gmail.com',
        pass: '122993HEelflip'
    }
});

// Home page
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

// Schema page
router.get('/schema', function(req, res, next){
    res.render('schema', {title: 'Schema'});
});

// Upload page
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

// Upload a new file
router.post('/upload', function(req, res, next){
  var result;
  // var db = req.db;
  // var collection = db.get('docs');
  console.log(req.file);
  // req.file.time = Date.now();
  // res.json(req.file);
  // collection.insert(req.file);

  // var result = "";
  // var py = require('child_process').spawn('python',
  // ['/Users/chrisheiser1/Documents/code/geoChronR/website/public/scripts/test.py']);
  // py.stdout.on('data', function(data){ result += data; });
  // py.stdout.on('close', function(code){
  //    if (code != 0) {
  //      return res.send(500, code);
  //    }
  //    return res.json(result);
  // });
});

// Browse the files in the database
router.get('/browse', function(req, res, next){
  var db = req.db;
  var collection = db.get('docs');
  var push;
  collection.find({},{},function(e,docs){push = docs;});
  res.render('browse', {title: 'Browse', docs: push});
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
// TESTING TESTING TESTING TESTING TESTING


module.exports = router;
