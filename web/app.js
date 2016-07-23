/**
 * ZigBee Site Survey Main Application File for the Web App
 *
 * Created by kc on 23.06.15.
 */


const settings = require('./../settings');
const core = require('../app/core')(settings);
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const compression = require('compression');
const socket = require('./lib/socket');
const logger = core.getLogger('server');
const updateCheck = require('./../lib/updateCheck');

// view engine setup
var app = express();
app.use(require('./lib/expressLogger'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'web', 'views'));
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

core.on('usbConnected', device => {
  socket.emit('usbConnected', device);
});
core.on('usbDisconnected', ()=> {
  socket.emit('usbDisconnected');
});
core.on('networks', networks => {
  socket.emit('networks', networks);
});
core.on('network', network => {
  socket.emit('network', network);
});
logger.info('ZigBee Survey Tool ready and listening on port ' + settings.port);

