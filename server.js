/**
 * ZigBee Site Survey Main Application File
 *
 * Created by kc on 23.06.15.
 */
'use strict';

var rapidConnector = require('./lib/rapidConnector');
var settings = require('./settings');
var express = require('express');
var path = require('path');
var app = express();
var indexRoute = require('./routes/index');
var scanRoute = require('./routes/scan');
var settingsRoute = require('./routes/settings');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRoute);
app.use('/scan', scanRoute);
app.use('/settings', settingsRoute);

rapidConnector.init(function (err) {
  if (err) {
    console.error(err);
    return;
  }
  app.listen(settings.port);
  console.log('ZigBee Survey Tool ready and listening on port ' + settings.port);
});
