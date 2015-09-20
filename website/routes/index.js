var express = require('express')
 , router = express.Router();

/* ROUTING TO OUR PROVIDED VIEWS. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

router.get('/index', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

router.get('/schema', function(req, res){
    res.render('schema', {title: 'Schema'});
});

router.get('/upload', function(req, res){
	res.render('form', {title: "Walk-through"});
});

module.exports = router;
