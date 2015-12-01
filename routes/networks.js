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


/**
 * Get ALL networks with its data known and clear the memory. This function can be used for factory
 * purposes: see if a network is available, then forget about it.
 */
router.get('/flush', function (req, res) {
  var networks = networkPool.getNetworks();
  networkPool.reset();
  res.send(networks);
});


module.exports = router;
