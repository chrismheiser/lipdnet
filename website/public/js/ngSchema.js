 var s = angular.module('myApp.schema', ['ui.bootstrap']);

// schema table
s.controller('SortCtrl', function ($scope, $http) {
    // able to sort and search table by attributes
    $scope.sortType = 'name';
    $scope.sortReverse = false;
    $scope.searchSchema = '';
    $scope.schema = [];
    // grab all the schema data from the local file
    $http.get('context.lipd').success(function(data){
        var o = [];
        var links = ['xsd', 'schema', 'purl', 'csvw', 'lipd', 'doi', 'geojson', 'dataDOI', 'id', 'type'];
        for (var item in data['@context']) {
            var t = {};
            var curr = '';
            // if the current item is not in the listed links array, then use it.
            if (links.indexOf(item) == -1) {
                if (typeof data['@context'][item] === 'object') {
                    curr = (data['@context'][item]['@id']);
                } else {
                    curr = (data['@context'][item]);
                }
                if (curr.indexOf(':') > -1  && curr.indexOf('http') == -1) {
                    var spl = curr.split(':');
                    curr = data['@context'][spl[0]] + spl[1];
                }
                t.link = curr;
                t.name = (item);
                $scope.schema.push(t);
            }
        }
    });
});
