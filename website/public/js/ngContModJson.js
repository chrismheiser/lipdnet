angular.module('ngValidate').controller('ModalCtrlJson', function ($scope, $uibModalInstance, data) {
    $scope.jsondata = data.data;
    // $scope.error = data.error.message;
    $scope.error = false;
    $scope.save = function () {
        if($scope.jsondata){
            try{
                // If our parse attempt works, then we know the data is fixed.
                var _test = JSON.parse($scope.jsondata);
                $uibModalInstance.close($scope.jsondata);
            }catch(err){
                // If an error pops up, replace the error shown to the user and keep waiting for valid json
                $scope.error = true;
            }
        } else {
            $scope.error = "No JSON-LD data provided"
        }
    };
    $scope.quit = function () {
        $uibModalInstance.close(null);
    };
});
