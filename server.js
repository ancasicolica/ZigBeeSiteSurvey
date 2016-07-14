/**
 * ZigBee Site Survey Main Application File
 *
 * Created by kc on 23.06.15.
 */

console.log('ZigBee Site Survey Tool ©2015 Christian Kuster, CH-8342 Wernetshausen');
console.log('See http://ancasicolica.github.io/ZigBeeSiteSurvey/ for more information.');
console.log('');

const rapidConnector = require('./lib/rapidConnector');
const settings = require('./settings');
const express = require('express');
const path = require('path');
const determineDongleType = require('./lib/tasks/determineDongleType');
const socket = require('./lib/socket');
const bodyParser = require('body-parser');
const compression = require('compression');
const logger = require('./lib/logger').getLogger('server');
const updateCheck = require('./lib/updateCheck');
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
app.use('/', require('./routes/index'));
app.use('/settings', require('./routes/settings'));
app.use('/scanner', require('./routes/scanner'));
app.use('/networks', require('./routes/networks'));
app.use('/reset', require('./routes/reset'));
app.use('/texts', require('./routes/texts'));
app.use('/wifi', require('./routes/wifi'));

updateCheck.init(settings);
updateCheck.check((err, info) => {
  // Async call when starting up, result is queried when a browser connection starts
});

socket.init(app.listen(settings.port));
logger.info('ZigBee Survey Tool ready and listening on port ' + settings.port);

