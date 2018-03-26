angular.module('ngValidate').controller('ModalCtrlBlock', function ($scope, $uibModalInstance, data) {
  $scope.customField = "";
  $scope.editMode = false;
  $scope.custom = [];
  $scope.required = [];
  $scope.standard = [];
  $scope.optional = [];
  $scope.initial = [];
  $scope.create = data.create;
  $scope.entry = data.data;
  $scope.idx = data.idx;
  $scope.key = data.key;
  $scope.arr = [];

  if($scope.idx !== null){
    // For array data, we need to turn the entry into the specific index entry that is being created or edited. Not the full array.
    $scope.arr = $scope.entry;
    $scope.entry = $scope.arr[$scope.idx];
  }

  // Each key will have their own requirements. Set the requirements accordingly.
  if(data.key === "physicalSample"){
    $scope.optional = ["collectionMethod", "housedat", "name"];
  } else if (data.key === "calibration"){
    $scope.optional = ["equation", "uncertaintyType"];
  } else if (data.key === "hasResolution"){
    $scope.optional = ["hasMedianValue", "hasMeanValue", "hasMaxValue", "hasMinValue"];
  } else if (data.key === "interpretation") {
    $scope.required = ["variable", "direction", "scope"];
    $scope.standard = ["variableDetail", "seasonality", "rank"];
    $scope.optional = ["basis", "coefficient", "equilibriumEvidence", "fraction", "inferredMaterial",
      "integrationTime", "integrationTimeBasis", "integrationTimeUncertainty",
      "integrationTimeUnits", "mathematicalRelation", "integrationTimeUncertaintyType"];
    $scope.selected = ["variable", "direction", "scope", "variableDetail", "seasonality", "rank"];
    $scope.initial = ["variable", "direction", "scope", "variableDetail", "seasonality", "rank"];
  } else {
    // fields unknown. Need custom input key.
  }

  // Make sure the required and standard fields are
  if($scope.create){
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

  $scope.rmField = function(entry, key){
    if(entry.hasOwnProperty(key)){
      delete entry[key];
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
    if ($scope.idx !== null){
      // For array data, we want to return the whole array, and not just the single entry we were editing
      $uibModalInstance.close($scope.arr);
    } else {
      // For object data, we can return the entry as-is
      $uibModalInstance.close($scope.entry);
    }
  };

  $scope.dismiss = function() {
    $uibModalInstance.close("cancel");
  };

  $scope.delete = function(){
    $uibModalInstance.close("delete")
  }
});