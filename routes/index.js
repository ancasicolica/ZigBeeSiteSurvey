/**
 *
 * Created by kc on 25.06.15.
 */
'use strict';
var express = require('express');
var router = express.Router();
var scanner = require('../lib/scanner');
var settings = require('../settings');
var fs = require('fs');
var path = require('path');
var jade = require('jade');
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

  // Render just in time (allow changes while tool is running
  if (customAbout) {
    settings.custom.aboutHtml = jade.renderFile(aboutFile, {});
  }

  res.render('index', {title: settings.custom.title, custom: settings.custom});
  scanner.enable();
});

module.exports = router;
