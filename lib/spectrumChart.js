/**
 * Creates data for a spectrum chart
 * Created by kc on 21.03.16.
 */

const BigNumber = require('bignumber.js');
const GaussianElimination = require('na-gaussian-elimination');
const zero = new BigNumber(0);
GaussianElimination.defaultOptions.zero = zero;


/**
 * Calculates a spectrum chart
 * @param options see below
 *
 * Options parameters
 *   .frequency:     Center frequency of the signal
 *   .bandwith:      Bandwith of the spectrum
 *   .amplitude:     Level of the signal (should be positive for nice graphs)
 *   .samples:       Number of samples to take (optional, default: 10)
 *
 *   .freqColName:   Name of the frequency (x) column
 *   .amplColName:   Name of the data (y) column
 *
 *  Returns:
 *    An object with two arrays, ready to be used in the D3 charts
 *
 *    Sample:
 *    { x:
         [ 'x1',
           2401,
           2403.2,
           2405.4,
           2407.6,
           2409.8,
           2412,
           2414.2,
           2416.4,
           2418.6,
           2420.8,
           2423 ],
        data: [ 'data1', -0, 7.2, 12.8, 16.8, 19.2, 20, 19.2, 16.8, 12.8, 7.2, 0 ] }
 */
module.exports = function (options) {
  console.log('New chart', options);

  var x;
  var lowerX = options.frequency - options.bandwith / 2;
  var upperX = options.frequency + options.bandwith / 2;
  var samples = options.samples || 10;

  var gaussianElimination = new GaussianElimination();

  // Create the matrix in order to get a,b and c of "a*x^2+bx+c" where x are the known points of the graph
  var matrix = [
    [new BigNumber(Math.pow(lowerX, 2)), new BigNumber(lowerX), new BigNumber(1)],
    [new BigNumber(Math.pow(options.frequency, 2)), new BigNumber(options.frequency), new BigNumber(1)],
    [new BigNumber(Math.pow(upperX, 2)), new BigNumber(upperX), new BigNumber(1)]
  ];
  var result = [
    zero, new BigNumber(options.amplitude), zero
  ];

  var system = gaussianElimination.solve(matrix, result);

  var retVal = {
    x: [options.freqColName],
    data: [options.amplColName]
  };

  for (x = lowerX; x < upperX; x += (upperX - lowerX) / samples) {
    var y = Math.abs(system.solution[0].toNumber() * Math.pow(x, 2) + system.solution[1].toNumber() * x + system.solution[2].toNumber());

    retVal.x.push(Math.round(x * 100) / 100);
    retVal.data.push(Math.round(y * 100) / 100);
  }

  return retVal;
};
