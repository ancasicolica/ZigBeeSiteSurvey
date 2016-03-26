/**
 * Stores an overview over the found networks
 *
 * Created by kc on 17.11.15.
 */

const scanner = require('./scanner');
const socket = require('./socket');
const _ = require('lodash');
const settings = require('../settings');
const logger = require('./logger').getLogger('lib:networkPool');

var networks = [];
var surveyNetwork = {};

/**
 * The network was not found, manipulate (no, justify is better) the measurements
 * @param history is an array with at least element (otherwise this function won't be called as we haven't seen the
 *                network yet)
 */
function handleNetworkNotFound(history) {
  // Check if we play "everything is ok": if one of the entries back 'retro' length is ok, it's ok
  var distance = 1;
  while (distance < history.length && !history[history.length - distance].found) {
    distance++;
  }

  if (distance < settings.networkMissAllowedNb) {
    // Within distance, copy data from last measurement
    logger.debug('Network not found, but within tolerance');
    history.push({ts: new Date(), lqi: _.last(history).lqi, rssi: _.last(history).rssi, found: false});
    return;
  }

  // We saw the network not for a to long time. Set all recently faked values to 'not found'
  logger.debug('Network not found, resetting last values');
  history.push({ts: new Date(), lqi: 0, rssi: settings.levels.min - 20, found: false});
  var i = history.length - 1;
  do {
    if (!history[i].found) {
      history[i].rssi = settings.levels.min - 20;
      history[i].lqi = 0;
    }
    i--;
  } while (!history[i].found && i > 0)
}


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
      foundNetworks[i].history = [{
        ts: new Date(),
        lqi: foundNetworks[i].lqi,
        rssi: foundNetworks[i].rssi,
        found: true
      }];
      networks.push(foundNetworks[i]);
    }
    else {
      // existing one, set changing parameters
      network.ts = new Date();
      network.lqi = foundNetworks[i].lqi;
      network.rssi = foundNetworks[i].rssi;
      network.permitJoin = foundNetworks[i].permitJoin;
      if (network.history) {
        network.history.push({ts: new Date(), lqi: foundNetworks[i].lqi, rssi: foundNetworks[i].rssi, found: true});

        if (network.history.length > settings.historyLength) {
          logger.debug('Dropping', _.pullAt(network.history, 0));
        }
      }
      network.found = true;
    }
  }

  // Now attach a 'we have not found it' value to all networks in the pool being not found in this scan
  for (i = 0; i < networks.length; i++) {
    if (!networks[i].found) {
      /* It is possible (no, it is very likely) that sometimes we do not get an answer even the network is in range.
       If so, then we have a tolerance of 1...3 missed scans until we admit that the network is not here: copy
       the last known value to the new entry, but as soon as we are sure that the network doesn't exist anymore, cancel
       them.
       */
      handleNetworkNotFound(networks[i].history);
    }
    if(networks[i].history) {
      while (networks[i].history.length > settings.historyLength) {
        logger.debug('List too long(' + networks[i].history.length + '), dropping', _.pullAt(networks[i].history, 0));
      }
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

  if (!foundNetwork.found) {
    handleNetworkNotFound(surveyNetwork.history);
  }

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

  getNetworkSurvey: function (panId) {
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
  },

  /**
   * Removes a network from the list
   * @param extendedPanId
   */
  remove: function(extendedPanId) {
    _.remove(networks, function(n) {
      return (n.extendedPanId === extendedPanId);
    });
  }



};
