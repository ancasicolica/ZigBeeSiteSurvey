/**
 * ZigBee Site Survey Main Application File
 *
 * Created by kc on 23.06.15.
 */
'use strict';

console.log('ZigBee Site Survey Tool ©2015 Christian Kuster, CH-8342 Wernetshausen');
console.log('See http://ancasicolica.github.io/ZigBeeSiteSurvey/ for more information.');
console.log('');

var rapidConnector = require('./lib/rapidConnector');
var settings = require('./settings');
var express = require('express');
var path = require('path');
var app = express();
var indexRoute = require('./routes/index');
var scanRoute = require('./routes/scan');
var settingsRoute = require('./routes/settings');
var determineDongleType = require('./lib/tasks/determineDongleType');
var socket = require('./lib/socket');

rapidConnector.on('open', function() {
  determineDongleType.run();
});
rapidConnector.connectToRapid();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRoute);
app.use('/scan', scanRoute);
app.use('/settings', settingsRoute);


socket.init(app.listen(settings.port));
console.log('ZigBee Survey Tool ready and listening on port ' + settings.port);

