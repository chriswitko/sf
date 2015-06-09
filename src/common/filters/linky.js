angular.module('filters', [])
.filter('nearestK', function() {
    return function(input) {
      if (typeof input==="undefined") {
        return;
      } else {
        input = input+'';    // make string
        if (input < 1000) {
          return input;      // return the same number
        }
        if (input < 10000) { // place a comma between
          return input.charAt(0) + ',' + input.substring(1);
        }

        // divide and format
        return (input/1000).toFixed(input % 1000 !== 0)+'k';
      }
    };
});