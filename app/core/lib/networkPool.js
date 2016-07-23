/**
 * Stores an overview over the found networks
 *
 * Created by kc on 17.11.15.
 */
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const scanner = require('./scanner');
const _ = require('lodash');
const logger = require('./logger').getLogger('lib:networkPool');

var settings = {};


function NetworkPool() {
  this.networks = [];
  this.surveyNetwork = {};
  var self = this;
  /**
   * A network scan for several networks finished
   *
   * The data of all networks found so far is stored in the pool, but only the last few entries of the RSSI/LQI history
   * are stored
   */
  scanner.get().on('networks', function (foundNetworks) {
    logger.info('Found networks: ' + foundNetworks.length);

    // First mark all networks as 'not found'. We correct this afterwards.
    for (var i = 0; i < self.networks.length; i++) {
      self.networks[i].found = false;
      self.networks[i].ts = new Date();
      self.networks[i].lqi = 0;
      self.networks[i].rssi = -128;
    }

    for (i = 0; i < foundNetworks.length; i++) {
      var network = _.find(self.networks, {extendedPanId: foundNetworks[i].extendedPanId});
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
        self.networks.push(foundNetworks[i]);
      }
      else {
        // existing one, set changing parameters
        network.ts = new Date();
        network.lqi = foundNetworks[i].lqi;
        network.rssi = foundNetworks[i].rssi;
        network.permitJoin = foundNetworks[i].permitJoin;
        if (network.history) {
          network.history.push({ts: new Date(), lqi: foundNetworks[i].lqi, rssi: foundNetworks[i].rssi, found: true});

          if (network.history.length > _.get(settings, 'historyLength', 10)) {
            logger.debug('Dropping', _.pullAt(network.history, 0));
          }
        }
        network.found = true;
      }
    }

    // Now attach a 'we have not found it' value to all networks in the pool being not found in this scan
    for (i = 0; i < self.networks.length; i++) {
      if (!self.networks[i].found) {
        /* It is possible (no, it is very likely) that sometimes we do not get an answer even the network is in range.
         If so, then we have a tolerance of 1...3 missed scans until we admit that the network is not here: copy
         the last known value to the new entry, but as soon as we are sure that the network doesn't exist anymore, cancel
         them.
         */
        self.handleNetworkNotFound(self.networks[i].history);
      }
      if (self.networks[i].history) {
        while (self.networks[i].history.length > _.get(settings, 'historyLength', 10)) {
          logger.debug('List too long(' + self.networks[i].history.length + '), dropping', _.pullAt(self.networks[i].history, 0));
        }
      }
    }

    logger.debug('Updated network inventory');

    // We do not transmit the networks, only trigger retrieving it (same procedure as in survey)
    self.emit('networks', {ts: new Date()});
  });

  /**
   * A single network was found (we're analyzing one specific right now)
   *
   * Switching to a single network scan does not affect the pool, but we only collect data for this specific network right
   * now.
   */
  scanner.get().on('network', function (foundNetwork) {
    foundNetwork.ts = new Date();

    if (self.surveyNetwork.panId !== foundNetwork.panId) {
      logger.info('Scanning new network with PAN ID ' + foundNetwork.panId);
      self.surveyNetwork = foundNetwork;
      self.surveyNetwork.history = [];
    }

    self.surveyNetwork.history.push({ts: new Date(), lqi: foundNetwork.lqi, rssi: foundNetwork.rssi});

    if (!foundNetwork.found) {
      self.handleNetworkNotFound(self.surveyNetwork.history);
    }

    while (self.surveyNetwork.history.length > _.get(settings, 'historyLength', 10)) {
      logger.debug('Survey list too long(' + self.surveyNetwork.history.length + '), dropping', _.pullAt(self.surveyNetwork.history, 0));
    }

    self.emit('network', foundNetwork);
  });
}

util.inherits(NetworkPool, EventEmitter);

/**
 * The network was not found, manipulate (no, justify is better) the measurements
 * @param history is an array with at least element (otherwise this function won't be called as we haven't seen the
 *                network yet)
 */
NetworkPool.prototype.handleNetworkNotFound = function (history) {
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
  history.push({ts: new Date(), lqi: 0, rssi: _.get(settings, 'levels.min', -100) - 20, found: false});
  var i = history.length - 1;
  do {
    if (!history[i].found) {
      history[i].rssi = _.get(settings, 'levels.min', -100) - 20;
      history[i].lqi = 0;
    }
    i--;
  } while (!history[i].found && i > 0)
};

NetworkPool.prototype.getNetworks = function () {
  return this.networks;
};

NetworkPool.prototype.getNetworkSurvey = function (panId) {
  if (!this.surveyNetwork) {
    return;
  }
  if (this.surveyNetwork.panId === panId) {
    return this.surveyNetwork;
  }
};

NetworkPool.prototype.reset = function () {
  this.networks = [];
  this.surveyNetwork = {};
};

NetworkPool.prototype.remove = function (extendedPanId) {
  _.remove(this.networks, function (n) {
    return (n.extendedPanId === extendedPanId);
  });
};

var networkPool = new NetworkPool();

module.exports = networkPool;
