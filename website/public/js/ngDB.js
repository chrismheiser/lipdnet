var b = angular.module('ngDB', ['angularMoment']);


// This controller is supposed to be the interface to the mongo database. Document insert and retrieval
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

  // attempt at loading one lipd file using the its corresponding path
  function querySearch (query) {
    var results = query ? $scope.paths.filter( createFilterFor(query) ) : $scope.paths,
        deferred;
    return results;
  }

  // attempt at loading all paths for each lipd file from the database ?
  function loadAll() {
    $scope.paths = pull_paths();
  }

  function createFilterFor(query) {
    var lowercaseQuery = angular.lowercase(query);
    return function filterFn(item) {
      return (item.value.indexOf(lowercaseQuery) === 0);
    };
  }

  // attempt at loading all paths for each lipd file from the database ?
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
