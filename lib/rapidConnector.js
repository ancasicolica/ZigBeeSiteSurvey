/**
 * Connects to the RapidConnect from MMB
 * Created by kc on 23.06.15.
 */
'use strict';

var settings = require('../settings');
var serialPortLib = require('serialport');
var SerialPort = require('serialport').SerialPort;
var usbDetect = require('usb-detection');
var _ = require('lodash');

var START_OF_FRAME = 0xfe;
var serialPort;
var onDataCallback;
var usedSerialPort;

/**
 * Scans the ports for a rapidConnect USB dongle
 * @param callback
 */
var scanPorts = function (callback) {
  var rapidPort;
  if (!serialPortLib.list) {
    return callback(new Error('Serialport not available'));
  }
  serialPortLib.list(function (err, ports) {
    if (err) {
      return callback(err);
    }
    ports.forEach(function (port) {
      if (port.productId === '0x88a4' && port.vendorId === '0x10c4') {
        // This is for modern systems like Mac or Linux
        console.log('MMB RapidConnect USB stick found @ ' + port.comName);
        rapidPort = port;
      }
      else if (port.pnpId.toLowerCase().indexOf('vid_10c4') > 0 && port.pnpId.toLowerCase().indexOf('pid_88a4') > 0) {
        // This is Windows legacy support
        console.log('MMB RapidConnect USB stick found @ ' + port.comName);
        rapidPort = port;
      }
    });
    callback(null, rapidPort);
  });
};

function connectToRapid(callback) {
  try {
    var comName;

    scanPorts(function (err, port) {
      if (err) {
        console.error(err);
        return;
      }

      if (!port) {
        return;
      }

      comName = port.comName;
      usedSerialPort = port;
      console.log('Serialport autoscan, using ' + comName);

      serialPort = new SerialPort(comName, {baudrate: 115200});

      serialPort.on('data', function (data) {
        if (onDataCallback) {
          onDataCallback(data);
        }
      });

      serialPort.on('close', function () {
        console.log('SERIALPORT CLOSED!');
        usedSerialPort = undefined;
      });

      serialPort.on('error', function () {
        console.log('SERIALPORT ERROR!');
        usedSerialPort = undefined;
      });

      serialPort.on('open', function (err) {
        console.log('SERIALPORT (RE)OPENED');
        if (callback) {
          callback(err);
        }
      });
    });
  }
  catch (e) {
    console.error(e);
    if (callback) {
      callback(e);
    }
  }
}
module.exports = {
  /**
   * Initialises the connector, opens the port
   * @param callback
   */
  init: function (callback) {
    if (settings.simulator) {
      // serial port is disabled, we simulate only
      return callback();
    }

    usbDetect.on('add:4292:34980', function (device) {
      console.log('RapidConnect connected', device);
      connectToRapid();
    });

    usbDetect.on('remove:4292:34980', function (device) {
      console.log('RapidConnect removed', device);
      if (serialPort.isOpen()) {
        serialPort.close();
      }
    });

    connectToRapid(callback);
  },

  /**
   * Returns the currently used serialport, undefined if not connected
   * @returns {*}
   */
  getCurrentSerialPort: function () {
    return usedSerialPort;
  },
  /**
   * Writes a frame to the RapidConnect
   * @param primaryHeader
   * @param secondaryHeader
   * @param payload
   * @param dataCallback  Callback called for every frame received after this command
   */
  writeFrame: function (primaryHeader, secondaryHeader, payload, dataCallback) {
    onDataCallback = dataCallback;

    var frame = [START_OF_FRAME];
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
    serialPort.write(frame);
  }

};
