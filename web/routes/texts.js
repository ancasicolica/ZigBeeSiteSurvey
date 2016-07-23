/**
 * Get the texts, built-in or custom
 * Created by kc on 10.12.15.
 */

const express = require('express');
const router = express.Router();
const core = require('zigbee-survey-core')();
const settings = require('../../settings');
const logger = core.getLogger('routes:texts');

var texts = require('../../texts.json');

if (settings.custom && settings.custom.enabled && settings.custom.texts) {
  texts = require('../public/' + settings.custom.texts);
  logger.info('Using custom texts');
}

/**
 * Scans all networks
 */
router.get('/', function (req, res) {
    res.send('var txt = ' + JSON.stringify(texts) + ';');
});


module.exports = router;
