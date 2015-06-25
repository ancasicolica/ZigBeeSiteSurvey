/**
 * Connects to the RapidConnect from MMB
 * Created by kc on 23.06.15.
 */
'use strict';

var settings = require('../settings');
var SerialPort = require('serialport').SerialPort;

var START_OF_FRAME = 0xfe;
var serialPort;
var onDataCallback;

module.exports = {
  /**
   * Initialises the connector, opens the port
   * @param callback
   */
  init: function(callback) {
    if (settings.simulator) {
      // serial port is disabled, we simulate only
      return callback();
    }

    try {
      serialPort = new SerialPort(settings.serialport, settings.serialSettings);

      serialPort.on('data', function(data) {
        if (onDataCallback) {
          onDataCallback(data);
        }
      });

      serialPort.on('open', callback);
    }
    catch(e) {
      callback(e);
    }

  },

  /**
   * Writes a frame to the RapidConnect
   * @param primaryHeader
   * @param secondaryHeader
   * @param payload
   * @param dataCallback  Callback called for every frame received after this command
   */
  writeFrame: function(primaryHeader, secondaryHeader, payload, dataCallback) {
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
