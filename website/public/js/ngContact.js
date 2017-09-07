var c = angular.module('ngContact', ['ngMaterial', 'ngAnimate', 'ngColors']);


c.controller('ContactCtrl', ['$scope', '$http', "$window", function($scope, $http, $window){

  $scope.fmsnt = false;
  $scope.complete = false;
  $scope.fm = {"fn": "", "fo": "", "fs": "", "fmm": "", "fe": ""};


  $scope.checkForm = function(){
  	$scope.countFields(function(_ct){
      if(_ct === 5){
        $scope.complete = true;
      }
		});
  };

  $scope.countFields = function(cb){
    var _ct = 0;
    // check if the keys are empty or filled.
    for (var key in $scope.fm){
      if ($scope.fm.hasOwnProperty(key)){
        var i = $scope.fm[key];
        if (i && i !== " " && i !== "" && i !== undefined && typeof(i) !== "undefined"){
        	$scope.checkInput(key, i, function(clean){
        		if(clean){
        			_ct++;
						}
					});
        }
      }
    }
    cb(_ct);
	};

  $scope.checkInput = function(key, t, cb){

  	var _re_field =/[^a-z]/i;
  	var _re_email = /^(([^<>()\\[\\]\\.,;:\\s@\\\"]+(\\.[^<>()\\[\\]\\.,;:\\s@\\\"]+)*)|(\\\".+\\\"))@(([^<>()[\\]\\.,;:\\s@\\\"]+\\.)+[^<>()[\\]\\.,;:\\s@\\\"]{2,})$/i;
  	var _clean = true;
  	if(key === "fe"){
  		if(!(!_re_email.test(t))){
  			_clean = false;
  			$scope.complete = false;
			}
		} else {
      if (!(!_re_field.test(t))){
        _clean = false;
        $scope.complete = false;
      }
		}

  	cb(_clean);
  };

  $scope.sendMail = function(){
    $scope.sent = true;
    $http.post('/', $scope.fm).success(
      $scope.sent = true
    );
  };

}]);
