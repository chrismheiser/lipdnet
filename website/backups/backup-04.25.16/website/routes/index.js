var express = require('express')
 , router = express.Router();

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

module.exports = router;
