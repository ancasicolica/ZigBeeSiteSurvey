/**
 * The '/' route
 * Created by kc on 25.06.15.
 */

const express = require('express');
const router = express.Router();
const scanner = require('../lib/scanner');
const fs = require('fs');
const path = require('path');
const jade = require('jade');
const logger = require('../lib/logger').getLogger('routes:index');

var settings = require('../settings');
var customAbout = false;
settings.custom = settings.custom || {};
settings.custom.faviconPath = settings.custom.faviconPath || '/favicon';
settings.custom.title = settings.custom.title || 'ZigBee Site Survey';
settings.custom.logo = settings.custom.logo || '/favicon/favicon-96x96.png';

// Try to render the custom template(s)
var aboutFile = path.join(__dirname, '..', 'public', 'custom', 'about.jade');

if (settings.custom && settings.custom.enabled) {
  try {
    // If the file is not here, the next line crashes (throws an exception)
    var info = fs.statSync(aboutFile);
    settings.custom.aboutHtml = jade.renderFile(aboutFile, {});
    // when we reach this line, everything looks ok
    customAbout = true;
  }
  catch (e) {
    // don't care. In this case we simply do not have a custom file
  }
}

/* GET home page. */
router.get('/', function (req, res) {

  // we've got some performance problems, until they are solved, let this debug infos here
  logger.debug('******************** getting / start');
  // Render just in time (allow changes while tool is running
  if (customAbout) {
    settings.custom.aboutHtml = jade.renderFile(aboutFile, {});
  }
  logger.debug('******************** rendering /', settings);
  var html = jade.renderFile(path.join(__dirname, '..', 'views', 'index.jade'), {
    title: settings.custom.title,
    custom: settings.custom
  });
  logger.debug('******************** send /');
  res.send(html);
  logger.debug('******************** scanning /');
  scanner.enable();
  logger.debug('******************** getting / end');
});

module.exports = router;
