/**
 * Created by kc on 22.07.16.
 */


var surveyApp = angular.module('surveyApp',['ngSanitize', 'ngCsv']);
surveyApp.controller('surveyCtrl', ['$scope', function ($scope) {

  $scope.hello = '1234';
  $scope.hello = survey.test('fff');

}]);