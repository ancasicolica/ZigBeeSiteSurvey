/**
 * Gets the complete data of the networks available
 */

'use strict';

var express = require('express');
var router = express.Router();
var networkPool = require('../lib/networkPool');
var scanner = require('../lib/scanner');
var networkScanRequest = require('../lib/tasks/networkScanRequest');

var logger = require('../lib/logger').getLogger('routes:networks');
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



/**
 * 2nd variant for factory: scan once, get networks (if scanner is active, it's just getting the pool data)
 */
router.get('/scan', function (req, res) {
  if (scanner.isEnabled()) {
    return res.send(networkPool.getNetworks());
  }

  networkScanRequest.start({}, function(err, networks) {
    if (err) {
      logger.error('scan request failed', err);
      return res.sendStatus(500);
    }
    return res.send(networks);
  });
});

/**
 * Removes a network from the pool
 */
router.post('/remove/:extendedPanId', function(req, res) {
  networkPool.remove(req.params.extendedPanId);
  res.send({numberOfNetworks: networkPool.getNetworks().length});
});

module.exports = router;
