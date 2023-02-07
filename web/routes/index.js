/**
 * The '/' route
 * Created by kc on 25.06.15.
 */

const fs      = require('fs');
const path    = require('path');
const pug     = require('pug');
const express = require('express');
const router  = express.Router();
const core    = require('zigbee-survey-core')();
const scanner = core.getScanner();

let settings                = require('../../settings');
let customAbout             = false;
settings.custom             = settings.custom || {};
settings.custom.faviconPath = settings.custom.faviconPath || '/favicon';
settings.custom.title       = settings.custom.title || 'ZigBee Site Survey';
settings.custom.logo        = settings.custom.logo || '/favicon/favicon-96x96.png';

// Try to render the custom template(s)
let aboutFile = path.join(__dirname, '..', 'public', 'custom', 'about.pug');

if (settings.custom && settings.custom.enabled) {
  try {
    // If the file is not here, the next line crashes (throws an exception)
    let info                  = fs.statSync(aboutFile);
    settings.custom.aboutHtml = pug.renderFile(aboutFile, {});
    // when we reach this line, everything looks ok
    customAbout               = true;
  }
  catch (e) {
    // don't care. In this case we simply do not have a custom file
  }
}

/* GET home page. */
router.get('/', function (req, res) {
  // Render just in time (allow changes while tool is running
  if (customAbout) {
    settings.custom.aboutHtml = pug.renderFile(aboutFile, {});
  }
  let html = pug.renderFile(path.join(__dirname, '..', 'views', 'index.pug'), {
    title : settings.custom.title,
    custom: settings.custom
  });
  res.send(html);
  scanner.enable();

});

module.exports = router;
