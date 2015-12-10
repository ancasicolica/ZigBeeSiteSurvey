/**
 * Get the texts, built-in or custom
 * Created by kc on 10.12.15.
 */

'use strict';

var express = require('express');
var router = express.Router();

var texts = require('../texts.json');
var settings = require('../settings');

var logger = require('../lib/logger').getLogger('routes:texts');

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
