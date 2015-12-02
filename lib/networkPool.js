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
var surveyNetwork = {};
var logger = require('./logger').getLogger('lib:networkPool');

/**
 * A network scan for several networks finished
 *
 * The data of all networks found so far is stored in the pool, but only the last few entries of the RSSI/LQI history
 * are stored
 */
scanner.get().on('networks', function (foundNetworks) {
  logger.info('Found networks: ' + foundNetworks.length);

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
        logger.debug('Dropping', _.pullAt(network.history, 0));
      }
      network.found = true;
    }
  }

  // Now attach a 'we have not found it' value to all networks in the pool being not found in this scan
  for (i = 0; i < networks.length; i++) {
    if (!networks[i].found) {
      // Set levels to minimum (even lower, avoid points on graph)
      networks[i].history.push({ts: new Date(), lqi: 0, rssi: settings.levels.min - 20});
    }

    while (networks[i].history.length > settings.historyLength) {
      logger.debug('List too long(' + networks[i].history.length + '), dropping', _.pullAt(networks[i].history, 0));
    }
  }

  logger.debug('Updated network inventory');

  // We do not transmit the networks, only trigger retrieving it (same procedure as in survey)
  socket.emit('networks', {ts: new Date()});
});

/**
 * A single network was found (we're analyzing one specific right now)
 *
 * Switching to a single network scan does not affect the pool, but we only collect data for this specific network right
 * now.
 */
scanner.get().on('network', function (foundNetwork) {
  foundNetwork.ts = new Date();

  if (surveyNetwork.panId !== foundNetwork.panId) {
    logger.info('Scanning new network with PAN ID ' + foundNetwork.panId);
    surveyNetwork = foundNetwork;
    surveyNetwork.history = [];
  }

  surveyNetwork.history.push({ts: new Date(), lqi: foundNetwork.lqi, rssi: foundNetwork.rssi});

  while (surveyNetwork.history.length > settings.surveyHistoryLength) {
    logger.debug('Survey list too long(' + surveyNetwork.history.length + '), dropping', _.pullAt(surveyNetwork.history, 0));
  }

  socket.emit('network', foundNetwork);

});


module.exports = {

  /**
   * Get all networks
   * @returns {Array}
   */
  getNetworks: function () {
    return networks;
  },

  getNetworkSurvey: function(panId) {
    if (!surveyNetwork) {
      return;
    }
    if (surveyNetwork.panId === panId) {
      return surveyNetwork;
    }
  },

  /**
   * Reset list with networks
   */
  reset: function () {
    networks = [];
    surveyNetwork = {};
  }


};
