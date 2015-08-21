var express = require('express')
 , router = express.Router();

/* ROUTING TO OUR PROVIDED VIEWS. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

router.get('/index', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

router.get('/contact', function(req, res){
	res.render('contact', {title: 'Contact'});
});

router.get('/schema', function(req, res){
    res.render('schema', {title: 'Schema'});
});

router.get('/about', function(req, res){
	res.render('about', {title: 'About Us'});
});

router.get('/upload', function(req, res){
	res.render('upload', {title: "Upload"});
});

module.exports = router;
