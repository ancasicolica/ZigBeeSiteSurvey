/**
 * Settings of the zigbee site survey tool
 * Created by kc on 23.06.15.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var pkg = require('./package.json');

var settings = {
  name: pkg.name,
  version: pkg.version,
  debug: (process.env.NODE_ENV !== 'production' || process.env.DEBUG) ? true : false
};

// Check if custom settings are available
var info = {};

try {
  var customFileName = process.env.CUSTOM_FILE_NAME || 'custom.json';
  info = fs.statSync(path.join(__dirname, customFileName));
  settings.custom = require(path.join(__dirname, customFileName));
}
catch (e) {
  // don't care. In this case we simply do not have custom settings
}


process.env.DEPLOY_TYPE = process.env.DEPLOY_TYPE || 'local';

settings.levels = {
  good: -82, // Everything above this level is considered as good
  acceptable: -87, // Everything above this level and below 'good' is considered as acceptable, everything below as inacceptable.
  min: -100, // lowest possible level, do not change unless it is really needed
  max: 0 // highest level, do not change unless it is really needed
};

settings.historyLength = 10;
settings.surveyHistoryLength = 1000;
settings.logger = {level: 'info', colorize: true};

settings.simulator = process.env.SIMULATOR || false;
settings.port = process.env.PORT || 2998;
console.log(settings);
module.exports = settings;

