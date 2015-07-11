/**
 * Angular.js controller for the site survey tool
 * Created by kc on 25.06.15.
 */
'use strict';
var surveyControl = angular.module('surveyApp', []);
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

  $(document).ready(function () {
    // Get the settings
    $scope.refreshSettings();

    $.getScript("https://www.google.com/jsapi")
      .done(function () {
        console.log('jsapi loaded, now loading chart api');
        google.load('visualization', '1.0', {'packages': ['corechart'], callback: $scope.drawChart});
      })
      .fail(function (jqxhr, settings, exception) {
        console.log("Triggered ajaxError handler.");
        console.log(exception);
      });
    $scope.getNetworks();
  });

  /**
   * Refresh the settings (and more important the current COM port)
   */
  $scope.refreshSettings = function() {
    $http.get('/settings').success(function (data) {
      if (data.status === 'ok') {
        $scope.settings = data.settings;
        $scope.connectedSerialPort = data.serialport;
      }
      _.delay($scope.refreshSettings, 5000);
    }).
      error(function (data, status) {
        console.log('error:');
        console.log(data);
        console.log(status);
      });
  };
  /**
   * Returns the currently connected serial port
   */
  $scope.getConnectedSerialPort = function() {
    if($scope.connectedSerialPort) {
      return $scope.connectedSerialPort.comName;
    }
    else {
      return 'NOT CONNECTED!';
    }
  };
  /**
   * Check whether the USB dongle is attached or not
   * @returns {boolean}
   */
  $scope.isConnectedToSerialPort = function() {
    return !_.isUndefined($scope.connectedSerialPort);
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
    $scope.panel = 'network';
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
   * Draw the chart with the last measurements, we are using Google diagrams
   */
  $scope.drawChart = function () {
    if (google) {
      var chartData = new google.visualization.DataTable();
      // The colums of the chart
      chartData.addColumn('datetime', 'Time');
      chartData.addColumn('number', 'dBm');

      for (var i = 0; i < $scope.measurements.length; i++) {
        chartData.addRow([$scope.measurements[i].ts, $scope.measurements[i].rssi]);
      }

      var options = {
        curveType: 'function',
        legend: {position: 'none'},
        title: "RSSI [dBm]",
        vAxis: {
          maxValue: 3
        }
      };

      var chart = new google.visualization.LineChart(document.getElementById('chart'));

      chart.draw(chartData, options);
    }
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
   * Get information about all networks
   */
  $scope.updateCurrentNetworkData = function () {
    function continueAfterScan() {
      if ($scope.continousScanningActive) {
        _.delay($scope.updateCurrentNetworkData, 500);
      }
      else {
        $scope.panel = 'networks';
      }
    }

    $scope.networkScanActive = true;
    $http.get('/scan/' + $scope.currentNetwork.channel + '/' + $scope.currentNetwork.panId).
      success(function (data) {
        if (data.status === 'ok') {
          if (data.networks.length > 0) {
            var m = data.networks[0];
            m.rssiPercent = $scope.calculateRssiPercent(m.rssi);
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
            $scope.drawChart();
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


}]);
