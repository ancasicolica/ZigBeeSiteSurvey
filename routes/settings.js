/**
 * Settings API
 * Created by kc on 29.06.15.
 */

const express = require('express');
const router = express.Router();
const _ = require('lodash');
const settings = require('../settings');
const rapidConnector = require('../lib/rapidConnector');
const dongleType = require('../lib/tasks/determineDongleType');

/**
 * Get all networks
 */
router.get('/', function (req, res) {
  res.send({status: 'ok', settings: settings, serialport: rapidConnector.getCurrentSerialPort(), usbDongle: dongleType.getInfo()});
});

module.exports = router;
