var t = angular.module('upload', ['ngFileUpload']);

t.controller('ctrl', ['$scope', 'Upload', '$timeout', '$q', '$http', function ($scope, Upload, $timeout, $q, $http) {
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

    // $scope.submit = function() {
    // if ($scope.file.$valid && $scope.file && !$scope.file.$error) {
    //   $scope.upload($scope.file);
    //   }
    // };

    $scope.upload = function (file) {
      Upload.upload({
          url: '/test',
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
