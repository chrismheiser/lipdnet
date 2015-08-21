var form = angular.module('myApp.form', ['ui.router', 'ngAnimate', 'formly', 'formlyBootstrap']);


form.config(function($stateProvider, $urlRouterProvider){

    $stateProvider

        .state('form', {
            url: '/form',
            templateUrl: 'views/form.html',
            controller: 'FormCtrl'
        })
        .state('form.start', {
            url:'/start',
            templateUrl: 'views/form-start.html'
        })
        .state('form.upload', {
            url: '/upload',
            templateUrl: 'views/form-upload.html'
        })
        .state('form.content', {
            url: '/content',
            templateUrl: 'views/form-content.html'
        })
        .state('form.location',{
            url: '/location',
            templateUrl: 'views/form-location.html'
        })
        .state('form.validate', {
            url: '/validate',
            templateUrl: 'views/form-validate.html'
        })
        .state('form.success', {
            url: '/success',
            templateUrl: 'views/form-success.html'
        })
        .state('form.thanks', {
            url: '/thanks',
            templateUrl: 'views/form-thanks.html'
        });

        $urlRouterProvider.otherwise('/form/start');
});

form.controller('FormCtrl', function($scope){
    $scope.formData = {};
    $scope.userData = {};
    $scope.geoData = {};
    $scope.processForm = function(){
        alert('Sent to Server');
    };
    $scope.showContent = function($fileContent){
        $scope.formData = $fileContent;
        $scope.geoData = formData.geo;
    };
});
