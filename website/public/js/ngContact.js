var c = angular.module('ngContact', ['ngMaterial', 'ngAnimate', 'ngColors']);


c.controller('ContactCtrl', ['$scope', '$http', function($scope, $http){

  $scope.sendMail = function(m){
    $http.post('/', m).success(console.log('sendMail POST'));
  };

}]);
