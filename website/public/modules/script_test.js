var doSomething = (function () {
  "use strict";
   return {
      test: (function () {
        return 'test';
      }()),
      test1: (function (dat) {
        console.log("data here: " + dat);
        return;
      }),
      test2: (function (dat) {
        return console.log('test 2 data: ' + dat);
      })
   };
}());
