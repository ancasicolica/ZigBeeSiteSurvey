/**
 * Performs a networkScanRequest
 * Created by kc on 23.06.15.
 */
'use strict';
var rapidConnector = require('../rapidConnector');
var settings = require('../../settings');
var logger = require('../logger').getLogger('tasks:networkScanRequest');
var _ = require('lodash');
var util = require('util');
var DIAGNOSTICS_HEADER = 0xd1;
var NETWORK_SCAN_REQUEST = 0x00;

var lastLqi = 250;
var lastRssi = -50;

/**
 * Constructor
 * @param options
 * @constructor
 */
var NetworkScanRequest = function (options) {
  this.options = options;
  this.foundNetworks = [];
};

/**
 * The real handler with RapidConnect
 * @param callback
 */
NetworkScanRequest.prototype.rapidConnectHandling = function (callback) {
  this.foundNetworks = [];

  var self = this;

  if (!rapidConnector.isConnected()) {
    logger.debug('not connected, scanning not possible');
    return callback(new Error('not connected'));
  }

  /**
   * Handler for the network scan responses
   * @param data
   */
  function networkScanResponseListener(data) {
    logger.debug('D101');
    try {
      var network = {};
      network.channel = data[0];
      network.panId = (data[1] + data[2] * 256).toString(16).toUpperCase();
      network.extendedPanId = '';
      for (var i = 10, t = 0; i > 2; i--, t++) {
        if (data[i] < 17) {
          network.extendedPanId += '0';
        }
        network.extendedPanId += data[i].toString(16).toUpperCase();
        if (t % 2) {
          network.extendedPanId += ' ';
        }
      }
      network.extendedPanId = _.trim(network.extendedPanId);

      // Develco device scan - added for KABA purposes. If you want to scan for own devices (MAC ranges), add it here.
      if (_.startsWith(network.extendedPanId, '0015 BC')) {
        network.isDevelcoDevice = true;
      }

      network.permitJoin = (data[11] === 0x01) ? 'yes' : 'no';
      network.stackProfile = data[12];
      network.lqi = data[13];
      network.found = true;
      if (data[14] < 128) {
        network.rssi = data[14];
      }
      else {
        network.rssi = data[14] - 256;
      }
      logger.debug('Result: ' + network.panId + ' ' + network.rssi);
      self.foundNetworks.push(network);
    }
    catch (e) {
      logger.debug('Exception in networkScanResponseListener');
      logger.error(util.inspect(e));
    }
  }

  // What happens when the USB dongle is disconnected during the scan
  function disconnectHandler() {
    rapidConnector.removeListener('d1-1', networkScanResponseListener);
    rapidConnector.removeListener('d1-2', scanFinishedHandler);
    rapidConnector.removeListener('close', disconnectHandler);
    callback(new Error('disconnected'));
  }

  // What happens when the scan is finished
  function scanFinishedHandler(data) {
    logger.debug('D102');
    try {
      rapidConnector.removeListener('d1-1', networkScanResponseListener);
      rapidConnector.removeListener('close', disconnectHandler);

      var timeoutTimer;

      if (data[0] === 0x01) {
        // Todo: not sure about this, looks like a busy is followed by an ok, avoid double callback calls
        logger.debug('D102 - Busy');

        timeoutTimer = setTimeout(function() {
          logger.info('Timeout timer - task did not proprely finish!');
          callback(new Error('Timeout: busy/unable to Initiate Scan'));
        }, 5000);

      }
      else {
        // finished the scan, return the found network(s)
        logger.debug('D102 - Finished');
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        if (self.options.panId) {
          // Filter: return only the networks with correct panId this one is supplied
          self.foundNetworks = _.filter(self.foundNetworks, function (n) {
            return (n.panId === self.options.panId);
          });
          if (self.foundNetworks.length === 0) {
            // But return at least one with minimal data
            logger.debug('Network not found, adding empty data');
            self.foundNetworks.push({
              permitJoin: 'no',
              stackProfile: 0,
              panId: self.options.panId || '0000',
              channel: self.options.channel || 0,
              extendedPanId: '0000 0000 0000 0000',
              rssi: settings.levels.min,
              lqi: 0,
              found: false
            });
          }
        }
        callback(null, self.foundNetworks);
      }
    }
    catch (e) {
      logger.debug('Exception in scanFinishedHandler, try to recover');
      logger.error(util.inspect(e));
      callback(e);
    }
  }

  // Register on Events: close
  rapidConnector.on('close', disconnectHandler);

  // NETWORK_SCAN_RESPONSE
  rapidConnector.on('d1-1', networkScanResponseListener);

  // NETWORK_SCAN_COMPLETE
  rapidConnector.once('d1-2', scanFinishedHandler);


// Create the payload of the frame out of the options (and some defaults)
  var scanDuration = self.options.scanDuration || 0x03;
  var channels = self.options.channels || [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
  var channelMask = 0;
  for (var i = 0; i < channels.length; i++) {
    channelMask |= (1 << channels[i]);
  }
  var payload = [];
  payload.push(channelMask & 0xff);
  payload.push((channelMask & 0xff00) >> 8);
  payload.push((channelMask & 0xff0000) >> 16);
  payload.push((channelMask & 0xff000000) >> 24);
  payload.push(scanDuration);

// LSB First for UINT32 values
// rapidConnector.writeFrame(DIAGNOSTICS_HEADER, NETWORK_SCAN_REQUEST, [0x00, 0xf8, 0xff, 0x07, scanDuration], dataHandler);
  rapidConnector.writeFrame(DIAGNOSTICS_HEADER, NETWORK_SCAN_REQUEST, payload);
  /*
   Resulting frames
   __________0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
   <Buffer fe d1 01 0f 19 a5 39 36 01 00 2c 00 bc 15 00 00 02 ff d4 e1 04>  RSSI in range -44
   <Buffer fe d1 01 0f 19 df d0 27 01 00 2c 00 bc 15 00 00 02 79 bc 05 05>  RSSI in range -70
   ___________::::: ----------------------------------- xx ** -- --
   ___________PANID Extended PAN ID                     PJ SP LQ RSSI
   ____________D0DF  0015...0127

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
   128    255
   */
};

/**
 * Simulation handling with dummy data
 * @param callback
 */
NetworkScanRequest.prototype.simulator = function (callback) {
  function generateRandomNetworkEntry() {

    return ({
      channel: _.random(11, 26),
      panId: _.random(1, 65500).toString(16),
      extendedPanId: 'dummy',
      permitJoin: (_.random(0, 1) === 1),
      stackProfile: 2,
      lqi: _.random(180, 255),
      rssi: _.random(-80, -40),
      found: true
    });
  }

  var result = [];

  if (this.options.panId) {
    // Only one network shall be scanned
    var newLqi = lastLqi + _.random(-1, 1);
    if (newLqi > 255 || newLqi < 1) {
      newLqi = lastLqi;
    }
    lastLqi = newLqi;

    var newRssi = lastRssi + _.random(-4, 4);
    if (newRssi > -3 || newRssi < -80) {
      newRssi = lastRssi;
    }
    lastRssi = newRssi;

    result.push({
      channel: this.options.channelId,
      panId: this.options.panId,
      lqi: newLqi,
      rssi: newRssi,
      permitJoin: (_.random(0, 5) === 0)
    });
    _.delay(callback, _.random(30, 400), null, result);
  }
  else {
    // All networks
    var networkNb = _.random(0, 8);

    for (var i = 0; i < networkNb; i++) {
      result.push(generateRandomNetworkEntry());
    }
    result = _.sortByOrder(result, ['channel', 'panId'], [true, true]);
    // Delay it as it would be in the real world
    _.delay(callback, _.random(2, 4), null, result);
  }
};


module.exports = {
  start: function (options, callback) {
    logger.debug ('New Network Scan Request');
    var req = new NetworkScanRequest(options);
    if (settings.simulator) {
      req.simulator(callback);
    }
    else {
      req.rapidConnectHandling(callback);
    }
  }
};
