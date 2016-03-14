/**
 * Get Wifi Activity
 * Created by kc on 14.03.16.
 */

const express = require('express');
const router = express.Router();
const wifiScanner = require('../lib/wifiScanner');
const networkPool = require('../lib/networkPool');
const logger = require('../lib/logger').getLogger('routes:wifi');

/**
 * Scans all wifi networks
 */
router.get('/', (req, res) => {
  logger.info('/: get all networks');
  wifiScanner.scan((err, networks) => {
    if (err) {
      return res.status(500).send({message: err.message});
    }
    res.send({status: 'ok', networks: networks});
  });
});

module.exports = router;

