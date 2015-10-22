/**
 * Angular.js controller for the site survey tool
 * Created by kc on 25.06.15.
 */
'use strict';
var surveyControl = angular.module('surveyApp', ['n3-line-chart', 'ngSanitize', 'ngCsv']);
surveyControl.controller('surveyCtrl', ['$scope', '$http', function ($scope, $http) {
  $scope.settings = {};
  $scope.panel = 'networks';
  $scope.networks = [];
  $scope.networkScanActive = false;
  $scope.continousScanningActive = false;
  $scope.measurements = [];
  $scope.rssiMin = -100;
  $scope.rssiMax = 0;
  $scope.networkFailureCounter = 0;
  $scope.currentLocation = '';
  $scope.log = [];
  $scope.usbConnected = false;
  $scope.startingUp = true;
  $scope.surveyReady = false; // True when connected and dongle first time seen

  $scope.chartOptions = {
    axes: {
      x: {key: 'ts', ticksFormat: '%H:%M:%S', type: 'date'},
      y: {type: 'linear', min: -120, max: 1},
      y2: {type: 'linear', min: 0, max: 255}
    },
    margin: {
      left: 30,
      right: 60
    },
    series: [
      {y: 'rssi', color: 'steelblue', thickness: '2px', type: 'line', label: 'RSSI'},
      {y: 'lqi', axis: 'y2', color: '#A901DB', thickness: '2px', type: 'line', label: 'LQI'}
    ],
    lineMode: 'linear',
    tension: 0.7,
    tooltip: {
      mode: 'scrubber', formatter: function (x, y, series) {
        return y + ' @ ' + x;
      }
    },
    drawLegend: true,
    drawDots: false,
    hideOverflow: false,
    columnsHGap: 5
  };

  $(document).ready(function () {
    // Get the settings
    $scope.refreshSettings();
    $scope.getNetworks();

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
    })
  });

  /**
   * Toggles measurement: on / off
   */
  $scope.toggleMeasurement = function () {
    $scope.continousScanningActive = !$scope.continousScanningActive;

    if ($scope.continousScanningActive) {
      $scope.updateCurrentNetworkData();
    }
  };

  /**
   * Returns the text for the pause/continue button
   * @returns {*}
   */
  $scope.getActionText = function () {
    if ($scope.continousScanningActive) {
      return 'pause';
    }
    return 'continue';
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
    }).
      error(function (data, status) {
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
   * @param panId
   */
  $scope.survey = function (network) {
    $scope.currentNetwork = network;
    $scope.panel = 'survey';
    $scope.measurements = [];
    $scope.continousScanningActive = true;
    $scope.networkFailureCounter = 0;
    $scope.log = [];
    $scope.updateCurrentNetworkData();
  };

  /**
   * Close survey mode
   */
  $scope.closeSurvey = function () {
    $scope.continousScanningActive = false;
    $scope.panel = 'networks';
  };

  /**
   * Add a log entry
   */
  $scope.addLog = function () {
    if ($scope.currentLocation.length > 0) {
      var entry = $scope.getLatestMeasurementEntry();
      entry.info = $scope.currentLocation;

      if (_.find($scope.log, {ts: entry.ts})) {
        console.log('entry already in log');
        return;
      }
      $scope.log.push(entry);
    }
  };
  /**
   * Returns the last entry of the measurement
   * @returns {*}
   */
  $scope.getLatestMeasurementEntry = function () {
    if ($scope.measurements.length === 0) {
      return {rssi: 0, lqi: 0};
    }
    return _.last($scope.measurements);
  };

  /**
   * Return the class for the progressbar associated with the given rssi value
   * @param rssi
   */
  $scope.getRssiClass = function (rssi) {
    if (!$scope.settings || !$scope.settings.levels) {
      return;
    }
    if (rssi < $scope.settings.levels.acceptable) {
      return 'progress-bar-danger';
    }
    if (rssi > $scope.settings.levels.good) {
      return 'progress-bar-success'
    }
    return 'progress-bar-warning';
  };
  /**
   * Get information about all networks
   */
  $scope.getNetworks = function () {
    $scope.networkScanActive = true;
    $http.get('/scan/all').
      success(function (data) {
        if (data.status === 'ok') {
          $scope.networks = data.networks
        }
        else {
          $scope.networks = [];
        }
        $scope.networkScanActive = false;

      }).
      error(function (data, status) {
        console.log('error:');
        console.log(data);
        console.log(status);
        $scope.networks = [];
        $scope.networkScanActive = false;
      });
  };

  /**
   * Calculates a percent values for RSSI (progress bar)
   * @param rssi
   * @returns {number}
   */
  $scope.calculateRssiPercent = function (rssi) {
    return 100 - Math.abs(rssi / ($scope.rssiMax - $scope.rssiMin)) * 100;
  };
  /**
   * Cancels the scanning for one single network
   */
  $scope.cancelContinousScanning = function () {
    $scope.continousScanningActive = false;
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
   * Get information about all networks
   */
  $scope.updateCurrentNetworkData = function () {
    function continueAfterScan() {
      if ($scope.continousScanningActive) {
        _.delay($scope.updateCurrentNetworkData, 500);
      }
    }

    $scope.networkScanActive = true;
    $http.get('/scan/' + $scope.currentNetwork.channel + '/' + $scope.currentNetwork.panId).
      success(function (data) {
        if (data.status === 'ok') {
          if (data.networks.length > 0) {
            var m = data.networks[0];
            m.rssiPercent = $scope.calculateRssiPercent(m.rssi);
            m.lqiPercent = m.lqi / 255 * 100;
            m.ts = new Date();
            if (m.found) {
              $scope.measurements.push(m);
              $scope.networkFailureCounter = 0;
            }
            else {
              // Network not found
              $scope.networkFailureCounter++;
              if ($scope.networkFailureCounter > 2) {
                $scope.measurements.push(m);
              }
              $scope.networkFailureCounter++;
              console.log('networkFailureCounter: ' + $scope.networkFailureCounter);
            }
          }
        }
        $scope.networkScanActive = false;
        continueAfterScan();
      }).
      error(function (data, status) {
        console.log('error:');
        console.log(data);
        console.log(status);
        $scope.networkScanActive = false;
        continueAfterScan();
      });
  };

  // Warning before unloading
  window.onbeforeunload = function () {
    if ($scope.continousScanningActive) {
      return 'Measurement is in active.\n\nDo you want to cancel the measurements and leave the page?';
    }
  };

}]);


