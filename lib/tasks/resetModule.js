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
    // ERROR
    rapidConnector.once('55-e0', function(data) {
      var err = new ErrorFrame(data);
      logger.info(err.getError().message);
      callback();
    });
    rapidConnector.writeFrame(UITLITY_HEADER, RESET_REQUEST);
  }
};
