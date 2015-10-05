var t = angular.module('upload', ['ngFileUpload']);

t.controller('ctrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.uploadFiles = function(file) {
        console.log(file);
        if (file && !file.$error) {
            $scope.filename = file.name;
            $scope.file = {url: '/test', file: file};
            // file.upload = Upload.upload($scope.file);
            // file.upload.then(function (response) {
            //     $timeout(function () {
            //         file.result = response.data;
            //     });
            // }, function (response) {
            //     if (response.status > 0)
            //         $scope.errorMsg = response.status + ': ' + response.data;
            // });
            // file.upload.progress(function (evt) {
            //     file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            // });
            // file.upload.success(function(response){
            //     $scope.file = response.data;
            // });
        }
    }
}]);
