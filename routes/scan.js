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
  console.log('/all');
  try {
    networkScanRequest.start({}, function (err, networks) {
      console.log('   callback');
      if (err) {
        res.send({status: 'error', message: err.message});
      }
      else {
        res.send({status: 'ok', networks: networks});
      }

    });
  }
  catch(e) {
    console.error(e);
  }
});


module.exports = router;
