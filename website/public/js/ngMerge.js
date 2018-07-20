var c = angular.module('ngMerge', ['ds.objectDiff']);

c.controller('MergeCtrl', ['$scope', 'ObjectDiff', function($scope, ObjectDiff){
    $scope.file1 = {"filename": "", "json": {}};
    $scope.file2 = {"filename": "", "json": {}};
    $scope.uploadCount = 0;
    $scope.diffCount = 0;
    $scope.resolveTrigger = false;
    $scope.downloadTrigger = false;
    $scope.diffList = [];

    $scope.mergeAndDownload = function(){
      // Collect all the values
      var _json = $scope.file1.json;

      // Place data for each item in the diffList (where necessary)
      for(var _i=0; _i<$scope.diffList.length; _i++) {
        var _entry = $scope.diffList[_i];
        var _crumbs = _entry.crumbs;
        var _selectedIdx = _entry.models.indexOf(true);
        var _chosenData = _entry.options[_selectedIdx];

        // Was a selection made for this field? Only continue if true. (i.e. one of the models will be 'true')
        if (_selectedIdx !== -1) {
          // Is the chosen data a number entry? Switch the type
          var _floatFields = ["number", "coordinates", "issue", "volume", "year", "lipdVersion"];
          for(var _n=0; _n<_floatFields.length; _n++){
            if(_crumbs.indexOf(_floatFields[_n]) !== -1){
              _chosenData = parseFloat(_chosenData);
            }
          }
          // Get the data selection ABOVE our target placement. Reduce the string path into a usable json path.
          var _reduced = _crumbs.reduce(function (o, k) {
            if (typeof(o[k]) !== "object") {
              return o;
            }
            return o && o[k];
          }, _json);

          // Now that we have the final layer before our data placement, we can make the placement.
          if (!isNaN(parseInt(_crumbs[_crumbs.length - 1]))) {
            if(_selectedIdx === 2){
              // This is the "delete" option. Remove the entry from the array
              _reduced.splice(parseInt(_crumbs[_crumbs.length - 1]), 1);
            } else {
              _reduced[parseInt(_crumbs[_crumbs.length - 1])] = _chosenData;
            }
          } else {
            if(_selectedIdx === 2){
              // This is the "delete" option. Remove the entry from the object
              delete _reduced[_crumbs[_crumbs.length - 1]];
            } else {
              _reduced[_crumbs[_crumbs.length - 1]] = _chosenData;
            }
          }
        }
      }

      // Now, bubble the JSON up to the ValidateCtrl, and trigger the download function
      // All the changes should have been combined into $scope.file1.json
      $scope.$emit("mergedData", $scope.file1.json);

    };

    $scope.addRmValue = function(item, idx){
      // Set all models to false
      for(var _p=0; _p<item.models.length; _p++){
        item.models[_p] = false;
      }
      // Now set the chosen model to true
      item.models[idx] = true;

      // Check if all differences have been resolved
      $scope.isResolved();
    };

    $scope.isResolved = function(){
      // Check all the models in the diffList for resolution.
      // If one of the models (checkboxes) is true, then consider it resolved. If all fields are resolved, trigger.
      var _resolveCount = 0;

      // Check all the models for a true flag
      for(var _p=0; _p<$scope.diffList.length; _p++){
        if($scope.diffList[_p].models.indexOf(true) !== -1){
          _resolveCount++;
        }
      }
      // Do the amount of resolved fields match the amount of fields?
      if(_resolveCount === $scope.diffCount){
        $scope.resolveTrigger = true;
      }
    };

    $scope.downloadTriggered = function(){
      $scope.downloadTrigger = true;
    };

    $scope.syncNewUpload = function(data){
      $scope.uploadCount++;
      if(Object.keys($scope.file1.json).length === 0 && $scope.file1.json.constructor === Object){
        $scope.file1.filename = data.lipdFilename;
        $scope.file1.json = create.rmTmpEmptyData(data.json);
      } else {
        $scope.file2.filename = data.lipdFilename;
        $scope.file2.json = create.rmTmpEmptyData(data.json);
      }

      // Pretty print for JSON
      $scope.file1JsonView = ObjectDiff.objToJsonView($scope.file1.json);
      $scope.file2JsonView = ObjectDiff.objToJsonView($scope.file2.json);

      if($scope.uploadCount >= 2){
        // Calculate diffs
        var diff = ObjectDiff.diffOwnProperties($scope.file1.json, $scope.file2.json);
        var diffAll = ObjectDiff.diff($scope.file1.json, $scope.file2.json);

        // console.log(diff);
        // console.log(diffAll);
        // Pretty print for JSON + diffs
        $scope.diffValue = ObjectDiff.toJsonView(diff);

        // Pretty print for diffs only
        $scope.diffValueChanges = ObjectDiff.toJsonDiffView(diff);

        $scope.diffList = $scope.getChanges(diffAll.value, "", []);
        $scope.diffCount = $scope.diffList.length;
        // console.log($scope.diffList);
        // console.log($scope.diffCount);
      }
    };

    $scope.$on('newUpload', function(event, data){
      // console.log("Received newUpload event.");
      // console.log(data);
      $scope.syncNewUpload(data);
    });

    $scope.cleanCrumbs = function(crumbs){

      // Clean up the extra characters and make the crumbs string into a path we can use to place the chosen data
      var _split = crumbs.split(".");
      _split = _split.filter(function(a){if(a !== "." || a !== ""){return a;}});
      return _split;
    };

    $scope.clearChecks = function(item){

      // User checked the "delete" field, so turn off any other checkboxes and remove data from 'other'.

    };

    $scope.getChanges = function(data, crumbs, arr){

      for(var _key in data){
        if(data.hasOwnProperty(_key)){
          var _newkey = "";
          if(_key === 'value' || _key === "added"){
            _newkey = "";
          } else {
            _newkey = _key;
          }
          // Root case.
          if(_key === "added"){
            if(data.changed === "primitive change"){
              // console.log("PRIMITIVE CHANGE!");
              if(data.added.toString() !== data.removed.toString()){


                arr.push({
                  "selected": "",
                  "crumbs": $scope.cleanCrumbs(crumbs + "." + _newkey),
                  "options": [data.added, data.removed, ""],
                  "models": [false, false, false, false]
                });
              }
            }
          }

          if(Array.isArray(data[_key])){
            for(var _i=0; _i < data[_key].length; _i++){
                // console.log("Sending Arr Obj");
                // console.log(data[_key][_i]);
                arr = $scope.getChanges(data[_key][_i], crumbs + "." + _newkey +"." + _i, arr);
            }
          }
          else if(typeof(data[_key]) === "object"){
            // console.log("Sending object:");
            // console.log(data[_key].value);
            arr = $scope.getChanges(data[_key], crumbs + "." + _newkey, arr);
          }
        }
      }
      return arr;
    };

}]);
