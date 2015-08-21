var myapp = angular.module('myApp', ['myApp.form']);

// SERVICES (factory)

// CONTROLLERS

// schema table
myapp.controller('SortCtrl', function ($scope, $http) {
    // able to sort and search table by attributes
    $scope.sortType = 'name';
    $scope.sortReverse = false;
    $scope.searchSchema = '';
    $scope.schema = [];
    // grab all the schema data from the local file
    $http.get('context.lipd').success(function(data){
        for(var item in data['@context']){
            var t={};
            if (typeof data['@context'][item]==='object'){
                t['link'] = (data['@context'][item]['@id']);
            }
            else{
                t['link'] = (data['@context'][item]);
            }
            t['name'] = (item);
            $scope.schema.push(t);
        };
    });
});

// text file upload/display
myapp.controller('MainCtrl', function ($scope) {
    $scope.showContent = function($fileContent){
        $scope.content = $fileContent;
    };
});

// DIRECTIVES

// text file upload/display
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
