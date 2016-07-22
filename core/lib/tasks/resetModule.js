/**
 * Resets the MMB Module
 * Created by kc on 03.12.15.
 */

const rapidConnector = require('../rapidConnector');
const logger = require('../logger').getLogger('core:tasks:resetModule');
const _ = require('lodash');

const UITLITY_HEADER = 0x55;
const RESET_REQUEST = 0x00;


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
