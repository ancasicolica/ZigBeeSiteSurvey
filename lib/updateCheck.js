/**
 * Checks for updates
 * Created by kc on 14.07.16.
 */

const restify = require('restify');
const url = require('url');
const logger = require('./logger').getLogger('updateCheck');
const _ = require('lodash');

var settings;
var versionInfo = {
  dataValid: false
};
var jsonClient;
var updateUrl;
var updateChecksDisabled = false;

module.exports = {
  /**
   * Initialize the update checker
   * @param _settings
   */
  init: function (_settings) {
    settings = _settings;

    if (_.get(settings, 'update.versionUrl')) {
      updateUrl = url.parse(settings.update.versionUrl);
      jsonClient = restify.createJsonClient({
        url: updateUrl.protocol + '//' + updateUrl.host,
        version: '*'
      });
    }
    else {
      // Update checks are disabled when URL is not configured
      updateChecksDisabled = true;
    }
  },

  /**
   * Check for a new version. The package.json of the master branch is returned, when the version is different to the
   * one we have, we assume an update
   * @param callback
   */
  check: function (callback) {
    if (updateChecksDisabled) {
      logger.info('Automatic update checks are disabled');
      return callback(null);
    }

    jsonClient.get(updateUrl.path, (err, req, resp, obj) => {
      if (err) {
        logger.error(err);
        versionInfo.loadError = err;
        return callback(null);
      }
      if (!obj || !obj.version) {
        logger.info(`Invalid data received while checking for update, ignore`);
        return callback(null);
      }
      // Everything seems ok
      delete versionInfo.loadError;
      versionInfo.dataValid = true;
      versionInfo.currentVersion = obj.version;
      versionInfo.newVersionAvailable = (obj.version !== settings.version);
      if (versionInfo.newVersionAvailable) {
        versionInfo.downloadUrl = _.get(settings, 'update.downloadUrl');
      }

      if (versionInfo.newVersionAvailable) {
        logger.info(`There is a new release available! current: ${settings.version}, available: ${obj.version}`);
      }
      else {
        logger.info(`This is the most recent version of this tool: ${settings.version}`);
      }
      callback(null, versionInfo);
    });
  },

  /**
   * Get the version info object
   * @returns {{dataValid: boolean}}
   */
  getVersionInfo: function () {
    return versionInfo;
  }
};