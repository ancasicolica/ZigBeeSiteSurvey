/**
 * ZigBee Logger
 * Created by kc on 26.11.15.
 */

'use strict';
var winston = require('winston');
var moment = require('moment');
var util = require('util');
var _ = require('lodash');

var loggerSettings = {
  levels: {
    fatal: 4,
    error: 3,
    info: 2,
    warn: 1,
    debug: 0
  },
  colors: {
    fatal: 'blue',
    error: 'red',
    info: 'green',
    warn: 'yellow',
    debug: 'grey'
  }
};

var logger = new winston.Logger();
winston.setLevels(loggerSettings.levels);
winston.addColors(loggerSettings.colors);
logger.add(winston.transports.Console, {level: 'debug', colorize: true});

/**
 * Core logging function
 * @param module
 * @param level
 * @param message
 * @param metadata
 */
var log = function (module, level, message, metadata) {
  var info = moment().format() + ' ' + module + ': ';
  if (_.isObject(message)) {
    info += util.inspect(message);
  }
  else {
    info += message;
  }
  if (metadata) {
    info += ' ' + util.inspect(metadata);
  }
  logger.log(level, info);
};

module.exports = {
  add: function (transport, options) {
    logger.add(transport, options);
  },

  remove: function (transport) {
    logger.remove(transport);
  },

  getLogger: function (moduleName) {
    return {
      fatal: function (message, metadata) {
        log(moduleName, 'fatal', message, metadata);
      },
      error: function (message, metadata) {
        log(moduleName, 'error', message, metadata);
      },
      info: function (message, metadata) {
        log(moduleName, 'info', message, metadata);
      },
      warn: function (message, metadata) {
        log(moduleName, 'warn', message, metadata);
      },
      debug: function (message, metadata) {
        log(moduleName, 'info', message, metadata); // using info as otherwise on stderr
      }
    };
  }
};
