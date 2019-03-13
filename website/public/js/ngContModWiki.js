angular.module('ngValidate').controller('ModalCtrlWiki', function ($scope, $uibModalInstance, data) {
  $scope.data = data;
  $scope.login = function () {
      // Open a smaller popup window that shows the user login page for the LinkedEarth Wiki
      window.open('http://wiki.linked.earth/Special:UserLogin', '_blank', 'location=yes,height=600,width=800,scrollbars=yes,status=yes');
  };
  $scope.upload = function () {
    $uibModalInstance.close(true);
  };
  $scope.close = function () {
    $uibModalInstance.dismiss('cancel');
  };
});
