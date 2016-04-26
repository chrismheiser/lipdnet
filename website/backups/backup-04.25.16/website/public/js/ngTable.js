 var s = angular.module('ngTable', ['ngMaterial', 'ngColors','md.data.table']);

// CONTROLLER for populating and sorting schema table
s.controller('TableCtrl', function ($q, $scope, $timeout, $http) {
    // able to sort and search table by attributes
    $scope.content = [];
    $scope.def = {};
    $scope.query = {
      order: 'name',
    };
    $scope.onorderchange = function(order) {
      var deferred = $q.defer();
      $timeout(function () {
        deferred.resolve();
      }, 2000);
      return deferred.promise;
    };
    // Grab data from local files
    $http.get('def.json').success(function(data){
        $scope.def = data;
    });
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
                t.reference = curr;
                t.name = (item);
                $scope.content.push(t);
            }
        }
    });
});
