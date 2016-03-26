/**
 * Set and get the scanner options
 * Created by kc on 29.11.15.
 */

const express = require('express');
const router = express.Router();
const scanner = require('../lib/scanner');
const networkPool = require('../lib/networkPool');
const logger = require('../lib/logger').getLogger('routes:scanner');

/**
 * Scans all networks
 */
router.post('/scanNetworks', function (req, res) {
  logger.info('/scanNetworks: scan all networks');
  scanner.scanNetworks(req.body);
  res.send({status: 'ok'});
});


/**
 * Scan a specific network
 */
router.post('/scanSpecificNetwork', function (req, res) {
  logger.info('/scanSpecificNetwork: only PAN ID ' + req.body.panId);
  scanner.scanSpecificNetwork(req.body);
  res.send(networkPool.getNetworkSurvey(req.body.panId));
});


module.exports = router;
