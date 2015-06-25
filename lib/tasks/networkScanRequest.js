/**
 * Performs a networkScanRequest
 * Created by kc on 23.06.15.
 */
'use strict';
var rapidConnector = require('../rapidConnector');
var settings = require('../../settings');
var _ = require('lodash');
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
    console.log('Data received:');
    console.log(data);
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

  // rapidConnector.writeFrame(DIAGNOSTICS_HEADER, NETWORK_SCAN_REQUEST, [0x07, 0xff, 0xf8, 0x00, 0x01], dataHandler);
  // LSB First for UINT32 values
  rapidConnector.writeFrame(DIAGNOSTICS_HEADER, NETWORK_SCAN_REQUEST, [0x00, 0xf8, 0xff, 0x07, 0x01], dataHandler);
  /*
    Resulting frames

   <Buffer fe d1 01 0f 19 a5 39 36 01 00 2c 00 bc 15 00 00 02 ff d4 e1 04>  RSSI in range -44
   <Buffer fe d1 01 0f 19 df d0 27 01 00 2c 00 bc 15 00 00 02 79 bc 05 05>  RSSI in range -70
                          ::::: ----------------------- xx ** -- --
                          PANID Extended PAN ID         PJ SP LQ RSSI
                          D0DF  0015...0127

   <Buffer fe d1 01 0f 19 df d0 27 01 00 2c 00 bc 15 00 00 02 e4 be 72 05>
   <Buffer fe d1 01 0f 19 a5 39 36 01 00 2c 00 bc 15 00 00 02 ff d6 e3 04>

   <Buffer fe d1 01 0f 19 df d0 27 01 00 2c 00 bc 15 00 00 02 e6 be 74 05>
   <Buffer fe d1 01 0f 19 a5 39 36 01 00 2c 00 bc 15 00 00 02 ff d4 e1 04>

   <Buffer fe d1 01 0f 19 a5 39 36 01 00 2c 00 bc 15 00 00 02 ff d0 dd 04>
   <Buffer fe d1 01 0f 19 df d0 27 01 00 2c 00 bc 15 00 00 02 bf bb 4a 05>

   <Buffer fe d1 01 0f 19 a5 39 36 01 00 2c 00 bc 15 00 00 02 ff ce db 04>
   <Buffer fe d1 01 0f 19 df d0 27 01 00 2c 00 bc 15 00 00 02 e9 bd 76 05>

   <Buffer fe d1 01 0f 19 a5 39 36 01 00 2c 00 bc 15 00 00 02 ff cf dc 04>
   <Buffer fe d1 01 0f 19 df d0 27 01 00 2c 00 bc 15 00 00 02 dd bc 69 05>

   unsigned char:
   x00 .. x7f: 0 - 127
   x7f .. xff: -128 - -1

   positive -> negative number: bitwise invert, +1
   negative -> positive: bitwise invert -1
   */
};

/**
 * Simulation handling with dummy data
 * @param callback
 */
var simulator = function(callback) {
  function generateRandomEntry() {
    return({
      channel: _.random(11,26),
      panId: _.random(1,65500),
      extendedPanId: 'dummy',
      permitJoin: _.random(0,1),
      stackProfile: 2,
      lqi: _.random(180,255),
      rssi: _.random(-80, -40)
    });
  }
  var networkNb = _.random(0,7);
  var result = [];
  for (var i = 0; i < networkNb; i++) {
    result.push(generateRandomEntry());
  }
  callback(null, result);
};

// Choose which handler to take
var handler = rapidConnectHandling;
if (settings.simulator) {
  handler = simulator;
}

module.exports = {
  start: handler
};
