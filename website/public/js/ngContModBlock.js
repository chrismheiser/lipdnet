angular.module('ngValidate').controller('ModalCtrlBlock', function ($scope, $uibModalInstance, data) {
  $scope.customField = "";
  $scope.custom = [];
  $scope.required = [];
  $scope.standard = [];
  $scope.optional = [];
  $scope.initial = [];
  $scope.new = data.new;
  $scope.block = data.data;
  $scope.field = data.field;

  // Each field will have their own requirements. Set the requirements accordingly.
  if(data.field === "physicalSample"){
    $scope.optional = ["collectionMethod", "housedat", "name"];
  } else if (data.field === "calibration"){
    $scope.optional = ["equation", "uncertaintyType"];
  } else if (data.field === "hasResolution"){
    $scope.optional = ["hasMedianValue", "hasMeanValue", "hasMaxValue", "hasMinValue"];
  } else {
    // fields unknown. Need custom input field.
  }

  // Make sure the required and standard fields are
  if($scope.new){
    for (var _a = 0; _a < $scope.initial.length; _a++){
      var _key = $scope.initial[_a];
      if(!$scope.block.hasOwnProperty(_key)){
        $scope.block[_key] = "";
      }
    }
  }

  $scope.toggle = function (key) {
    console.log(key);
    if (key === null){
      console.log("adding custom", $scope.customField);
      $scope.custom.push($scope.customField);
      $scope.block[$scope.customField] = "";
      $scope.customField = "";
    } else {
      if ($scope.block.hasOwnProperty(key)) {
        delete $scope.block[key];
      }
      else {
        $scope.block[key] = "";
      }
    }
  };

  $scope.exists = function(key){
    if ($scope.block.hasOwnProperty(key)) {
      return true;
    }
  };

  $scope.close = function () {
    $uibModalInstance.close($scope.block);
  };

  $scope.dismiss = function() {
    $uibModalInstance.close("cancel");
  };

  $scope.delete = function(){
    $uibModalInstance.close("delete")
  }
});