/**
 * Resets the MMB Module
 * Created by kc on 03.12.15.
 */

'use strict';
var rapidConnector = require('../rapidConnector');
var logger = require('../logger').getLogger('tasks:resetModule');
var _ = require('lodash');

var UITLITY_HEADER = 0x55;
var RESET_REQUEST = 0x00;


module.exports = {
  run: function (callback) {
    logger.info('RESETTING MODULE');
    rapidConnector.writeFrame(UITLITY_HEADER, RESET_REQUEST);

    // Give the dongle enough time
    // NOPE: Todo, wait for the error <Buffer fe 55 e0 02 10 0b 52 01>
    _.delay(callback, 5000);
  }
};
