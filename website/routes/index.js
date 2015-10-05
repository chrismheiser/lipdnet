var express = require('express');
var app = express();
var router = express.Router();



/* ROUTING TO OUR PROVIDED VIEWS. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

router.get('/index', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

router.get('/schema', function(req, res, next){
    res.render('schema', {title: 'Schema'});
});

router.get('/upload', function(req, res, next){
    res.render('upload', {title: 'Upload'});
});

router.get('/test', function(req, res, next){
  res.render('test', {title: 'Test'});
});

router.post('/test', function(req, res, next){
  console.log(req.file);
  res.json(req.file);
  res.end("END");
});

// pathName = encodeURIComponent(pathName);
// res.redirect(‘/annotate.html?path=’ + pathName);

module.exports = router;
