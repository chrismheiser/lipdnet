var b = angular.module('ngDB', ['angularMoment']);

b.controller('dbCtrl', ['$scope', '$timeout', '$q', '$http', function ($scope, $timeout, $q, $http) {
  $scope.paths;
  $scope.isDisabled = false;
  $scope.getPaths = loadAll();
  $scope.querySearch = querySearch;
  $scope.selectedItemChange = selectedItemChange;
  $scope.searchTextChange   = searchTextChange;

  function searchTextChange(text) {
    // $log.info('Text changed to ' + text);
  }
  function selectedItemChange(item) {
    // $log.info('Item changed to ' + JSON.stringify(item));
  }

  function querySearch (query) {
    var results = query ? $scope.paths.filter( createFilterFor(query) ) : $scope.paths,
        deferred;
    return results;
  }
  function loadAll() {
    $scope.paths = pull_paths();
  }

  function createFilterFor(query) {
    var lowercaseQuery = angular.lowercase(query);
    return function filterFn(item) {
      return (item.value.indexOf(lowercaseQuery) === 0);
    };
  }

  function pull_paths(){
    $http.get('/upload/paths')
      .success(function(data) {
          $scope.paths = data;
          console.log(data);
    })
      .error(function(data) {
          console.log('Error: ' + data);
    });
  };

}]);
