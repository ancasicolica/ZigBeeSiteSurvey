/**
 * Connects to the RapidConnect from MMB
 * Created by kc on 23.06.15.
 */

const util = require('util');
const SerialPort = require('serialport');
const usbDetect = require('usb-detection');
const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const logger = require('./logger').getLogger('core:lib:rapidConnector');

const START_OF_FRAME_SE = 0xfe;
const START_OF_FRAME_HA = 0xf1;

/**
 * Constructor
 * @constructor
 */
function RapidConnector() {
  EventEmitter.call(this);
  var self = this;
  this.mode = 'SE';

  usbDetect.on('add:4292:34980', function (device) {
    logger.debug('RapidConnect found', device);
    _.delay(self.connectToRapid.bind(self), 1500);
    self.emit('usbConnected', device);
  });

  usbDetect.on('remove:4292:34980', function () {
    logger.debug('RapidConnect removed');
    if (self.serialPort && self.serialPort.isOpen()) {
      self.serialPort.close();
    }
    self.emit('usbDisconnected');
  });
}

// Event-Emitter adding to RapidConnector
util.inherits(RapidConnector, EventEmitter);

/**
 * Scans the ports for a rapidConnect USB dongle
 * @param callback
 */
RapidConnector.prototype.scanPorts = function (callback) {
  var rapidPort;
  if (!SerialPort.list) {
    return callback(new Error('Serialport not available'));
  }
  SerialPort.list(function (err, ports) {
    if (err) {
      return callback(err);
    }

    ports.forEach(function (port) {
      if (port.productId === '0x88a4' && port.vendorId === '0x10c4') {
        // This is for modern systems like Mac or Linux
        logger.info('MMB RapidConnect USB stick found @ ' + port.comName);
        rapidPort = port;
      }
      else if (port.pnpId && port.pnpId.toLowerCase().indexOf('vid_10c4') > 0 && port.pnpId.toLowerCase().indexOf('pid_88a4') > 0) {
        // This is Windows legacy support
        logger.info('MMB RapidConnect USB stick found @ ' + port.comName);
        rapidPort = port;
      }
    });
    callback(null, rapidPort);
  });
};

/**
 * Returns the current serial port
 * @returns {*}
 */
RapidConnector.prototype.getCurrentSerialPort = function () {
  return this.usedSerialPort;
};

/**
 * Connect to the RapidSE
 * @param callback
 */
RapidConnector.prototype.connectToRapid = function (callback) {
  try {
    var comName;
    var self = this;

    function callCallback(err) {
      if (callback) {
        return callback(err);
      }
      if (err) {
        logger.error(err);
      }
    }

    self.scanPorts(function (err, port) {
      if (err) {
        logger.info('Error while scanning ports');
        logger.error(err);
        console.log(err, port);
        return callCallback(err);
      }

      if (!port) {
        return callCallback();
      }

      comName = port.comName;
      self.usedSerialPort = port;
      logger.debug('Serialport autoscan, using ' + comName);

      self.serialPort = new SerialPort(comName, {baudrate: 115200});

      self.serialPort.on('data', function (data) {
        var channel = data[1].toString(16) + '-' + data[2].toString(16);
        if (data[1] === 0x55 && data[2] === 0xe0) {
          logger.error(new Error('MMB Dongle ERROR'), data);
        }

        logger.debug('Emitting data on channel ' + channel);
        if (self.mode === 'HA') {
          self.emit(channel, _.slice(data, 5, data.length - 2));
        }
        else {
          self.emit(channel, _.slice(data, 4, data.length - 2));
        }

      });

      self.serialPort.on('close', function () {
        logger.info('SERIALPORT CLOSED!');
        self.usedSerialPort = undefined;
        self.emit('close');
      });

      self.serialPort.on('error', function (err) {
        logger.error('SERIALPORT ERROR!', err.message);
        self.usedSerialPort = undefined;
        self.emit('error', err);
        logger.debug('We try to reconnect to the serialport asap');
        _.delay(self.connectToRapid.bind(self), 1000);
      });

      self.serialPort.on('open', function (erSchr) {
        logger.info('SERIALPORT (RE)OPENED');
        self.emit('open');
      });
      callCallback(err);
    });
  }
  catch (e) {
    logger.info('Exception in connectToRapid');
    callCallback(e);
  }
};

/**
 * Write a frame on a SE device
 * @param primaryHeader
 * @param secondaryHeader
 * @param payload
 */
RapidConnector.prototype.writeFrameSe = function (primaryHeader, secondaryHeader, payload) {
  if (!this.serialPort || !this.serialPort.isOpen()) {
    logger.debug('Dongle not connected!');
    return;
  }

  var frame = [START_OF_FRAME_SE];
  payload = payload || [];
  var checksum = primaryHeader + secondaryHeader + payload.length;

  frame.push(primaryHeader);
  frame.push(secondaryHeader);
  frame.push(payload.length);

  for (var i = 0; i < payload.length; i++) {
    frame.push(payload[i]);
    checksum += payload[i];
  }

  checksum = checksum % (256 * 256);
  frame.push(parseInt(checksum % 256));
  frame.push(parseInt(checksum / 256));
  this.serialPort.write(frame);
};

/**
 * Write a frame on a HA device
 * @param primaryHeader
 * @param secondaryHeader
 * @param payload
 */
RapidConnector.prototype.writeFrameHa = function (primaryHeader, secondaryHeader, payload) {
  if (!this.serialPort || !this.serialPort.isOpen()) {
    logger.debug('Dongle not connected!');
    return;
  }
  var frame = [START_OF_FRAME_HA];
  payload = payload || [];
  var checksum = primaryHeader + secondaryHeader + payload.length;

  frame.push(primaryHeader);
  frame.push(secondaryHeader);
  frame.push(0);
  frame.push(payload.length);

  for (var i = 0; i < payload.length; i++) {
    frame.push(payload[i]);
    checksum += payload[i];
  }

  checksum = checksum % (256 * 256);
  frame.push(parseInt(checksum % 256));
  frame.push(parseInt(checksum / 256));
  this.serialPort.write(frame);
};

/**
 * Writes a frame in the correct format (according to the mode)
 * @param primaryHeader
 * @param secondaryHeader
 * @param payload
 */
RapidConnector.prototype.writeFrame = function (primaryHeader, secondaryHeader, payload) {
  if (this.mode === 'HA') {
    this.writeFrameHa(primaryHeader, secondaryHeader, payload);
  }
  else {
    this.writeFrameSe(primaryHeader, secondaryHeader, payload);
  }
};

/**
 * Set mode: either 'HA' or 'SE'
 * @param mode
 */
RapidConnector.prototype.setMode = function(mode) {
  logger.info('Setting RapidConnector Mode: ' + mode);
  this.mode = mode;
};

/**
 * We are connected AND ready (having the info about the dongle)
 * @param info
 */
RapidConnector.prototype.setReady = function(info) {
  this.emit('ready', info);
};
/**
 * Returns true when connected to the dongle
 * @returns {*|SerialPort}
 */
RapidConnector.prototype.isConnected = function() {
  return (this.serialPort && this.serialPort.isOpen());
};

var rapidConnector = new RapidConnector();

module.exports = rapidConnector;
