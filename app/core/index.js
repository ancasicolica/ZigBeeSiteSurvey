/**
 * This is the core module, offering the functionality for the ZigBee Site Survey which
 * is the same for the web- and app-version.
 *
 */
const _ = require('lodash');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

const loggerLib = require('./lib/logger');
const rapidConnector = require('./lib/rapidConnector');
const determineDongleType = require('./lib/tasks/determineDongleType');
const scanner = require('./lib/scanner');
const networkPool = require('./lib/networkPool');
const networkScanRequest = require('./lib/tasks/networkScanRequest');
const resetModule = require('./lib/tasks/resetModule');
const spectrumChart = require('./lib/spectrumChart');
const wifiScanner = require('./lib/wifiScanner');

// The interface class
function SurveyCore() {
  this.logger = loggerLib.getLogger('core');
  var self = this;

  rapidConnector.on('open', function () {
    determineDongleType.run();
  });
  rapidConnector.on('error', function (err) {
    self.logger.error(err);
  });

  function connect() {
    rapidConnector.connectToRapid(err => {
      if (err) {
      //  _.delay(connect, 1000);
      }
    });
  }
  _.delay(connect, 500);

  rapidConnector.on('usbConnected', device => {
    self.emit('usbConnected', device);
  });
  rapidConnector.on('usbDisconnected', device => {
    self.emit('usbDisconnected');
  });
  rapidConnector.on('ready', info => {
    self.emit('ready', info);
  });
  networkPool.on('networks', networks => {
    self.emit('networks', networks);
  });
  networkPool.on('network', network => {
    self.emit('network', network);
  });
}

util.inherits(SurveyCore, EventEmitter);

/**
 * Get the scanner instance
 * @returns {*}
 */
SurveyCore.prototype.getScanner = function () {
  return scanner;
};
/**
 * Get the RapidConnector instance
 * @returns {*}
 */
SurveyCore.prototype.getRapidConnector = function () {
  return rapidConnector;
};
/**
 * Get the network pool
 * @returns {*}
 */
SurveyCore.prototype.getNetworkPool = function () {
  return networkPool;
};
/**
 * Check which dongle is inserted (start detection)
 */
SurveyCore.prototype.determineDongleType = function() {
  determineDongleType.run();
};
/**
 * Get the info about the inserted dongle
 * @returns {*}
 */
SurveyCore.prototype.getDongleInfo = function () {
  return determineDongleType.getInfo();
};
/**
 * Scan for networks
 * @param callback
 */
SurveyCore.prototype.scanNetworks = function (callback) {
  networkScanRequest.start({}, callback);
};
/**
 * Reset the dongle
 * @param callback
 */
SurveyCore.prototype.resetDongle = function (callback) {
  resetModule.run(callback);
};
/**
 * Get the logger instance
 * @param id
 * @returns {*|{fatal, error, info, warn, debug}}
 */
SurveyCore.prototype.getLogger = function(id) {
  return loggerLib.getLogger(id);
};
/**
 * Creates a spectrum chart
 * @param data
 */
SurveyCore.prototype.createSpectrumChart = function(data) {
  return spectrumChart(data);
};
/**
 * Scanning for wifis
 * @type {module.exports.scan}
 */
SurveyCore.prototype.scanWifi = wifiScanner.scan;


var surveyCore = new SurveyCore();

module.exports = function (settings) {

  loggerLib.setSettings(_.get(settings, 'logger', {}));
  var logger = loggerLib.getLogger('core');

  return surveyCore;
};