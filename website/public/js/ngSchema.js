 var s = angular.module('ngSchema', ['ui.bootstrap']);

// CONTROLLER for populating and sorting schema table
s.controller('SortCtrl', function ($scope, $http) {
    // able to sort and search table by attributes
    $scope.sortType = 'name';
    $scope.sortReverse = false;
    $scope.toggleSearch = false;
    $scope.searchSchema = '';
    $scope.schema = [];
    $scope.def = {};
    $scope.custom = {name: 'bold', description:'grey',last_modified: 'grey'};
    $scope.sortable = ['name', 'description', 'last_modified'];
    $scope.thumbs = 'thumb';
    $scope.count = 3;

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
                t.link = curr;
                t.name = (item);
                $scope.schema.push(t);
            }
        }
    });
});


// DIRECTIVE for slideable element
// s.directive('slideable', function () {
//     return {
//         restrict:'C',
//         compile: function (element, attr) {
//             // wrap tag
//             var contents = element.html();
//             element.html('<div class="slideable_content" style="margin:0 !important; padding:0 !important" >' + contents + '</div>');
//
//             return function postLink(scope, element, attrs) {
//                 // default properties
//                 attrs.duration = (!attrs.duration) ? '500ms' : attrs.duration;
//                 attrs.easing = (!attrs.easing) ? 'ease-in-out' : attrs.easing;
//                 element.css({
//                     'overflow': 'hidden',
//                     'height': '0px',
//                     'transitionProperty': 'height',
//                     'transitionDuration': attrs.duration,
//                     'transitionTimingFunction': attrs.easing
//                 });
//             };
//         }
//     };
// });

// DIRECTIVE for slidetoggle
// s.directive('slideToggle', function() {
//     return {
//         restrict: 'A',
//         link: function(scope, element, attrs) {
//             var target, content;
//
//             attrs.expanded = false;
//
//             element.bind('click', function() {
//                 if (!target) target = document.querySelector(attrs.slideToggle);
//                 if (!content) content = target.querySelector('.slideable_content');
//
//                 if(!attrs.expanded) {
//                     content.style.border = '1px solid rgba(0,0,0,0)';
//                     var y = content.clientHeight;
//                     content.style.border = 0;
//                     target.style.height = y + 'px';
//                 } else {
//                     target.style.height = '0px';
//                 }
//                 attrs.expanded = !attrs.expanded;
//             });
//         }
//     }
// });

s.directive('mdTable', function () {
  return {
    restrict: 'E',
    scope: {
      headers: '=',
      content: '=',
      sortable: '=',
      filters: '=',
      customClass: '=customClass',
      thumbs:'=',
      count: '='
    },
    controller: function ($scope,$filter,$window) {
      var orderBy = $filter('orderBy');
      $scope.tablePage = 0;
      $scope.nbOfPages = function () {
        return Math.ceil($scope.content.length / $scope.count);
      },
      	$scope.handleSort = function (field) {
          if ($scope.sortable.indexOf(field) > -1) { return true; } else { return false; }
      };
      $scope.order = function(predicate, reverse) {
          $scope.content = orderBy($scope.content, predicate, reverse);
          $scope.predicate = predicate;
      };
      $scope.order($scope.sortable[0],false);
      $scope.getNumber = function (num) {
      			    return new Array(num);
      };
      $scope.goToPage = function (page) {
        $scope.tablePage = page;
      };
    },
    template: angular.element(document.querySelector('#md-table-template')).html()
  }
});

s.directive('mdColresize', function ($timeout) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      scope.$evalAsync(function () {
        $timeout(function(){ $(element).colResizable({
          liveDrag: true,
          fixed: true
        });},100);
      });
    }
  }
});
