/**
 * Socket connection to the client
 * Created by kc on 16.07.15.
 */
'use strict';

var io;
var socket;

module.exports = {
  /**
   * Initialisation of the web socket
   * @param app
   */
  init: function(app) {
    io = require('socket.io')(app);

    io.on('connection', function(s) {
      console.log('connected to client');
      socket = s;
    })
  },

  /**
   * Emits data to the client
   * @param channel
   * @param data
   */
  emit: function(channel, data) {
    socket.emit(channel, data);
  }
};
