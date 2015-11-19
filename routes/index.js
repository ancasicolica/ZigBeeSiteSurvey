/**
 *
 * Created by kc on 25.06.15.
 */
'use strict';
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', {title: 'ZigBee Site Survey'});
});
router.get('/test', function (req, res) {
  res.render('test', {title: 'ZigBee Site Survey'});
});

module.exports = router;
