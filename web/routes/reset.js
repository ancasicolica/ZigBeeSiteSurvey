/**
 * Reset the MMB dongle
 * Created by kc on 03.12.15.
 */

const express = require('express');
const router = express.Router();
const core = require('../../core')();

/**
 * Scans all networks
 */
router.post('/', function (req, res) {
  core.resetDongle(function() {
    core.determineDongleType();
    res.send({status: 'ok'});
  });
});


module.exports = router;
