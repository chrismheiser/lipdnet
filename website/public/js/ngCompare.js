var c = angular.module('ngCompare', ['ds.objectDiff']);

c.controller('CompareCtrl', ['$scope', 'ObjectDiff', function($scope, ObjectDiff){
    $scope.file1 = {"filename": "", "json": {}};
    $scope.file2 = {"filename": "", "json": {}};
    $scope.uploadCount = 0;

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

        console.log(diff);
        // Pretty print for JSON + diffs
        $scope.diffValue = ObjectDiff.toJsonView(diff);

        // Pretty print for diffs only
        $scope.diffValueChanges = ObjectDiff.toJsonDiffView(diff);
      }
    };

    $scope.$on('newUpload', function(event, data){
      console.log("Received newUpload event.");
      console.log(data);
      $scope.syncNewUpload(data);
    });
}]);
