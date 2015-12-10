/**
 * ZigBee Site Survey Main Application File
 *
 * Created by kc on 23.06.15.
 */
'use strict';

console.log('ZigBee Site Survey Tool ©2015 Christian Kuster, CH-8342 Wernetshausen');
console.log('See http://ancasicolica.github.io/ZigBeeSiteSurvey/ for more information.');
console.log('');

//do something when app is closing
/*
 process.on('exit', function onExit(code) {
 console.error('ZigBee Site Survey Exit: Process is about to exit with code: ', code);
 var stack = new Error().stack;
 console.error(stack);
 process.removeListener('exit', onExit);
 process.exit(-1);
 });
 */

//catches uncaught exceptions
/*
 process.on('uncaughtException',  function(err) {
 console.log('Caught exception: ' + err);
 process.exit(-1);
 });
 */

var rapidConnector = require('./lib/rapidConnector');
var settings = require('./settings');
var express = require('express');
var path = require('path');
var indexRoute = require('./routes/index');
var settingsRoute = require('./routes/settings');
var scannerRoute = require('./routes/scanner');
var networksRoute = require('./routes/networks');
var resetRoute = require('./routes/reset');
var textRoute = require('./routes/texts');
var determineDongleType = require('./lib/tasks/determineDongleType');
var socket = require('./lib/socket');
var bodyParser = require('body-parser');
var compression = require('compression');
var logger = require('./lib/logger').getLogger('server');
require('./lib/networkPool');

rapidConnector.on('open', function () {
  determineDongleType.run();
});
rapidConnector.on('error', function (err) {
  logger.error(err);
});

rapidConnector.connectToRapid();

// view engine setup
var app = express();
app.use(require('./lib/expressLogger'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(compression());
app.use('/', indexRoute);
app.use('/settings', settingsRoute);
app.use('/scanner', scannerRoute);
app.use('/networks', networksRoute);
app.use('/reset', resetRoute);
app.use('/texts', textRoute);


socket.init(app.listen(settings.port));
logger.info('ZigBee Survey Tool ready and listening on port ' + settings.port);

