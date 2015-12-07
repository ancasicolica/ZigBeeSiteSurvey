/**
 * Socket connection to the client
 * Created by kc on 16.07.15.
 */
'use strict';

var io;
var sockets = [];
var logger = require('./logger').getLogger('lib:socket');
var _ = require('lodash');

module.exports = {
  /**
   * Initialisation of the web socket
   * @param app
   */
  init: function (app) {
    io = require('socket.io')(app);

    io.on('connection', function (s) {
      logger.debug('connected to client ' + s.id);
      sockets.push(s);

      s.on('disconnect', function () {
        // remove the socket again
        logger.debug('socket disconnected: ' + s.id);
        _.pull(sockets, s);
      });
    });
  },

  /**
   * Emits data to the client
   * @param channel
   * @param data
   */
  emit: function (channel, data) {
    for (var i = 0; i < sockets.length; i++) {
      sockets[i].emit(channel, data);
    }
  },

  /**
   * How many clients are connected?
   * @returns {Number}
   */
  getNumberOfConnectedClients: function() {
    return sockets.length;
  }
};
