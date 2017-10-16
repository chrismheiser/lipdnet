angular.module('ngValidate').controller('ModalCtrlInterp', function ($scope, $uibModalInstance) {
  $scope.required = ["variable", "direction", "scope"];
  $scope.standard = ["variableDetail", "seasonality", "rank"];
  $scope.optional = ["basis", "coefficient", "equilibriumEvidence", "fraction", "inferredMaterial",
    "integrationTime", "integrationTimeBasis", "integrationTimeUncertainty",
    "integrationTimeUnits", "mathematicalRelation", "integrationTimeUncertaintyType"];
  $scope.selected = ["variable", "direction", "scope", "variableDetail", "seasonality", "rank"];

  $scope.toggle = function (key) {
    var idx = $scope.selected.indexOf(key);
    if (idx > -1) {
      $scope.selected.splice(idx, 1);
    }
    else {
      $scope.selected.push(key);
    }
  };

  $scope.exists = function(key){
    if ( $scope.selected.indexOf(key) > -1) {
      return true;
    }
  };

  $scope.close = function () {
    var _interp = {};
    for(var _t = 0; _t<$scope.selected.length; _t++){
      _interp[$scope.selected[_t]] = "";
    }
    $uibModalInstance.close(_interp);
  };

  $scope.dismiss = function() {
    $uibModalInstance.close("cancel");
  };
});