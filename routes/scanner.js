/**
 * Set and get the scanner options
 * Created by kc on 29.11.15.
 */

'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var scanner = require('../lib/scanner');
/**
 * Get options
 */
router.get('/options', function (req, res) {
  res.send({status: 'ok', options: scanner.getOptions()});
});

/**
 * set options
 */
router.post('/options', function (req, res) {
  console.log(req);
  // Todo: extract information for scanner
  res.send({status: 'ok'});

});


module.exports = router;
