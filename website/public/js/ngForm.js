var form = angular.module('myApp.form', ['ui.router', 'ngAnimate']);


form.config(function($stateProvider, $urlRouterProvider){

    $stateProvider

        .state('form', {
            url: '/form',
            templateUrl: 'views/form.html',
            controller: 'FormCtrl'
        })
        .state('form.upload', {
            url: '/upload',
            templateUrl: 'views/form-upload.html'
        })
        .state('form.content', {
            url: '/content',
            templateUrl: 'views/form-content.html'
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

        $urlRouterProvider.otherwise('/form/upload');
});

form.controller('FormCtrl', function($scope){
    $scope.formData = {};
    $scope.userData = {};
    $scope.processForm = function(){
        alert('Sent to Server');
    };
    $scope.showContent = function($fileContent){
        $scope.formData = $fileContent;
    };
});
