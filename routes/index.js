var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.status(404).json({ error: '404 - Not found, uses others urls' });
});


router.get('/ping', function(req, res, next) {
  res.status(200).json({ message: 'pong' });
});


module.exports = router;
