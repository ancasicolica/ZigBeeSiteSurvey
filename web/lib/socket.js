/**
 * Socket connection to the client
 * Created by kc on 16.07.15.
 */

const logger = require('zigbee-survey-core')().getLogger('web:socket');
const _ = require('lodash');
const updateCheck = require('./../../lib/updateCheck');
var io;
var sockets = [];

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
      s.emit('update-info', updateCheck.getVersionInfo());

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
