/**
 * Logger middleware for express
 * Created by kc on 09.12.15.
 */

'use strict';

var logger = require('./logger').getLogger('express');

module.exports = function(req, res, next) {
  logger.info(req.method + ' ' + req.url);
  next();
};
