var myapp = angular.module('myApp', ['myApp.form']);

// SERVICES

// CONTROLLERS

// schema table controller
myapp.controller('SortCtrl', function ($scope, $http) {
    // able to sort and search table by attributes
    $scope.sortType = 'name';
    $scope.sortReverse = false;
    $scope.searchSchema = '';
    $scope.schema = [];
    // grab all the schema data from the local file
    $http.get('schema_l.json').success(function(data){
        $scope.schema = data;
    });
});

// text file upload/display controller
myapp.controller('MainCtrl', function ($scope) {
    $scope.showContent = function($fileContent){
        $scope.content = $fileContent;
    };
});

// DIRECTIVES

// Upload any text-type file and parse out data
myapp.directive('onReadFile', function ($parse) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
            var fn = $parse(attrs.onReadFile);

			element.on('change', function(onChangeEvent) {
				var reader = new FileReader();

				reader.onload = function(onLoadEvent) {
					scope.$apply(function() {
						fn(scope, {$fileContent:onLoadEvent.target.result});
					});
				};

				reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
			});
		}
	};
});
