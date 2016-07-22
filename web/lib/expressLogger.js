/**
 * Logger middleware for express
 * Created by kc on 09.12.15.
 */

const logger = require('../../core/index')().getLogger('express');

module.exports = function(req, res, next) {
  logger.info(req.method + ' ' + req.url);
  next();
};
