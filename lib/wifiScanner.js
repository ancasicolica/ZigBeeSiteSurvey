/**
 * Module for wifi measurements
 * Created by kc on 14.03.16.
 */

const wiFiControl = require('wifi-control');
const logger = require('./logger').getLogger('wifiScanner');

// Initialize first
wiFiControl.init({
  debug: false
});


module.exports = {
  /**
   * Scan for networks
   * @param callback
   */
  scan: function (callback) {
    wiFiControl.scanForWiFi((err, info) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }

      logger.info(`Found ${info.networks.length} networks`);
      callback(null, info.networks);
    });
  }
};
