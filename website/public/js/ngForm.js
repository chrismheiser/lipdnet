var form = angular.module('myApp.form', ['ui.router', 'ngAnimate']);


form.config(function($stateProvider, $urlRouterProvider){

    $stateProvider

        .state('form', {
            url: '/form',
            templateUrl: 'views/form.html',
            controller: 'FormCtrl',
        })
        .state('form.upload', {
            url: '/upload',
            templateUrl: 'views/form-upload.html',
        })
        .state('form.contents', {
            url: '/contents',
            templateUrl: 'views/form-contents.html'
        })
        .state('form.success', {
            url: '/success',
            templateUrl: 'views/form-success.html'
        });

        $urlRouterProvider.otherwise('/form/upload');
});

form.controller('FormCtrl', function($scope){
    $scope.formData = {};
    $scope.processForm = function(){
        alert('alert!');
    };
    $scope.showContent = function($fileContent){
        $scope.formData = $fileContent;
    };
});
