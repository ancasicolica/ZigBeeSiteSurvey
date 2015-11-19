/**
 * Stores an overview over the found networks
 *
 * Created by kc on 17.11.15.
 */

var scanner = require('./scanner');
var socket = require('./socket');
var _ = require('lodash');
var networks = [];

scanner.get().on('networks', function (foundNetworks) {
  console.log('Found networks: ' + foundNetworks.length);

  // First mark all networks as 'not found'. We correct this afterwards.
  for (var i = 0; i < networks.length; i++) {
    networks[i].found = false;
  }

  for (i = 0; i < foundNetworks.length; i++) {
    var network = _.find(networks, {extendedPanId: foundNetworks[i].extendedPanId});
    if (!network) {
      // new one!
      foundNetworks[i].ts = new Date();
      foundNetworks[i].id = _.camelCase(foundNetworks[i].extendedPanId);
      networks.push(foundNetworks[i]);
    }
    else {
      // existing one, set changing parameters
      network.ts = new Date();
      network.lqi = foundNetworks[i].lqi;
      network.rssi = foundNetworks[i].rssi;
      network.permitJoin = foundNetworks[i].permitJoin;
      network.found = true;
    }
  }

  console.log('Updated network inventory:', networks);
  socket.emit('networks', networks);
});

module.exports = {

  /**
   * Get all networks
   * @returns {Array}
   */
  getNetworks: function () {
    return networks;
  },

  /**
   * Reset list with networks
   */
  reset: function () {
    networks = [];
  }


};
