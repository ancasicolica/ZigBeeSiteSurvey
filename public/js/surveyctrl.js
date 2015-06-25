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



}]);
