angular.module('ngValidate').controller('ModalCtrlJson', function ($scope, $uibModalInstance, data) {
    // Json data that is displayed in the modal.
    $scope.jsondata = data.data;
    // Modal button options. 'initialUpload' and 'title'
    $scope.options = data.options;
    // Bool to show or hide error banner inside the modal
    $scope.error = false;
    // Bool to revert back to the original json data
    $scope.reverted = false;
    // Cache of original json data
    $scope.cache = data.data;

    // Cached entry is the only thing that matters for options in this modal.
    // Cached entry is only available if this isn't an initial file upload. (ie. not advancedJsonEdit())
    // options = {errorTitle, errorMessage, cached, initialUpload}

    /**
     * Revert the changes made to the json data. Bring back the original, un-edited json data.
     *
     * @return  none
     */
    $scope.revert = function(){
        // Set the original 'cached' data as the json for editing.
        $scope.jsondata = $scope.cache;
        // Switch the revert flag, so we know data was reverted
        $scope.reverted = true;
        // Set error flag to false. (Assume there are no errors to start)
        $scope.error = false;
    };

    /**
     *  Save json data changes. Data is sent back to the ValidateCtrl and saved in the $scope data.
     *
     *  @return none    Json data is sent through callback to parent controller via the $uibModalInstance.close()
     */
    $scope.save = function () {
        //
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
            $scope.error = true;
        }
    };

    /**
     * Quit the modal window. Close it without making any changes.
     *
     * @return  none
     */
    $scope.quit = function () {
        // They quit without saving any changes. Show a toaster error so they know how that will affect their workflow
        $uibModalInstance.close(null);
    };
});
