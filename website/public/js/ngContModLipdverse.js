angular.module('ngValidate').controller('ModalCtrlLipdverse', function ($scope, $uibModalInstance, data) {
    $scope.data = data;
    $scope.info = {"name": "", "email": "", "new": true, "notes":"", "updateMsg": "This is a new file."};
    $scope.errors = [];
    $scope.upload = function () {
        $scope.errors = [];

        if(!$scope.info.name){
            $scope.errors.push("Name is required");
        }
        if(!$scope.info.email){
            $scope.errors.push("E-mail is required");
        }
        if(!$scope.info.new && !$scope.info.notes){
            $scope.errors.push("Notes are required");
        }
        if($scope.errors.length === 0) {
            if(!$scope.info.new){
                $scope.info.updateMsg = "This is an update to an existing file.";
            }
            $uibModalInstance.close($scope.info);
        }
    };
    $scope.close = function () {
        $uibModalInstance.dismiss('cancel');
    };
});
