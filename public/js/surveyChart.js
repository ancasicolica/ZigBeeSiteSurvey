/**
 * Survey Chart module
 * Created by kc on 14.03.16.
 */

'use strict';

/**
 * Generate the survey chart
 * @param $scope
 */
function createSurveyChart($scope) {
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
          count: 10,
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
}
