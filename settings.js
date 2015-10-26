/**
 * Settings of the zigbee site survey tool
 * Created by kc on 23.06.15.
 */
'use strict';

var
  pkg = require('./package.json');

var settings = {
  name: pkg.name,
  version: pkg.version,
  debug: (process.env.NODE_ENV !== 'production' || process.env.DEBUG) ? true : false
};

process.env.DEPLOY_TYPE = process.env.DEPLOY_TYPE || 'local';

settings.levels = {
  good: -82, // Everything above this level is considered as good
  acceptable: -87, // Everything above this level and below 'good' is considered as acceptable, everything below as inacceptable.
  min: -100, // lowest possible level, do not change unless it is really needed
  max: 0 // highest level, do not change unless it is really needed
};

settings.simulator = process.env.SIMULATOR || false;
settings.port = process.env.PORT || 2998;

module.exports = settings;

