/**
 * ZigBee Site Survey Main Application File
 *
 * Created by kc on 23.06.15.
 */
'use strict';

var rapidConnector = require('./lib/rapidConnector');
var networkScanRequest = require('./lib/tasks/networkScanRequest');
var settings = require('./settings');
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World')
});

app.listen(settings.port);

rapidConnector.init(function (err) {
  if (err) {
    console.error(err);
    return;
  }

  networkScanRequest.start(function(err, networks) {
    if (err) {
      console.error(err);
    }
    else {
      console.log('Finished scan, networks found: ' + networks.length);
    }
  });
});
