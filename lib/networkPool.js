/**
 * Stores an overview over the found networks
 *
 * Created by kc on 17.11.15.
 */

var scanner = require('./scanner');
var socket = require('./socket');
var _ = require('lodash');
var settings = require('../settings');
var networks = [];

scanner.get().on('networks', function (foundNetworks) {
  console.log('Found networks: ' + foundNetworks.length);

  // First mark all networks as 'not found'. We correct this afterwards.
  for (var i = 0; i < networks.length; i++) {
    networks[i].found = false;
    networks[i].ts = new Date();
    networks[i].lqi = 0;
    networks[i].rssi = -128;
  }

  for (i = 0; i < foundNetworks.length; i++) {
    var network = _.find(networks, {extendedPanId: foundNetworks[i].extendedPanId});
    if (!network) {
      // new one!
      foundNetworks[i].ts = new Date();
      foundNetworks[i].id = _.camelCase(foundNetworks[i].extendedPanId);
      foundNetworks[i].history = [{ts: new Date(), lqi: foundNetworks[i].lqi, rssi: foundNetworks[i].rssi}];
      networks.push(foundNetworks[i]);
    }
    else {
      // existing one, set changing parameters
      network.ts = new Date();
      network.lqi = foundNetworks[i].lqi;
      network.rssi = foundNetworks[i].rssi;
      network.permitJoin = foundNetworks[i].permitJoin;
      network.history.push({ts: new Date(), lqi: foundNetworks[i].lqi, rssi: foundNetworks[i].rssi});
      if (network.history.length > settings.historyLength) {
        console.log('Dropping', _.pullAt(network.history, 0));
      }
      network.found = true;
    }
  }

  // Now attach a 'we have not found it' value to all networks in the pool being not found in this scan
  for (var i = 0; i < networks.length; i++) {
    if (!networks[i].found) {
     // networks[i].history.push({ts: new Date(), lqi: 0, rssi: -128});
      networks[i].history.push({ts: new Date()});
    }
    while (networks[i].history.length > settings.historyLength) {
      console.log('Dropping', _.pullAt(network.history, 0));
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
