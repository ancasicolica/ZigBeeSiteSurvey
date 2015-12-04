/**
 * The ERROR message of the MMB dongle. We call this ErrorFrame (and not Error) in order to avoid js naming conflicts
 * Created by kc on 04.12.15.
 */

'use strict';

var UTILITY_HEADER = 0x55;
var ERROR = 0xe0;

/**
 * Set the error condition string
 * @param value
 * @returns {*}
 */
function setErrorCondition(value) {
  switch (value) {
    case 0x01:
      return 'Scanning Error';
    case 0x02:
      return 'Key Establishment Error';
    case 0x03:
      return 'Service Discovery and Binding Error';
    case 0x10:
      return 'Reset Error';
    case 0x20:
      return 'Synchronization Error';
    case 0x30:
      return 'Invalid Call Error';
    case 0xb0:
      return 'Local Bootload Error';
    case 0xb1:
      return 'OTA Client Bootload Error';
    default:
      return 'Unknown - Reserved';
  }
}


/**
 * Set the sub error string (not complete, only what we are interested in)
 * @param value
 * @returns {*}
 */
function setSubError(errorCondition, value) {
  switch(errorCondition) {
    case 0x10: // Reset error
      switch (value) {
        case 0x00:
          return 'Unknown';
        case 0x02:
          return 'Power-On';
        case 0x03:
          return 'Watchdog';
        case 0x06:
          return 'Assert';
        case 0x09:
          return 'Bootloader';
        case 0x0b:
          return 'Software';
        case 0x81:
          return 'FIB';
        case 0x88:
          return 'Flash';
        case 0x89:
          return 'Fatal';
        case 0x8a:
          return 'Fault';
      }
  }
  return 'Unknown - Reserved';
}

/**
 * Constructor
 * @param frame
 * @constructor
 */
function ErrorFrame(payload) {

  this.errorCondition = setErrorCondition(payload[0]);
  this.errorCondition += ' (' + payload[0] + ')';
  this.subError = setSubError(payload[0], payload[1]);
  this.subError += ' (' + payload[1] + ')';
}

ErrorFrame.prototype.getErrorCondition = function() {
  return this.errorCondition;
};

ErrorFrame.prototype.getSubError = function() {
  return this.subError;
};

ErrorFrame.prototype.getError = function() {
  return new Error('ERROR Message, condition: ' + this.errorCondition + ',  sub-error: ' + this.subError);
};
module.exports =
{
  ErrorFrame: ErrorFrame
};
