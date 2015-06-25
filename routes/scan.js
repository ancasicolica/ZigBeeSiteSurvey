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
  networkScanRequest.start({}, function (err, networks) {
    if (err) {
      res.send({status: 'error', message: err.message});
    }
    else {
      res.send({status: 'ok', networks: networks});
    }
  });

});

/**
 * Get the ranking list
 */
router.get('/:channel/:panId', function (req, res) {
  networkScanRequest.start({channels: [req.params.channel], panId: req.params.panId}, function (err, networks) {
    if (err) {
      res.send({status: 'error', message: err.message});
    }
    else {
      res.send({status: 'ok', networks: networks});
    }
  });

});


module.exports = router;
