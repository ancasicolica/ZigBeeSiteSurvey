/**
 * This module starts / handles the periodic scans
 *
 * Created by kc on 17.11.15.
 */


const util = require('util');
const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const logger = require('./logger').getLogger('lib:scanner');
const socket = require('./socket');

/**
 * Constructor
 * @constructor
 */
function Scanner() {
  var self = this;

  this.options = {
    scanDuration: 0x04,
    channels: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    scanDelay: 500
  };
  this.networkScanRequest = require('./tasks/networkScanRequest');
  this.rapidConnector = require('./rapidConnector');
  this.resetModule = require('./tasks/resetModule');
  this.enabled = false;
  this.scanActive = false;
  this.errorCount = 0;
  this.measurementTimeout = 0;
  this.rapidConnector.on('ready', function (info) {
    logger.debug('DONGLE IS READY: ', info);
    self.enabled = true;
    self.measurementTimeout = 5;
    _.delay(self.scanNetwork.bind(self), 200);
  });

}

// Event-Emitter adding to RapidConnector
util.inherits(Scanner, EventEmitter);

/**
 * Scan the networks with the options set
 */
Scanner.prototype.scanNetwork = function () {
  var self = this;

  if (!this.enabled) {
    return;
  }

  if (!self.rapidConnector.isConnected()) {
    logger.debug('not connected, disable the scanner');
    this.enabled = false;
    return;
  }

  if (this.scanActive) {
    logger.debug('Scan already active');
    return;
  }


  var timeoutTimer = setTimeout(function () {
    logger.info('Timeout timer - scanner is crashed!');
    self.scanActive = false;
    self.scanNetwork();
  }, 20000);


  logger.info('Periodic network scan: ', _.isString(self.options.panId) ? 'PAN ' + self.options.panId + ' only' : 'all networks');
  this.scanActive = true;

  self.networkScanRequest.start(this.options, function (err, networks) {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    logger.debug('error count ' + self.errorCount);
    if (err) {
      logger.error('Scan error', err);
      self.errorCount++;
      if (self.errorCount > 2) {
        // enough is enough - reset the module
        self.resetModule.run(function () {
          self.errorCount = 0;
          self.scanActive = false;
          _.delay(self.scanNetwork.bind(self), self.options.scanDelay * 5);
        });
        return;
      }
      self.scanActive = false;
      _.delay(self.scanNetwork.bind(self), self.options.scanDelay * 5);
      return;
    }
    self.errorCount = 0;
    if (self.options.panId) {
      // Scan for one single network only
      if (networks && networks.length > 0) {
        self.emit('network', networks[0]);
      }
    }
    else {
      // Scanning whole range
      if (networks && networks.length > 0) {
        self.emit('networks', networks);
      }
    }
    self.scanActive = false;

    if (socket.getNumberOfConnectedClients() === 0) {
      self.measurementTimeout--;
      logger.info('No sockets, scans remaining before timeout: ', self.measurementTimeout)
    }

    self.enabled =  (self.measurementTimeout > 0);
    if (self.enabled) {
      _.delay(self.scanNetwork.bind(self), self.options.scanDelay);
    }
    else {
      logger.info('Stopped scanning, no sockets connected');
    }
  });
};

// We have just one instance
var scanner = new Scanner();

module.exports = {
  /**
   * Get the scanner
   * @returns {Scanner}
   */
  get: function () {
    return scanner;
  },
  /**
   * Enable the scanner
   */
  enable: function () {
    if (!scanner.enabled) {
      scanner.enabled = true;
      scanner.measurementTimeout = 5;
      scanner.scanNetwork();
    }
  },
  /**
   * Start scanning for all networks, channels can be selected in the config
   * @param options
   */
  scanNetworks: function (options) {
    options = options || {};
    scanner.options = {
      scanDuration: options.scanDuration || 0x05,
      channels: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
      scanDelay: options.scanDelay || 500
    };
  },
  /**
   * Start scanning for exactly one device (which was found before)
   * @param options
   */
  scanSpecificNetwork: function (options) {
    scanner.options.channels = [options.channel];
    scanner.options.panId = options.panId;
    scanner.options.scanDuration = options.scanDuration || 0x06;
    scanner.options.scanDelay = options.scanDelay || 4000;
  },
  /**
   * Disable the scanner (disables itself when the dongle disconnects)
   */
  disable: function () {
    scanner.enabled = false;
  },
  /**
   * Current state of the scanner
   * @returns {boolean|*}
   */
  isEnabled : function() {
    return scanner.enabled;
  }
};
