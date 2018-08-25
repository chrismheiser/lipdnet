angular.module('ngValidate').controller('ModalCtrlJson', function ($scope, $uibModalInstance, data) {
    $scope.jsondata = data.data;
    $scope.options = data.options;
    $scope.error = false;
    $scope.reverted = false;
    $scope.cache = data.data;

    // Cached entry is the only thing that matters for options in this modal.
    // Cached entry is only available if this isn't an initial file upload. (ie. not advancedJsonEdit())
    // options = {errorTitle, errorMessage, cached, initialUpload}

    $scope.revert = function(){
        $scope.jsondata = $scope.cache;
        $scope.reverted = true;
        $scope.error = false;
    };

    $scope.save = function () {
        $scope.reverted = false;
        if($scope.jsondata){
            try{
                // If our parse attempt works, then we know the data is fixed and we can continue saving changes
                var _test = JSON.parse($scope.jsondata);
                $uibModalInstance.close($scope.jsondata);
            }catch(err){
                // If an error pops up from JSON parse,
                // replace the error shown in pre tag and keep waiting for valid json
                $scope.error = true;
            }
        } else {
            // If they try to save without having any data in the textarea at all
            $scope.error = "No JSON-LD data provided"
        }
    };
    $scope.quit = function () {
        // They quit without saving any changes. Show a toaster error so they know how that will affect their workflow
        $uibModalInstance.close(null);
    };
});
