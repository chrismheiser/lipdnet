var t = angular.module('ngFile', ['ngFileUpload']);

t.controller('FileCtrl', ['$scope', 'Upload', '$timeout', '$q', '$http', function ($scope, Upload, $timeout, $q, $http) {
    $scope.obj = 'none';
    $scope.content = {};
    $scope.pull = function(){
      var np = $scope.obj.filename;
      console.log('PULL PATH: ' + np )
      $http.get(np).success(function(data){
          $scope.content = data;
          console.log(data);
      });
    };

    $scope.upload = function (file) {
      Upload.upload({
          url: '/upload',
          data: {file: file}
      }).then(function (resp) {
          console.log('Success ' + resp.config.data.file.name + ' uploaded. Response: ' + resp.data);
          console.log(resp.data);
          $scope.obj = resp.data;
      }, function (resp) {
          console.log('Error status: ' + resp.status);
      }, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          // console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      });
    };

}]);
