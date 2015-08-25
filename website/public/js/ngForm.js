var f = angular.module('myApp.form', ['ui.router', 'ngAnimate', 'formly', 'formlyBootstrap']);


f.config(function($stateProvider, $urlRouterProvider){

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

f.factory('formData', function(){
    var allData = {};
    var _geo = '';
    var _user = '';

    service.setGeo = function(allData){

    }

    service.getGeo = function(){

    }

    service.setUser = function(allData){

    }

    service.setData = function(allData){

    }

    return allData;
});

f.controller('FormCtrl', function($scope, formData){
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

    var fm = this;
    fm.initial = {};
    fm.initialFields = [
        {
            key: 'exist',
            type: 'radio',
            templateOptions: {
                type: 'radio',
                label: 'Upload existing file?',
                options: ['Yes', 'No']
                required: true
            }
        },
        {
            key: 'filetype',
            type: 'select',
            templateOptions: {
                label: 'What type of file do you have?',
                placeholder: 'Excel',
                required: true,
                options: ['Excel', 'NOAA', 'CSV with headers', 'CSV without headers']
            },
            hideExpression: '!model.exist'
        }
    ];
});
