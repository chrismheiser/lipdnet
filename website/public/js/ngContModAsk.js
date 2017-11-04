angular.module('ngValidate').controller('ModalCtrlAsk', function ($scope, $uibModalInstance, data) {
  $scope.data = data;
  $scope.yes = function () {
    $uibModalInstance.close(true);
  };
  $scope.no = function () {
    $uibModalInstance.close(false);
  };
  $scope.close = function () {
    $uibModalInstance.dismiss('cancel');
  };
});
