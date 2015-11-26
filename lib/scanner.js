/**
 * This module starts / handles the periodic scans
 *
 * Created by kc on 17.11.15.
 */

'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var logger = require('./logger').getLogger('lib:scanner');


function Scanner() {
  var self = this;

  this.options = {scanDuration: 0x04};
  this.networkScanRequest = require('./tasks/networkScanRequest');
  this.rapidConnector = require('./rapidConnector');
  this.enabled = false;
  this.scanActive = false;

  this.rapidConnector.on('ready', function(info) {
    logger.debug('DONGLE IS READY: ', info);
    self.enabled = true;
    _.delay(self.scanNetwork.bind(self), 2);
  });

}

// Event-Emitter adding to RapidConnector
util.inherits(Scanner, EventEmitter);

Scanner.prototype.scanNetwork = function() {
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

  logger.debug('Periodic network scan');
  this.scanActive = true;
  self.networkScanRequest.start(this.options, function(err, networks) {
    if (err) {
      console.error(err);
      _.delay(self.scanNetwork.bind(self), 2000);
      self.scanActive = false;
      return;
    }
    self.emit('networks', networks);
    _.delay(self.scanNetwork.bind(self), 500);
    self.scanActive = false;
  });
};

// We have just one instance
var scanner = new Scanner();

module.exports = {
  /**
   * Get the scanner
   * @returns {Scanner}
   */
  get: function() {
    return scanner;
  },
  /**
   * Enable the scanner
   */
  enable: function() {
    if (!scanner.enabled) {
      scanner.enabled = true;
      scanner.scanNetwork();
    }
  },
  /**
   * Disable the scanner (disables itself when the dongle disconnects)
   */
  disable: function() {
    scanner.enabled = false;
  }
};
