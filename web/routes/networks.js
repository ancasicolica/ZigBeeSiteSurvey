/**
 * Gets the complete data of the ZigBee networks available
 */

const express     = require('express');
const router      = express.Router();
const core        = require('zigbee-survey-core')();
const networkPool = core.getNetworkPool();
const scanner     = core.getScanner();
const logger      = core.getLogger('routes:networks');

const zigBeeFrequencies = {
  '11': 2405,
  '12': 2410,
  '13': 2415,
  '14': 2420,
  '15': 2425,
  '16': 2430,
  '17': 2435,
  '18': 2440,
  '19': 2445,
  '20': 2450,
  '21': 2455,
  '22': 2460,
  '23': 2465,
  '24': 2470,
  '25': 2475,
  '26': 2480
};

const zigBeeBandwith = 2;


/**
 * Get ALL networks with its data known
 */
router.get('/', function (req, res) {
  res.send(networkPool.getNetworks());
});

/**
 * Returns data ready to be plotted in graph. The calculation is done in the node process (and not the browser) in
 * order to avoid browser interoperability problems.
 */
router.get('/spectrum', (req, res) => {
  let networks = networkPool.getNetworks();

  let i = 0;
  networks.forEach(n => {
    i++;
    logger.debug('ZigBee network', n);
    // Convert integers to integers (as they should be already...)
    logger.debug(n);
    logger.debug('-------------------');

    let chartData = core.createSpectrumChart({
      frequency  : zigBeeFrequencies[n.channel],
      bandwith   : zigBeeBandwith,
      amplitude  : n.rssi + 100,
      freqColName: 'xZigBee' + i,
      amplColName: 'dataZigBee' + i
    });
    n.x           = chartData.x;
    n.data        = chartData.data;
    n.index       = i;
    //n.history = []; // we don't care about the history in this case
  });
  res.send({status: 'ok', networks: networks});
});

/**
 * Get ALL networks with its data known and clear the memory. This function can be used for factory
 * purposes: see if a network is available, then forget about it.
 */
router.get('/flush', function (req, res) {
  let networks = networkPool.getNetworks();
  networkPool.reset();
  res.send(networks);
});


/**
 * 2nd variant for factory: scan once, get networks (if scanner is active, it's just getting the pool data)
 */
router.get('/scan', function (req, res) {
  if (scanner.isEnabled()) {
    return res.send(networkPool.getNetworks());
  }

  core.scanNetworks((err, networks) => {
    if (err) {
      logger.error('scan request failed', err);
      return res.sendStatus(500);
    }
    return res.send(networks);
  });
});

/**
 * Removes a network from the pool
 */
router.post('/remove/:extendedPanId', function (req, res) {
  networkPool.remove(req.params.extendedPanId);
  res.send({numberOfNetworks: networkPool.getNetworks().length});
});

module.exports = router;
