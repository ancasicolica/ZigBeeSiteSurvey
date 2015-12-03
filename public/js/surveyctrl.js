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

  $scope.panel = 'networks';
  $scope.networks = [];
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
  });

  /**
   * Converts the timestamps of one specific networks (from string to date)
   * @param network
   */
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
      return 'Continue measurement';
    }
    return 'Pause measurement';
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
   * @param network
   */
  $scope.survey = function (network) {
    $http.post('/scanner/scanSpecificNetwork', {channel: network.channel, panId: network.panId})
      .success(function (networkInfo) {
        $scope.currentNetwork = network;
        $scope.panel = 'survey';
        $scope.measurements = networkInfo.history || [];
        $scope.log = [];

        // Convert timestamp
        for (var i = 0; i < $scope.measurements.length; i++) {
          $scope.measurements[i].ts = new Date($scope.measurements[i].ts);
        }

        /* RSSI CHART */
        $scope.chartSurvey = c3.generate({
          bindto: '#chart-survey',
          size: {
            height: 400
          },
          data: {
            json: $scope.measurements,
            keys: {
              x: 'ts',
              value: ['lqi', 'rssi']
            },
            type: 'line',
            types: {
              'lqi': 'step'
            },
            axes: {
              'lqi': 'y2',
              'rssi': 'y'
            },
            names: {
              rssi: 'RSSI',
              lqi: 'LQI'
            },
            colors: {
              rssi: 'blue',
              lqi: 'plum'
            }
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
              label: 'RSSI',
              tick: {
                format: function (d) {
                  return d + ' dB';
                }
              },
              padding: {top: 0, bottom: 0}
            },
            y2: {
              max: 255,
              min: 0,
              label: 'LQI',
              show: true
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
          },
          point: {
            show: false
          }
        });

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


