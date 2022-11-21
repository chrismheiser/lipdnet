var c = angular.module('ngContact', ['ngMaterial', 'ngAnimate', 'ngColors']);


c.controller('ContactCtrl', ['$scope', '$http', "$window", function($scope, $http, $window){

  $scope.fmsnt = false;
  $scope.complete = false;
  // using generic vars to avoid spam bots sending messages on the form. 
  $scope.fm = {"fn": "", "fo": "", "fs": "", "fmm": "", "fe": ""};
  $scope.checkForm = function(){
  	// check if the keys are empty or filled. 
  	for (var key in $scope.fm){
  		if ($scope.fm.hasOwnProperty(key)){
  			var i = $scope.fm.key;
  			if (!i || i === " " || i === "" || i === undefined){
  				$scope.complete = false;
  				return;
  			}
  		}
  	}
  	$scope.complete = true;
  	return;
  };

  $scope.checkInput = function(t){
  	var trigger = false;
  	if (t === "fn"){
	  	if (!(!/[^a-z]/i.test($scope.fm.fn))){
	  		$scope.fm.fn = "";
	  		trigger = true;
	  	}
  	} else if (t === "fo"){
	  	if (!(!/[^a-z]/i.test($scope.fm.fo))){
	  		$scope.fm.fo = "";
	  		trigger = true;
	  	}
  	}
  	if(trigger){
  		$window.alert("Numbers and special characters not allowed in this field")
  		$scope.complete = false;
  	}
  	return;
  }

  $scope.sendMail = function(m){
    $scope.sent = true;
    // $http.post('/', m).success(
    //   $scope.sent = true
    // );
  };

}]);
