/**
 * Reset the MMB dongle
 * Created by kc on 03.12.15.
 */

'use strict';

var express = require('express');
var router = express.Router();
var resetModule = require('../lib/tasks/resetModule');
var determineDongleType = require('../lib/tasks/determineDongleType');

/**
 * Scans all networks
 */
router.post('/', function (req, res) {
  resetModule.run(function() {
    determineDongleType.run();
    res.send({status: 'ok'});
  });
});


module.exports = router;
