/**
 * Angular.js controller for the site survey tool
 * Created by kc on 25.06.15.
 */
'use strict';
var surveyControl = angular.module('surveyApp', ['ngSanitize', 'ngCsv']);
surveyControl.controller('surveyCtrl', ['$scope', '$http', function ($scope, $http) {
  $scope.settings = {
    levels: {
      min: -128, // just a default until we loaded the data from the server
      max: 0
    }
  };
  $scope.noRssiValue = -128;

  $scope.panel = 'networks';
  $scope.networks = [];
  $scope.networkScanActive = false;
  $scope.continousScanningActive = false;
  $scope.measurements = [];
  $scope.columns = {
    x: ['x'],
    rssi: ['RSSI'],
    lqi: ['LQI']
  };
  $scope.chart = {};
  $scope.networkFailureCounter = 0;
  $scope.currentLocation = '';
  $scope.log = [];
  $scope.usbConnected = false;
  $scope.startingUp = true;
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
  });

  function convertTimeStampInNetwork(network) {
    for (var t = 0; t < network.history.length; t++) {
      network.history[t].ts = new Date(network.history[t].ts);
    }
  }

  /**
   * Receiving the network data
   * @param networks
   */
  $scope.updateNetworkData = function (info) {
    console.log('Networks updated: ', info);
    if ($scope.panel !== 'networks') {
      // don't care about it
      console.warn('Networks not updated, wrong panel');
      return;
    }

    $http.get('/networks')
      .success(function (networks) {
        for (var i = 0; i < networks.length; i++) {
          var network = _.find($scope.networks, {extendedPanId: networks[i].extendedPanId});
          if (!network) {
            network = networks[i];
            console.log('INIT CHART ', '#chart-' + network.id);
            convertTimeStampInNetwork(network);
            // We can't generate the chart right here, as the chart area does currently not exist.
            // Set flag that chart has to be generated before loading data
            network.chartGenerated = false;
            $scope.networks.push(network);
          }
          else {
            network.rssi = networks[i].rssi;
            network.lqi = networks[i].lqi;
            network.found = true;
            network.ts = new Date(networks[i].ts);
            network.history = networks[i].history;
            convertTimeStampInNetwork(network);
            console.log(network);
            if (network.chartGenerated) {
              // Chart was generated before, just load the data
              network.chart.load({
                json: network.history,
                keys: {
                  x: 'ts',
                  value: ['rssi']
                }
              });
            }
            else {
              // Generate chart first
              convertTimeStampInNetwork(network);
              network.chart = c3.generate({
                bindto: '#chart-' + network.id,

                data: {
                  json: network.history,
                  keys: {
                    x: 'ts',
                    value: ['rssi']
                  },
                  names: {
                    rssi: 'RSSI'
                  },
                  type: 'line'
                },
                transition: {
                  duration: 0
                },
                axis: {
                  x: {
                    type: 'timeseries',
                    tick: {
                      format: '%H:%M:%S'
                    }
                  },
                  y: {
                    max: $scope.settings.levels.max,
                    min: $scope.settings.levels.min,
                    tick: {
                      format: function (d) {
                        return d + ' dB';
                      }
                    },
                    padding: {top: 0, bottom: 0}
                  }
                },
                regions: [
                  {
                    axis: 'y',
                    start: $scope.settings.levels.min - 10,
                    end: $scope.settings.levels.acceptable,
                    class: 'region-bad'
                  },
                  {
                    axis: 'y',
                    start: $scope.settings.levels.acceptable,
                    end: $scope.settings.levels.good,
                    class: 'region-acceptable'
                  },
                  {
                    axis: 'y',
                    start: $scope.settings.levels.good,
                    end: $scope.settings.levels.max,
                    class: 'region-good'
                  }
                ],
                zoom: { // do not zoom in overview
                  enabled: false
                }
              });
              network.chartGenerated = true;
            }
          }
        }

        $scope.networks = _.sortBy($scope.networks, 'extendedPanId');
      })
      .error(function (resp) {
        console.warn(resp);
      });
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
    $scope.updateChart(network);
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
   * Toggles measurement: on / off
   */
  $scope.toggleMeasurement = function () {
    $scope.continousScanningActive = !$scope.continousScanningActive;

    if ($scope.continousScanningActive) {

    }
  };

  /**
   * Returns the text for the pause/continue button
   * @returns {*}
   */
  $scope.getActionText = function () {
    if ($scope.continousScanningActive) {
      return 'Pause measurement';
    }
    return 'Continue measurement';
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
        $scope.calculateProgressBarLimits();
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
   * @param network
   */
  $scope.survey = function (network) {
    $http.post('/scanner/scanSpecificNetwork', {channel: network.channel, panId: network.panId})
      .success(function (networkInfo) {
        $scope.currentNetwork = network;
        $scope.panel = 'survey';
        $scope.measurements = networkInfo.history || [];
        $scope.continousScanningActive = true;
        $scope.networkFailureCounter = 0;
        $scope.log = [];

        // Convert timestamp
        for (var i = 0; i < $scope.measurements.length; i++) {
          $scope.measurements[i].ts = new Date($scope.measurements[i].ts);
        }

        $scope.chart = c3.generate({
          bindto: '#chart',
          size: {
            height: 400
          },
          data: {
            json: $scope.measurements,
            keys: {
              x: 'ts',
              value: ['rssi']
            },
            type: 'line'
          },
          axis: {
            x: {
              type: 'timeseries',
              tick: {
                format: '%H:%M:%S'
              }
            },
            y: {
              max: $scope.settings.levels.max,
              min: $scope.settings.levels.min,
              tick: {
                format: function (d) {
                  return d + ' dB';
                }
              },
              padding: {top: 0, bottom: 0}
            },
            y2: {
              show: true,
              max: 255,
              min: 0,
              padding: {top: 10, bottom: 0}
            }
          },
          regions: [
            {
              axis: 'y',
              start: $scope.settings.levels.min - 10,
              end: $scope.settings.levels.acceptable,
              class: 'region-bad'
            },
            {
              axis: 'y',
              start: $scope.settings.levels.acceptable,
              end: $scope.settings.levels.good,
              class: 'region-acceptable'
            },
            {
              axis: 'y',
              start: $scope.settings.levels.good,
              end: $scope.settings.levels.max,
              class: 'region-good'
            }
          ],
          zoom: { // Zoom is marked as experimental, still use it
            enabled: true
          }
        });

      })
      .error(function (info) {
        console.error('Call to /scanner/scanSpecificNetwork failed', info);
      });
  };

  /**
   * Close survey mode
   */
  $scope.closeSurvey = function () {

    $http.post('/scanner/scanNetworks', {})
      .success(function (networkInfo) {
        $scope.continousScanningActive = false;
        $scope.panel = 'networks';
      });
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
      $scope.currentLocation = '';
      $scope.log.push(entry);
    }
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
   * Calculates the limits of the progress bar
   */
  $scope.calculateProgressBarLimits = function () {
    if (!$scope.settings) {
      console.warn('Settings not available, can not calculate limits');
      return;
    }
    var rssiRange = Math.abs($scope.settings.levels.max - $scope.settings.levels.min);
    $scope.progressBarDangerWidth = Math.abs($scope.settings.levels.acceptable - $scope.settings.levels.min) / rssiRange * 100;
    $scope.progressBarWarningWidth = Math.abs($scope.settings.levels.good - $scope.settings.levels.acceptable) / rssiRange * 100;
    $scope.progressBarSuccessWidth = Math.abs($scope.settings.levels.max - $scope.settings.levels.good) / rssiRange * 100;
  };
  /**
   * Shortcut for the progressbars
   * @returns {{progressBarDangerWidth, progressBarWarningWidth, progressBarSuccessWidth}}
   */
  $scope.getLatestRssiProgressbarData = function () {
    return $scope.getProgressBarWidth($scope.getLatestMeasurementEntry().rssi);
  };

  /**
   * Gets the widths of the different progressbars
   * @param rssi
   * @returns {*}
   */
  $scope.getProgressBarWidth = function (rssi) {
    if (!$scope.settings || !$scope.settings.levels) {
      return {
        progressBarDangerWidth: 0,
        progressBarWarningWidth: 0,
        progressBarSuccessWidth: 0
      };
    }
    if (rssi < $scope.settings.levels.acceptable) {
      console.log('RSSI to low');
      console.log(Math.abs(rssi - $scope.settings.levels.min) / Math.abs($scope.settings.levels.acceptable - $scope.settings.levels.min) * $scope.progressBarDangerWidth);
      console.log(Math.abs(rssi - $scope.settings.levels.min));
      console.log(Math.abs($scope.settings.levels.acceptable - $scope.settings.levels.min));
      console.log($scope.progressBarDangerWidth);
      return {
        progressBarDangerWidth: Math.abs(rssi - $scope.settings.levels.min) / Math.abs($scope.settings.levels.acceptable - $scope.settings.levels.min) * $scope.progressBarDangerWidth,
        progressBarWarningWidth: 0,
        progressBarSuccessWidth: 0
      };
    }
    if (rssi > $scope.settings.levels.good) {
      return {
        progressBarDangerWidth: $scope.progressBarDangerWidth,
        progressBarWarningWidth: $scope.progressBarWarningWidth,
        progressBarSuccessWidth: Math.abs(rssi - $scope.settings.levels.good) / Math.abs($scope.settings.levels.max - $scope.settings.levels.good) * $scope.progressBarSuccessWidth
      };
    }
    return {
      progressBarDangerWidth: $scope.progressBarDangerWidth,
      progressBarWarningWidth: Math.abs(rssi - $scope.settings.levels.acceptable) / Math.abs($scope.settings.levels.good - $scope.settings.levels.acceptable) * $scope.progressBarWarningWidth,
      progressBarSuccessWidth: 0
    };
  };


  /**
   * Calculates a percent values for RSSI (progress bar)
   * @param rssi
   * @returns {number}
   */
  $scope.calculateRssiPercent = function (rssi) {
    return 100 - Math.abs(rssi / ($scope.settings.levels.max - $scope.settings.levels.min)) * 100;
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
  /**
   * Updates the chart with a new entry
   * @param newEntry
   */
  $scope.updateChart = function (newEntry) {
    // Add entry first to our measurement list, convert timestamp to date
    newEntry.ts = new Date(newEntry.ts);

    $scope.measurements.push(newEntry);
    $scope.chart.load({
      json: $scope.measurements,
      keys: {
        x: 'ts',
        value: ['rssi']
      }
    });
  };


}]);


