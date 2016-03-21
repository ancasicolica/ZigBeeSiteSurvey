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
    names[nets[i].data[0]] = nets[i].ssid + ' [' + nets[i].channel + ']';
    columns.push(nets[i].data);
    columns.push(nets[i].x);
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
      show: false
    },
    axis: {
      x: {
        min: 2401,
        max: 2484
      }
    }
  });


}
