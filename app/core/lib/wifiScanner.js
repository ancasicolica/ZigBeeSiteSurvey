/**
 * Module for wifi measurements
 * Created by kc on 14.03.16.
 */

const scanner = require('node-wifi-scanner');
const logger = require('./logger').getLogger('core:wifiScanner');


module.exports = {
  /**
   * Scan for networks
   * @param callback
   */
  scan: function (callback) {
    scanner.scan((err, networks) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }

      logger.info(`Found ${networks.length} networks`);
      callback(null, networks);
    });
  }
};
