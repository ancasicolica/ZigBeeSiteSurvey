/**
 * Settings API
 * Created by kc on 29.06.15.
 */
'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var settings = require('../settings');

/**
 * Get all networks
 */
router.get('/', function (req, res) {
  res.send({status: 'ok', settings: settings});
});

module.exports = router;
