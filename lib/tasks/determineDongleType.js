/**
 *
 * Created by kc on 14.07.15.
 */
'use strict';

var rapidConnector = require('../rapidConnector');
var _ = require('lodash');

var UITLITY_HEADER = 0x55;
var MODULE_INFO_REQUEST = 0x02;
var BOOTLOADER_VERSION_REQUEST = 0x04;
var HOST_STARTUP_READY = 0x20;
var STARTUP_SYNC_COMPLETE = 0x22

var defaultDongleInfo = {
  version: 'n/a',
  hardware: 'n/a',
  bootloaderType: 'n/a',
  applicationType: 'n/a'
};

var dongleInfo = defaultDongleInfo;


rapidConnector.on('55-3', function (data) {
  // MODULE_INFO_RESPONSE
  console.log('info');
  console.log(data);
  dongleInfo = {
    version: data[0].toString() + '.' + data[1].toString() + '.' + data[2].toString()
  };
  // Hardware Type
  switch (data[13]) {
    case 1:
      dongleInfo.hardware = 'EM250';
      break;
    case 2:
      dongleInfo.hardware = 'EM357';
      break;
    case 3:
      dongleInfo.hardware = 'STM32W108';
      break;
    default:
      dongleInfo.hardware = 'unknown';
      break;
  }

  // BootloaderType
  switch (data[14]) {
    case 0:
      dongleInfo.bootloaderType = 'standalone';
      break;

    case 1:
      dongleInfo.bootloaderType = 'application';
      break;

    default:
      dongleInfo.bootloaderType = 'unknown';
      break;
  }

  // Application Information
  switch (data[3] & 0x0f) {
    case 0:
      dongleInfo.applicationType = 'RapidSE ESP';
      break;
    case 1:
      dongleInfo.applicationType = 'RapidSE Devices';
      break;
    case 2:
      dongleInfo.applicationType = 'RapidHA';
      break;
    default:
      dongleInfo.applicationType = 'unknown';
      break;
  }

  console.log(dongleInfo);
});

rapidConnector.on('55-5', function() {
  // We don't care about a boot loader, but if we are here, this is an SE device!
  rapidConnector.setMode('SE');
  rapidConnector.writeFrame(UITLITY_HEADER, MODULE_INFO_REQUEST);
});

rapidConnector.on('55-21', function (data) {
  // STARTUP_SYNC_REQUEST
  console.log(data);
  rapidConnector.writeFrameHa(UITLITY_HEADER, STARTUP_SYNC_COMPLETE);
});

rapidConnector.on('1-9', function (data) {
  console.log('NETWORK_STATUS_RESPONSE');
  console.log(data);
  rapidConnector.setMode('HA');
  rapidConnector.writeFrame(UITLITY_HEADER, MODULE_INFO_REQUEST);
});

rapidConnector.on('55-22', function (data) {
  // STARTUP_SYNC_COMPLETE
  console.log('complete');
  console.log(data);
});

rapidConnector.once('55-80', function(data) {
  // STATUS_RESPONSE
  // This is most likely because the dongle was already initialized and the survey tool restarted. It's HA, anyway.
  rapidConnector.setMode('HA');
  rapidConnector.writeFrame(UITLITY_HEADER, MODULE_INFO_REQUEST);
});

rapidConnector.on('close', function() {
  dongleInfo = defaultDongleInfo;
});

module.exports = {
  run: function () {
    rapidConnector.writeFrameHa(UITLITY_HEADER, HOST_STARTUP_READY);
    rapidConnector.writeFrameSe(UITLITY_HEADER, BOOTLOADER_VERSION_REQUEST);
  },

  getInfo: function () {
    return dongleInfo;
  }

};
