/**
 * Settings of the zigbee site survey tool
 * Created by kc on 23.06.15.
 */

const fs   = require('fs');
const path = require('path');
const pkg  = require('./package.json');
const _    = require('lodash');

let settings = {
  name   : pkg.name,
  version: pkg.version,
  debug  : (process.env.NODE_ENV !== 'production' || process.env.DEBUG) ? true : false
};

// Check if custom settings are available
let info = {};

try {
  let customFileName = process.env.CUSTOM_FILE_NAME || 'settings.json';
  let customFile     = path.join(__dirname, 'web', 'public', 'custom', customFileName);
  // If the file is not here, the next line crashes (throws an exception)
  info               = fs.statSync(customFile);
  settings.custom    = require(customFile);
  if (settings.custom.enabled === false) {
    // Custom settings are available, but they are not enabled (they are enabled by default)
    settings.custom = {};
  }
} catch (e) {
  // don't care. In this case we simply do not have custom settings
}


process.env.DEPLOY_TYPE = process.env.DEPLOY_TYPE || 'local';

settings.levels = {
  good      : -71, // Everything above this level is considered as good
  acceptable: -82, // Everything above this level and below 'good' is considered as acceptable, everything below as inacceptable.
  min       : -100, // lowest possible level, do not change unless it is really needed
  max       : 0 // highest level, do not change unless it is really needed
};

settings.networkMissAllowedNb = 2; // How many times can't we se a network and we assume it is still here?
settings.historyLength        = 10;
settings.surveyHistoryLength  = 1000;
settings.logger               = {level: process.env.LOG_LEVEL || 'info', colorize: true};

// You can change these settings in the custom file!
settings.update = {
  versionUrl : _.get(settings, 'custom.update.versionUrl', 'https://raw.githubusercontent.com/ancasicolica/ZigBeeSiteSurvey/master/package.json'),
  downloadUrl: _.get(settings, 'custom.update.downloadUrl', 'https://github.com/ancasicolica/ZigBeeSiteSurvey/releases/latest')
};

settings.simulator = process.env.SIMULATOR || false;
settings.port      = process.env.PORT || 2998;
module.exports     = settings;

