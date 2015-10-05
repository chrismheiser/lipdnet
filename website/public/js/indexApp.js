var index = angular.module('indexApp', ['ngMap', 'ngContact', 'ngAnimate']);

index.controller('toggle', function($scope){
  $scope.schematic = false;
});
