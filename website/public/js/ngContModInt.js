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
  $scope.entry = $scope.interpArr[$scope.idxNum];


  // Make sure the required and standard fields are
  if($scope.new){
    for (var _a = 0; _a < $scope.initial.length; _a++){
      var _key = $scope.initial[_a];
      if(!$scope.entry.hasOwnProperty(_key)){
        $scope.entry[_key] = "";
      }
    }
  }

  $scope.edit = function(){
    $scope.editMode = !$scope.editMode;
  };

  $scope.rmField = function(entry, field){
    if(entry.hasOwnProperty(field)){
      delete entry[field];
    }
  };

  $scope.toggle = function (key) {
    if (key === null){
      $scope.custom.push($scope.customField);
      $scope.entry[$scope.customField] = "";
      $scope.customField = "";
    } else {
      if ($scope.entry.hasOwnProperty(key)) {
        delete $scope.entry[key];
      }
      else {
        $scope.entry[key] = "";
      }
    }
  };

  $scope.exists = function(key){
    if ($scope.entry.hasOwnProperty(key)) {
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