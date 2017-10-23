angular.module('ngValidate').controller('ModalCtrlFile', function ($scope, $uibModalInstance, data) {
  $scope.data = data;
  $scope.pretty = data.pretty;
  if ($scope.data.type === "jsonld" || $scope.data.type === "bagit"){
    $scope.pretty = $scope.pretty.replace(/\\n/g, '\n').replace(/"/g, "");
  }
  $scope.close = function () {
    $uibModalInstance.dismiss('cancel');
  };
});
