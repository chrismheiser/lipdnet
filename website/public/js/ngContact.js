var c = angular.module('ngContact', ['ngMaterial', 'ngAnimate', 'ngColors']);


c.controller('ContactCtrl', ['$scope', '$http', function($scope, $http){

  $scope.sent = 'false';
  $scope.sendMail = function(m){
    $scope.sent = 'true'
    // $http.post('/', m).success(
    //   $scope.sent = true
    // );
  };

}]);
