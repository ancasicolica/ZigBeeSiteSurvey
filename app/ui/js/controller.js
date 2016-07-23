/**
 * Created by kc on 22.07.16.
 */


var surveyApp = angular.module('surveyApp', ['ngSanitize', 'ngCsv']);
surveyApp.controller('surveyCtrl', ['$scope',  ($scope) => {
  var networkPool = core.getNetworkPool();
  $scope.settings = settings;

  // Wait for changes in the wireless networks
  core.on('networks', networks => {
    $scope.zigBeeNetworks = _.sortBy( networkPool.getNetworks(), 'extendedPanId');
    console.log('networks', $scope.zigBeeNetworks);
    $scope.$apply();
    // Create charts after $apply, otherwise the element is not available!
    createNetworkCharts($scope.zigBeeNetworks, $scope);
  });

}]);