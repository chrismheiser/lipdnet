 var s = angular.module('myApp.schema', []);

// schema table
s.controller('SortCtrl', function ($scope, $http) {
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
