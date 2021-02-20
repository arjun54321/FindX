// var Sentiment = require('sentiment');
// var sentiment = new Sentiment();
// var result = sentiment.analyze('Cats are stupid but I love them.');
// console.dir(result);

// var a = [3, 2, 1]
// var b = ['a', 'c', 'b']

var answer_id = [
  42895373,
  42895692,
  34560677,
  62450361,
  62450451,
  58248887,
  58248947,
  58260351,
  37360433,
  28310931,
  28310953,
  50500103,
  1444425,
  1446399,
  3048255,
  28896431,
  28896433,
  55217153,
  35531586,
  41385765,
  13117520,
  15401703,
  14703114,
];
var auth_repo = [
  126516,
  56,
  16786,
  26127,
  9774,
  14004,
  476,
  1384,
  20458,
  382,
  1774,
  236543,
  7116,
  1209,
  10473,
  687954,
  1303,
  3654,
  38265,
  3789,
  21656,
  545,
  26555,
];

var zipped = answer_id.map(function (e, i) {
  return [e, auth_repo[i]];
});

console.log(zipped);

// //WITH FIRST COLUMN
// arr1 = arr.sort(function (a, b) {
//   return a[0] - b[0];
// });

// console.log(arr1);

//WITH SECOND COLUMN
sorted = zipped.sort(function (answer_id, auth_repo) {
  return answer_id[1] - auth_repo[1];
});

console.log(sorted);

const arrayColumn = (arr, n) => arr.map((x) => x[n]);

// const twoDimensionalArray = [
//   [42895692, 56],
//   [28310931, 382],
//   [58248947, 476],
//   [15401703, 545],
//   [1446399, 1209],
//   [28896433, 1303],
//   [58260351, 1384],
//   [28310953, 1774],
//   [55217153, 3654],
//   [41385765, 3789],
//   [1444425, 7116],
//   [62450451, 9774],
//   [3048255, 10473],
//   [58248887, 14004],
//   [34560677, 16786],
//   [37360433, 20458],
//   [13117520, 21656],
//   [62450361, 26127],
//   [14703114, 26555],
//   [35531586, 38265],
//   [42895373, 126516],
//   [50500103, 236543],
//   [28896431, 687954],
// ];

console.log(arrayColumn(sorted, 0));
