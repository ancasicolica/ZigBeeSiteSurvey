/**
 * Reset the MMB dongle
 * Created by kc on 03.12.15.
 */

const express = require('express');
const router = express.Router();
const resetModule = require('../lib/tasks/resetModule');
const determineDongleType = require('../lib/tasks/determineDongleType');

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
