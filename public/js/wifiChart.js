/**
 * Creates a spectrum chart
 * Created by kc on 14.03.16.
 */

'use strict';

var wifiChart;

function createWifiChart(zigBeeNetworks, wifiNetworks, $scope) {
  console.log('WifiChart', zigBeeNetworks, wifiNetworks);

  if (!wifiNetworks) {
    return;
  }
  var xs = {};
  var columns = [];
  var names = {};

  var nets = _.orderBy(wifiNetworks, ['channel', 'signal_level'], ['asc', 'desc']);
  for (var i = 0; i < nets.length; i++) {
    xs[nets[i].data[0]] = nets[i].x[0];
    names[nets[i].data[0]] = nets[i].ssid + ' [W' + nets[i].channel + ']';
    columns.push(nets[i].data);
    columns.push(nets[i].x);
  }

  nets = _.orderBy(zigBeeNetworks, ['channel', 'signal_level'], ['asc', 'desc']);
  for (var i = 0; i < nets.length; i++) {
    if (nets[i].x) {
      xs[nets[i].data[0]] = nets[i].x[0];
      names[nets[i].data[0]] = nets[i].panId + ' [Z' + nets[i].channel + ']';
      columns.push(nets[i].data);
      columns.push(nets[i].x);
    }
  }

  wifiChart = c3.generate({
    bindto: '#chart-spectrum',
    data: {
      xs: xs,
      columns: columns,
      type: 'area-spline',
      names: names
    },
    point: {
      show: false
    },
    transition: {
      duration: 0
    },
    tooltip: {
      show: true,
      contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
        var info = '';
        for (var i = 0; i < d.length; i++) {
          info += '<p>'+ d[i].name + '</p>';
        }
        return info;
      }
    },
    axis: {
      x: {
        min: 2401,
        max: 2484,
        tick: {
          count: 10,
          format: function (x) {
            return Math.round(x);
          }
        }
      }
    }
  });


}
