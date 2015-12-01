/**
 * Gets the complete data of the networks available
 */


'use strict';

var express = require('express');
var router = express.Router();
var networkPool = require('../lib/networkPool');

/**
 * Get ALL networks with its data known
 */
router.get('/', function (req, res) {
  res.send(networkPool.getNetworks());
});

module.exports = router;
