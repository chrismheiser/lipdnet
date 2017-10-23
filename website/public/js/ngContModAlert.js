angular.module('ngValidate').controller('ModalCtrlAlert', function ($scope, $uibModalInstance, data) {
  $scope.data = data;
  $scope.close = function () {
    $uibModalInstance.dismiss('cancel');
  };
});
