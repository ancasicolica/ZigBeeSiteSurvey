/**
 * A test contro
 * Created by kc on 19.11.15.
 */

'use strict';
var surveyControl = angular.module('testApp', ['ngSanitize', 'ngCsv']);
surveyControl.controller('testCtrl', ['$scope', '$http', function ($scope, $http) {

  $scope.hello = 'Hello world';

  var a = _.random(1, 10);
  var b = _.random(1, 10);

  $scope.data = [
    {ts: new Date(), a: a, b: b}
  ];

  var chart = c3.generate({
    bindto: '#chart-test',
    data: {
      json: $scope.data,
      keys: {
        x: 'ts',
        value: ['a', 'b']
      }
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%H:%M:%S'
        }
      }
    }
  });

  $scope.addValue = function () {
    a = _.random(a - 2, a + 2);
    b = _.random(b - 2, b + 2);

    var newEntry = {ts: new Date(), a: a, b: b};
    $scope.data.push(newEntry);

    chart.load({
      json: $scope.data,
      keys: {
        x: 'ts',
        value: ['a', 'b']
      }
    });
    console.log(newEntry);
    _.delay($scope.addValue, 2000);
  };

  _.delay($scope.addValue, 1000);

}]);
