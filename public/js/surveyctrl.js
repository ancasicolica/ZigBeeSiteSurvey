/**
 *
 * Created by kc on 25.06.15.
 */
'use strict';
var surveyControl = angular.module('surveyApp', []);
surveyControl.controller('surveyCtrl', ['$scope', '$http', function ($scope, $http) {
  $scope.panel = 'networks';
  $scope.networks = [];
  $scope.networkScanActive = false;
  $scope.measurements = [];
  $scope.rssiMin = -100;
  $scope.rssiMax = 0;

  $(document).ready(function () {
    $scope.getNetworks();
  });

  /**
   * Switch to the survey mode
   * @param panId
   */
  $scope.survey = function(network) {
    $scope.currentNetwork = network;
    $scope.panel = 'survey';
    $scope.measurements = [];
    $scope.updateCurrentNetworkData();
  };

  /**
   * Returns the last entry of the measurement
   * @returns {*}
   */
  $scope.getLatestMeasurementEntry = function() {
    if($scope.measurements.length === 0) {
      return {rssi:0, lqi:0};
    }
    return _.last($scope.measurements);
  };

  /**
   * Return the class for the progressbar associated with the given rssi value
   * @param rssi
   */
  $scope.getRssiClass = function(rssi) {
    if (rssi < -63) {
      return 'progress-bar-danger';
    }
    if (rssi > -50) {
      return 'progress-bar-success'
    }
    return 'progress-bar-warning';
  };
  /**
   * Get information about all networks
   */
  $scope.getNetworks = function() {
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

  $scope.calculateRssiPercent = function(rssi) {
    return 100 - Math.abs(rssi / ($scope.rssiMax - $scope.rssiMin)) * 100;
  };
  /**
   * Get information about all networks
   */
  $scope.updateCurrentNetworkData = function() {
    $scope.networkScanActive = true;
    $http.get('/scan/' + $scope.currentNetwork.channel + '/' + $scope.currentNetwork.panId).
      success(function (data) {
        if (data.status === 'ok') {
          if (data.networks.length > 0) {
            var m = data.networks[0];
            m.rssiPercent = $scope.calculateRssiPercent(m.rssi);
            $scope.measurements.push(m);
          }
        }
        $scope.networkScanActive = false;

        // start again (don't forget to stop this one time...)
        _.delay($scope.updateCurrentNetworkData, 500);
      }).
      error(function (data, status) {
        console.log('error:');
        console.log(data);
        console.log(status);
        $scope.networkScanActive = false;
      });
  };


}]);
