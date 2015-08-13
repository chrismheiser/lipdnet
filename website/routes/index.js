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

router.get('/test', function(req, res){
	res.render('test', {title: "playground"});
    // res.sendFile('/Users/chrisheiser1/Documents/Code/geoChronR/website/views/test.html', {title: "playground"});
});

module.exports = router;
