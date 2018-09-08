angular.module('ngValidate').controller('ModalCtrlFile', function ($scope, $uibModalInstance, data) {
  $scope.data = data;
  console.log("modal data");
  console.log($scope.data);
  $scope.pretty = JSON.stringify(data.data, null, 2);
  if ($scope.data.type === "jsonld" || $scope.data.type === "bagit" || $scope.data.type === "json"){
    $scope.pretty = $scope.pretty.replace(/\\n/g, '\n').replace(/"/g, "");
  }
  $scope.close = function () {
    $uibModalInstance.dismiss('cancel');
  };
});
