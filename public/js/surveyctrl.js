/**
 * Angular.js controller for the site survey tool
 * Created by kc on 25.06.15.
 */
'use strict';

var app = angular.module('surveyApp', ['ngSanitize', 'ngCsv', 'pascalprecht.translate']);

app.config(['$translateProvider', function ($translateProvider) {
  // add translation table
  console.log('Loading Languages Version ' + txt.version);
  for (var i = 0; i < txt.sets.length; i++) {
    for (var t = 0; t < txt.sets[i].languageCodes.length; t++) {
      console.log('Adding ' + txt.sets[i].languageCodes[t]);
      $translateProvider.translations(txt.sets[i].languageCodes[t], txt.sets[i].text);
    }
  }
  //$translateProvider.preferredLanguage(txt.default);
  $translateProvider.fallbackLanguage(txt.default);
  $translateProvider.determinePreferredLanguage();
  $translateProvider.useSanitizeValueStrategy(null);
}]);


/**
 * The angular survey controller
 */
app.controller('surveyCtrl', ['$scope', '$http', '$translate', function ($scope, $http, $translate) {
  $scope.settings = {
    levels: {
      min: -128, // just a default until we loaded the data from the server
      max: 0
    }
  };

  console.log('Translation used:' + $translate.use());
  $translate('PAUSE').then(function (text) {
    $scope.TXT_PAUSE = text;
  });
  $translate('CONTINUE').then(function (text) {
    $scope.TXT_CONTINUE = text;
  });

  $scope.panel = 'networks';

  $scope.zigBeeNetworks = [];
  $scope.measurements = [];
  $scope.chartSurvey = {};
  $scope.currentLocation = '';
  $scope.log = [];
  $scope.usbConnected = false;
  $scope.startingUp = true;
  $scope.pause = false;
  $scope.surveyReady = false; // True when connected and dongle first time seen
  $scope.predicate = 'ts';
  $scope.reverse = false;

  $(document).ready(function () {
    // Get the settings
    $scope.refreshSettings();

    var socket = io();
    socket.on('usbConnected', function (info) {
      console.log('USB CONNECTED');
      $scope.usbConnected = true;
      $scope.surveyReady = true;
      _.delay($scope.refreshSettings, 1000); // not all information would be available else
      $scope.$apply();
    });

    socket.on('usbDisconnected', function () {
      console.log('USB DISCONNECTED');
      $scope.usbConnected = false;
      $scope.refreshSettings();
      $scope.$apply();
    });

    socket.on('networks', $scope.updateNetworkData);
    socket.on('network', $scope.updateSurveyData);

    // Just for demo / tests now, go directly to the network page
    //$scope.activateWifiPanel();
  });

  /**
   * Closes (removes) a network from the overview. Note that a network is displayed again when it was found.
   * @param network
   */
  $scope.closeNetwork = function (network) {
    $http.post('/networks/remove/' + network.extendedPanId).success(function () {
      // we don't care about return values and errors here
      _.pull($scope.zigBeeNetworks, network);
    });
  };

  /**
   * Receiving the network data
   * @param info
   */
  $scope.updateNetworkData = function (info) {
    console.log('Networks updated: ', info);

    switch ($scope.panel) {
      case 'networks':
        $http({method: 'GET', url: '/networks'}).then(
          function (resp) {
            createNetworkCharts(resp.data, $scope);
            $scope.zigBeeNetworks = _.sortBy($scope.zigBeeNetworks, 'extendedPanId');
          },
          function (resp) {
            console.error(resp);
          }
        );
        break;

      case 'wifi':
        $http({method: 'GET', url: '/networks/spectrum'}).then(
          function (resp) {
            $scope.zigBeeNetworks = resp.data;
            createWifiChart($scope.zigBeeNetworks.networks, $scope.wifiNetworks, $scope);
          },
          function (resp) {
            console.error(resp);
          }
        );
        break;

      default:
        console.warn('Networks not updated, wrong panel');
        break;
    }
  };

  /**
   * Update the data of the survey for one specific network
   * @param data
   */
  $scope.updateSurveyData = function (network) {
    if ($scope.panel !== 'survey') {
      // This is after loading a page with active survey: get all data and display survey
      $scope.survey(network);
      return;
    }

    // Add entry first to our measurement list, convert timestamp to date
    network.ts = new Date(network.ts);

    $scope.measurements.push(network);
    if ($scope.pause) {
      // when pausing, finish here
      console.warn('pausing');
      return;
    }
    $scope.chartSurvey.load({
      json: $scope.measurements,
      keys: {
        x: 'ts',
        value: ['rssi', 'lqi']
      }
    });
    $scope.$apply();
  };

  /**
   * Toggles measurement: on / off
   */
  $scope.toggleMeasurement = function () {
    $scope.pause = !$scope.pause;
  };

  /**
   * Returns the text for the pause/continue button
   * @returns {*}
   */
  $scope.getActionText = function () {
    if ($scope.pause) {
      return $scope.TXT_CONTINUE;
    }
    return $scope.TXT_PAUSE;
  };

  /**
   * Refresh the settings (and more important the current COM port)
   */
  $scope.refreshSettings = function () {
    $http.get('/settings').success(function (data) {
      if (data.status === 'ok') {
        $scope.startingUp = false;
        $scope.settings = data.settings;
        $scope.connectedSerialPort = data.serialport;
        $scope.usbDongle = data.usbDongle;
        if (data.serialport) {
          $scope.usbConnected = true;
          $scope.surveyReady = true;
        }
      }
    }).error(function (data, status) {
      $scope.startingUp = false;
      console.log('error:');
      console.log(data);
      console.log(status);
    });
  };

  /**
   * Returns the currently connected serial port
   */
  $scope.getConnectedSerialPort = function () {
    if ($scope.connectedSerialPort) {
      return $scope.connectedSerialPort.comName;
    }
    else {
      return 'NOT CONNECTED!';
    }
  };

  /**
   * Switch to the survey mode
   * @param network
   */
  $scope.survey = function (network) {
    $http.post('/scanner/scanSpecificNetwork', {channel: network.channel, panId: network.panId})
      .success(function (networkInfo) {
        $scope.currentNetwork = network;
        $scope.panel = 'survey';
        $scope.measurements = networkInfo.history || [];
        $scope.log = [];
        console.log(networkInfo);
        createSurveyChart($scope);

      })
      .error(function (info) {
        console.error('Call to /scanner/scanSpecificNetwork failed', info);
      });
  };

  /**
   * Close survey mode, go back to all networks
   */
  $scope.closeSurvey = function () {
    $http.post('/scanner/scanNetworks', {})
      .success(function (networkInfo) {
        $scope.panel = 'networks';
      });
  };

  /**
   * Scan wifis, display the coexistence of wifi and ZigBee
   */
  $scope.activateWifiPanel = function () {
    $scope.startingUpWifi = true;
    $scope.panel = 'wifi';
    updateWifiNetworks();
  };

  $scope.toggleNetworksAndWifi = function() {
    if ($scope.panel === 'wifi') {
      $scope.startingUpWifi = false;
      $scope.closeSurvey(); // should have a better name now!
    }
    else if ($scope.panel === 'networks') {
      $scope.activateWifiPanel();
    }
  };

  /**
   * Scan the wifi networks
   */
  function updateWifiNetworks() {
    $http({method: 'GET', url: '/wifi/spectrum'}).then(
      function (resp) {
        // Success
        $scope.wifiNetworks = resp.data.networks;
        $scope.startingUpWifi = false;
        createWifiChart($scope.zigBeeNetworks, $scope.wifiNetworks, $scope);
        console.log('Wifi scanned', resp);
        if ($scope.panel === 'wifi') {
          _.delay(updateWifiNetworks, 100);
        }
      },
      function (resp) {
        // Error
        $scope.wifiError = resp.data.message;
        $scope.startingUpWifi = false;
        console.log($scope.wifiError);
        console.error(resp);
        if ($scope.panel === 'wifi') {
          _.delay(updateWifiNetworks, 5000);
        }
      }
    );
  }

  /**
   * Add a log entry
   */
  $scope.addLog = function () {
    if ($scope.pause) {
      console.log('Not adding log, measurement paused');
      return;
    }
    if ($scope.currentLocation.length > 0) {
      var entry = $scope.getLatestMeasurementEntry();
      entry.info = $scope.currentLocation;

      if (_.find($scope.log, {ts: entry.ts})) {
        console.log('entry already in log');
        return;
      }
      $scope.currentLocation = '';
      $scope.log.push(entry);
    }
  };

  /**
   * Sets the order of the log table
   * @param predicate
   * @param reverse
   */
  $scope.sortLog = function (predicate, reverse) {
    $scope.predicate = predicate;
    $scope.reverse = reverse;
  };

  /**
   * Returns the last entry of the measurement
   * @returns {*}
   */
  $scope.getLatestMeasurementEntry = function () {
    if ($scope.measurements.length === 0) {
      return {rssi: $scope.settings.levels.min, lqi: 0};
    }
    return _.last($scope.measurements);
  };

  /**
   * Returns the filename for a complete file (all measurements)
   * @returns {string}
   */
  $scope.getFileNameForAllData = function () {
    var first = _.first($scope.measurements) || 'measurements';
    return moment().format('YYMMDD-HHmmss') + '-all-' + _.camelCase(first.extendedPanId).toUpperCase() + '.csv';
  };
  /**
   * Returns the filename for the log
   */
  $scope.getFileNameForLog = function () {
    var first = _.first($scope.measurements) || 'measurements';
    return moment().format('YYMMDD-HHmmss') + '-log-' + _.camelCase(first.extendedPanId).toUpperCase() + '.csv';
  };

  /**
   * Get the csv settings for different attributes and downloads
   */
  $scope.getCsvHeaderForAll = function () {
    return (['Date', 'RSSI', 'LQI', 'Found', 'Channel', 'PAN ID', 'Extended PAN ID', 'Info']);
  };
  $scope.getCsvColumnsForAll = function () {
    return (['ts', 'rssi', 'lqi', 'found', 'channel', 'panId', 'extendedPanId', 'info']);
  };
  $scope.getCsvHeaderForLog = function () {
    return (['Date', 'RSSI', 'LQI', 'Found', 'Info']);
  };
  $scope.getCsvColumnsForLog = function () {
    return (['ts', 'rssi', 'lqi', 'found', 'info']);
  };

}]);


