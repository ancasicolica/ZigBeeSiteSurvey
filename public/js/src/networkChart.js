/**
 * Generates the charts for the networks available
 * Created by kc on 14.03.16.
 */

'use strict';

/**
 * Converts the timestamps of one specific networks (from string to date)
 * @param network
 */
function convertTimeStampInNetwork(network) {
  const x = 0;
  for (let t = x; t < network.history.length; t++) {
    network.history[t].ts = new Date(network.history[t].ts);
  }
}

/**
 * Create the charts
 * @param networks: the received array of networks
 * @param $scope: the angular scope
 */
function createNetworkCharts(networks, $scope) {
  for (var i = 0; i < networks.length; i++) {
    var network = _.find($scope.zigBeeNetworks, {extendedPanId: networks[i].extendedPanId});
    if (!network) {
      network = networks[i];
      console.log('INIT CHART ', '#chart-' + network.id);
      convertTimeStampInNetwork(network);
      // We can't generate the chart right here, as the chart area does currently not exist.
      // Set flag that chart has to be generated before loading data
      network.chartGenerated = false;
      $scope.zigBeeNetworks.push(network);
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
                count: 4,
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
}
