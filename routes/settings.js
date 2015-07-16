/**
 * Settings API
 * Created by kc on 29.06.15.
 */
'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var settings = require('../settings');
var rapidConnector = require('../lib/rapidConnector');
var dongleType = require('../lib/tasks/determineDongleType');

/**
 * Get all networks
 */
router.get('/', function (req, res) {
  res.send({status: 'ok', settings: settings, serialport: rapidConnector.getCurrentSerialPort(), usbDongle: dongleType.getInfo()});
});

module.exports = router;
