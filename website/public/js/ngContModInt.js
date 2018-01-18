angular.module('ngValidate').controller('ModalCtrlInterp', function ($scope, $uibModalInstance, data) {
  $scope.required = ["variable", "direction", "scope"];
  $scope.standard = ["variableDetail", "seasonality", "rank"];
  $scope.optional = ["basis", "coefficient", "equilibriumEvidence", "fraction", "inferredMaterial",
    "integrationTime", "integrationTimeBasis", "integrationTimeUncertainty",
    "integrationTimeUnits", "mathematicalRelation", "integrationTimeUncertaintyType"];
  $scope.selected = ["variable", "direction", "scope", "variableDetail", "seasonality", "rank"];
  $scope.initial = ["variable", "direction", "scope", "variableDetail", "seasonality", "rank"];
  $scope.interpArr = data.data;
  $scope.new = data.new;
  $scope.idxNum = data.idxNum;
  $scope.currInterp = $scope.interpArr[$scope.idxNum];


  // Make sure the required and standard fields are
  if($scope.new){
    for (var _a = 0; _a < $scope.initial.length; _a++){
      var _key = $scope.initial[_a];
      if(!$scope.currInterp.hasOwnProperty(_key)){
        $scope.currInterp[_key] = "";
      }
    }
  }

  $scope.toggle = function (key) {
    if ($scope.currInterp.hasOwnProperty(key)) {
      delete $scope.currInterp[key];
    }
    else {
      $scope.currInterp[key] = "";
    }
  };

  $scope.exists = function(key){
    if ($scope.currInterp.hasOwnProperty(key)) {
      return true;
    }
  };

  $scope.close = function () {
    $uibModalInstance.close($scope.interpArr);
  };

  $scope.dismiss = function() {
    $uibModalInstance.close("cancel");
  };

  $scope.delete = function(){
    $uibModalInstance.close("delete")
  }
});