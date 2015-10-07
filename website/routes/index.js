var express = require('express');
var app = express();
var router = express.Router();

// Home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

// Receive a POST from the contact form on the home page
router.post('/', function(req, res, next){
  console.log(req);
  res.end("END");
});

// Schema page
router.get('/schema', function(req, res, next){
    res.render('schema', {title: 'Schema'});
});

// Upload page
router.get('/upload', function(req, res, next){
    res.render('upload', {title: 'Upload'});
});

// Upload page
router.post('/upload', function(req, res, next){
    console.log(req.file);
    res.json(req.file);
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




// pathName = encodeURIComponent(pathName);
// res.redirect(‘/annotate.html?path=’ + pathName);

module.exports = router;
