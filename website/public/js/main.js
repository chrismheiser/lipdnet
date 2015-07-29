var app = angular.module('gcr', []);

app.run(function($rootScope){
	$rootScope.name = "Chris Heiser";
});