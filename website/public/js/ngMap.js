// Controls all Google Maps Objects
var m = angular.module('ngMap', ['uiGmapgoogle-maps']);

m.config(function(uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyB8nllB0zwraQo5qJMGdtcxulsTPJOnd8U',
    v: '3.20',
    libraries: 'weather,geometry,visualization'
  });
});

m.controller('MapCtrl', function($scope, $log, $timeout) {
  $scope.map = {
    center: {
      longitude: -111.652889,
      latitude: 35.190833
    },
    zoom: 14
  };
  $scope.options = {
    scrollwheel: false,
    disableDefaultUI: true
  };
});
