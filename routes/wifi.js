/**
 * Get Wifi Activity
 * Created by kc on 14.03.16.
 */

const express = require('express');
const router = express.Router();
const wifiScanner = require('../lib/wifiScanner');
const networkPool = require('../lib/networkPool');
const logger = require('../lib/logger').getLogger('routes:wifi');
const spectrumChart = require('../lib/spectrumChart');
const _ = require('lodash');

const wifiFrequencies = {
  '1': 2412,
  '2': 2417,
  '3': 2422,
  '4': 2427,
  '5': 2432,
  '6': 2437,
  '7': 2442,
  '8': 2447,
  '9': 2452,
  '10': 2457,
  '11': 2462,
  '12': 2467,
  '13': 2472,
  '14': 2484
};

const wifiBandwith = 22;

/**
 * Scans all wifi networks
 */
router.get('/', (req, res) => {
  logger.info('/: get all networks');
  wifiScanner.scan((err, networks) => {
    if (err) {
      return res.status(500).send({message: err.message});
    }
    res.send({status: 'ok', networks: networks});
  });
});


/**
 * Returns data ready to be plotted in graph. The calculation is done in the node process (and not the browser) in
 * order to avoid browser interoperability problems.
 */
router.get('/spectrum', (req, res) => {
  try {
    wifiScanner.scan((err, networks) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }

      // Result: array with 2.4GHz networks
      var net24 = [];

      var i = 0;
      networks.forEach(n => {

        // We concern only about 2.4 GHz networks
        if (n.channel && wifiFrequencies[n.channel]) {
          i++;
          console.log('Wifi 2.4 network found: ', n);
          // Convert integers to integers (as they should be already...)
          console.log(n);
          n.channel = parseInt(n.channel, 10);
          n.signal_level = parseInt(n.signal_level, 10);
          console.log('-------------------');

          var chartData = spectrumChart({
            frequency: wifiFrequencies[n.channel],
            bandwith: wifiBandwith,
            amplitude: n.signal_level + 100,
            freqColName: 'xWifi' + i,
            amplColName: 'dataWifi' + i
          });
          n.x = chartData.x;
          n.data = chartData.data;
          n.index = i;
          net24.push(n);
        }
        else {
          logger.info('ignoring network:', n);
        }
      });
      res.send({status: 'ok', networks: net24});
    });
  }
  catch (ex) {
    logger.error(ex);
    return res.status(500).send({message: ex.message});
  }
});

module.exports = router;

