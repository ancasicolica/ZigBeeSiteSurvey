/**
 * Created by kc on 22.07.16.
 */

const settings = require('../../settings');
const core = require('../../core')(settings);
const logger = core.getLogger('lib:survey');
const $ = require('jquery');

var currentView = '#view-all-networks';

function setDongleAvailable(available) {
  $('.view').hide();
  if (available) {
    $(currentView).show();
  }
  else {
    $('#view-no-dongle').show();
  }
}

console.log('Starting up survey');
setDongleAvailable(false);

logger.info('Starting up');
// Events
core.on('usbConnected', device => {
  logger.info('usbConnected', device);
  setDongleAvailable(true);
});

core.on('usbDisconnected', () => {
  logger.info('usbDisconnected');
  setDongleAvailable(false);
});
core.on('ready', info => {
  logger.info('ready', info);
  setDongleAvailable(true);
});
core.on('networks', networks => {
  logger.info('networks', networks);
});
core.on('network', network => {
  logger.info('network', network);
});

module.exports = {
  test: function(a) {
    return 'test: ' + a;
  },
  $: $
};

