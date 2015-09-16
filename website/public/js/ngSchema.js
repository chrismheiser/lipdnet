 var s = angular.module('schemaApp', ['ui.bootstrap']);

// CONTROLLER for populating and sorting schema table
s.controller('SortCtrl', function ($scope, $http) {
    // able to sort and search table by attributes
    $scope.sortType = 'name';
    $scope.sortReverse = false;
    $scope.searchSchema = '';
    $scope.schema = [];
    $scope.def = {};

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
s.directive('slideable', function () {
    return {
        restrict:'C',
        compile: function (element, attr) {
            // wrap tag
            var contents = element.html();
            element.html('<div class="slideable_content" style="margin:0 !important; padding:0 !important" >' + contents + '</div>');

            return function postLink(scope, element, attrs) {
                // default properties
                attrs.duration = (!attrs.duration) ? '500ms' : attrs.duration;
                attrs.easing = (!attrs.easing) ? 'ease-in-out' : attrs.easing;
                element.css({
                    'overflow': 'hidden',
                    'height': '0px',
                    'transitionProperty': 'height',
                    'transitionDuration': attrs.duration,
                    'transitionTimingFunction': attrs.easing
                });
            };
        }
    };
});

// DIRECTIVE for slidetoggle
s.directive('slideToggle', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var target, content;

            attrs.expanded = false;

            element.bind('click', function() {
                if (!target) target = document.querySelector(attrs.slideToggle);
                if (!content) content = target.querySelector('.slideable_content');

                if(!attrs.expanded) {
                    content.style.border = '1px solid rgba(0,0,0,0)';
                    var y = content.clientHeight;
                    content.style.border = 0;
                    target.style.height = y + 'px';
                } else {
                    target.style.height = '0px';
                }
                attrs.expanded = !attrs.expanded;
            });
        }
    }
});
