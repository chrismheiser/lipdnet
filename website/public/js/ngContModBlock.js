angular.module('ngValidate').controller('ModalCtrlBlock', function ($scope, $rootScope, $uibModalInstance, data, $http) {
  $scope.customField = "";
  $scope.editMode = false;
  $scope.custom = [];
  $scope.required = [];
  $scope.standard = [];
  $scope.optional = [];
  $scope.initial = [];
  $scope.column = data.column; // the full column data
  $scope.create = data.create; // bool, creating new entry or modifying existing.
  $scope.entry = data.data; // data 
  $scope.idx = data.idx; // index of entry, if working on an array item. 
  $scope.key = data.key; // field key
  $scope.custom = true;  // bool, allow user to enter custom fields (or not)
  $scope.arr = [];
  $scope.scope = ["isotope", "chronology", "climate", "ecology"];
  $scope.inCompilation = ["compilationName", "compilationVersion"];
  $scope.standardizedKeys = {};

  var getStandardizedValues = (function(atl){
    $http.get("/api/standardizedValues")
      .then(function (response) {
        // We got a successful API response.
        $scope.standardizedKeys = response.data.standardized_keys;
        console.log($scope.standardizedKeys)
      }, function(response) {
        console.log("/api/archiveTypes response error");
      });
  })();

    // If we receive an index number from parent controller, then we need to work on that specific index entry only. 
    if($scope.idx !== null){
    // For array data, we need to turn the entry into the specific index entry that is being created or edited. Not the full array.
    $scope.arr = $scope.entry;
    $scope.entry = $scope.arr[$scope.idx];
    }

  // Each key will have their own field requirements. Set the requirements accordingly. 
  if(data.key === "physicalSample"){
    $scope.optional = ["collectionMethod", "housedat", "name"];
  } else if (data.key === "calibration"){
    $scope.optional = ["equation", "uncertaintyType"];
  } else if (data.key === "hasResolution"){
    $scope.standard = ["hasMedianValue", "hasMeanValue", "hasMaxValue", "hasMinValue"];
    $scope.selected = ["hasMedianValue", "hasMeanValue", "hasMaxValue", "hasMinValue"];
    $scope.initial = ["hasMedianValue", "hasMeanValue", "hasMaxValue", "hasMinValue"];

  } else if (data.key === "interpretation") {
    $scope.required = ["variable", "variableDetail", "direction", "scope"];
    $scope.standard = ["seasonality", "rank"];
    $scope.optional = ["basis", "coefficient", "equilibriumEvidence", "fraction", "inferredMaterial",
      "integrationTime", "integrationTimeBasis", "integrationTimeUncertainty",
      "integrationTimeUnits", "mathematicalRelation", "integrationTimeUncertaintyType"];
    $scope.selected = ["variable",  "variableDetail", "direction", "scope"];
    $scope.initial = ["variable",  "variableDetail", "direction", "scope"];
  } else if (data.key === "inCompilationBeta"){
    $scope.required = ["compilationName", "compilationVersion"];
    $scope.custom = false; // don't allow any custom fields. disable custom. 
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

  //Send event to call predictNextValue in the ValidateCtrl sibling controller.
  $scope.call_predictNextValueParent = function(key, column) {
    $rootScope.$emit("call_predictNextValue", {"key": key, "column": column});
  }

  // Add a new entry to the given array
  $scope.addObjtoArr = function(arr){
    var newObj = {};
    if($scope.key === "inCompilationBeta"){
      for(var name in $scope.inCompilation){
        newObj[name] = "";
      }
      $scope.entry.push(newObj);
    } else {
      // Pass. Save for future use.
    }
  };

  // Open the edit mode, allowing the user to remove existing data entries.
  $scope.edit = function(){
    // Toggle edit mode on click. 
    $scope.editMode = !$scope.editMode;
  };

  // Remove an existing key-value data entry. Only possible during editMode
  $scope.rmField = function(entry, key){
    // If the key exists in the data entry, then delete it. 
    if(entry.hasOwnProperty(key)){
      delete entry[key];
    }
  };

  // Remove the specified element from the given array. 
  $scope.rmObject = function(arr, idx){
    arr.splice(idx, 1);
  };


  $scope.toggle = function (key) {
    // If the key is null, then user is adding a custom field entry. 
    if (key === null){
      // Add custom entry to our custom array, to create a checkbox for it
      $scope.custom.push($scope.customField);
      // Add the custom key to our current data, with a blank value
      $scope.entry[$scope.customField] = "";
      // Reset the custom field input, so user can enter more custom fields as needed
      $scope.customField = "";
    } else {
      // If the key already exists in our data, then we remove it
      if ($scope.entry.hasOwnProperty(key)) {
        // Delete key from our data
        delete $scope.entry[key];
      }
      // Else, the key doesn't exist in our data, so we create it
      else {
        // Insert the new key in our data, with an empty value.
        $scope.entry[key] = "";
      }
    }
  };

  // Check if the target key exists in our data currently or not. Return Bool. 
  $scope.exists = function(key){
    if ($scope.entry.hasOwnProperty(key)) {
      return true;
    }
  };

  // Close the modal. Return the data back to the parent controller. 
  $scope.close = function () {
    if ($scope.idx !== null){
      // For array data, we want to return the whole array, and not just the single entry we were editing
      $uibModalInstance.close($scope.arr);
    } else {
      // For object data, we can return the entry as-is
      $uibModalInstance.close($scope.entry);
    }
  };

  // Modal is canceled, no changes are sent to parent controller, and no data saved. 
  $scope.dismiss = function() {
    $uibModalInstance.close("cancel");
  };

  // Delete this data entry. Send delete command to parent controller to fulfill deletion. 
  $scope.delete = function(){
    $uibModalInstance.close("delete")
  }
});