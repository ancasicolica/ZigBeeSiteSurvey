/**
 * Performs a networkScanRequest
 * Created by kc on 23.06.15.
 */
'use strict';
var rapidConnector = require('../rapidConnector');
var settings = require('../../settings');

var DIAGNOSTICS_HEADER = 0xd1;
var NETWORK_SCAN_REQUEST = 0x00;
var NETWORK_SCAN_RESPONSE = 0x01;
var NETWORK_SCAN_COMPLETE = 0x02;

var foundNetworks;

/**
 * The real handler with RapidConnect
 * @param callback
 */
var rapidConnectHandling = function (callback) {
  foundNetworks = [];

  var dataHandler = function (data) {

    if (data[1] === DIAGNOSTICS_HEADER && data[2] === NETWORK_SCAN_RESPONSE) {
      var network = {};
      network.channel = data[4];
      network.panId = 0; // Todo
      network.extendedPanId = 0; // Todo
      network.permitJoin = (data[15] === 0x01);
      network.stackProfile = data[16];
      network.lqi = data[17];
      network.rssi = data[18];
      foundNetworks.push(network);
    }
    else if (data[1] === DIAGNOSTICS_HEADER && data[2] === NETWORK_SCAN_COMPLETE) {
      if (data[4] === 0x01) {
        return callback(new Error('Busy/Unable to Initiate Scan'));
      }
      // finished the scan
      callback(null, foundNetworks);
    }
  };

  rapidConnector.writeFrame(DIAGNOSTICS_HEADER, NETWORK_SCAN_REQUEST, [0x07, 0xff, 0xf8, 0x00, 0x01], dataHandler);
};

/**
 * Simulation handling with dummy data
 * @param callback
 */
var simulator = function(callback) {
  callback(null, [{channel: 1}]);
};

// Choose which handler to take
var handler = rapidConnectHandling;
if (settings.simulator) {
  handler = simulator;
}

module.exports = {
  start: handler
};
