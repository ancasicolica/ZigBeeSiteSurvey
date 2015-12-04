/**
 * Resets the MMB Module
 * Created by kc on 03.12.15.
 */

'use strict';
var rapidConnector = require('../rapidConnector');
var logger = require('../logger').getLogger('tasks:resetModule');
var _ = require('lodash');
var ErrorFrame = require('../messages/errorFrame').ErrorFrame;

var UITLITY_HEADER = 0x55;
var RESET_REQUEST = 0x00;


module.exports = {
  run: function (callback) {
    logger.info('RESETTING MODULE');

    // Handler for afterwards
    function resetHandler(data) {
      logger.info('MODULE RESETTED');
      logger.info('Reseted', data);
      rapidConnector.removeListener('55-e0', resetHandler);
      rapidConnector.removeListener('55-21', resetHandler);
      callback();
    }

    rapidConnector.on('55-e0', resetHandler);
    rapidConnector.on('55-21', resetHandler);
    rapidConnector.writeFrame(UITLITY_HEADER, RESET_REQUEST);
  }
};
