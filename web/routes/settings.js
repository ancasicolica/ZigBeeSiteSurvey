/**
 * Settings API
 * Created by kc on 29.06.15.
 */

const express = require('express');
const router = express.Router();
const settings = require('../../settings');
const core = require('../../app/core')();
const rapidConnector = core.getRapidConnector();

/**
 * Get all networks
 */
router.get('/', function (req, res) {
  res.send({status: 'ok', settings: settings, serialport: rapidConnector.getCurrentSerialPort(), usbDongle: core.getDongleInfo()});
});

module.exports = router;
