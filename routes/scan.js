/**
 * Scan API
 * Created by kc on 25.06.15.
 */
'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var networkScanRequest = require('../lib/tasks/networkScanRequest');

/**
 * Get the ranking list
 */
router.get('/all', function (req, res) {
  networkScanRequest.start(function(err, networks) {
    if (err) {
      return res.send({status:'error', message:err.message});
    }
    res.send({status:'ok', networks:networks});
  });
});


module.exports = router;
