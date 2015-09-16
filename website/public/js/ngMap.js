// Controls all Google Maps Objects
var m = angular.module('mapApp', ['uiGmapgoogle-maps']);

m.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyB8nllB0zwraQo5qJMGdtcxulsTPJOnd8U',
        v: '3.20',
        libraries: 'weather,geometry,visualization'
    });
});

m.controller('MapCtrl', function($scope, $log, $timeout) {
    $scope.map = {
        center: {
            longitude: -111.652889,
            latitude: 35.190833
        },
        zoom: 1
    };
    $scope.options = {
        scrollwheel: false
    };
    $scope.coordsUpdates = 0;
    $scope.dynamicMoveCtr = 0;
    $scope.markers = [{
        idKey: 0,
        coords: {
            longitude: 0,
            latitude: 0
        },
        options: {
            draggable: true
        },
        icon: "",
        events: {
            dragend: function(markers, eventName, args) {
                $log.log('marker dragend');
                var lat = markers.getPosition().lat();
                var lon = markers.getPosition().lng();
                $log.log(lat);
                $log.log(lon);

                $scope.marker.options = {
                    draggable: true,
                    labelContent: "lat: " + $scope.markers.coords.latitude + ' ' + 'lon: ' + $scope.markers.coords.longitude,
                    labelAnchor: "100 0",
                    labelClass: "marker-labels"
                };
            }
        }
    }];
    $scope.$watchCollection("markers.coords", function(newVal, oldVal) {
        if (_.isEqual(newVal, oldVal))
            return;
        $scope.coordsUpdates++;
    });
    $timeout(function() {
        $scope.markers.coords = {
            longitude: -111.652889,
            latitude: 35.190833
        }
        $scope.dynamicMoveCtr++;
        $timeout(function() {
            $scope.markers.coords = {
                longitude: -111.652889,
                latitude: 35.190833
            }
            $scope.dynamicMoveCtr++;
        }, 2000);
    }, 1000);

    $scope.addCoordinates = function() {
        var newID = $scope.markers.length + 1;
        $scope.markers.push({
            idKey: newID,
            coords: {
                longitude: 0,
                latitude: 0
            },
            options: {
                draggable: true
            },
            icon: "",
            events: {
                dragend: function(markers, eventName, args) {
                    $log.log('markers dragend');
                    var lat = markers.getPosition().lat();
                    var lon = markers.getPosition().lng();
                    $log.log(lat);
                    $log.log(lon);

                    $scope.marker.options = {
                        draggable: true,
                        labelContent: "lat: " + $scope.markers.coords.latitude + ' ' + 'lon: ' + $scope.markers.coords.longitude,
                        labelAnchor: "100 0",
                        labelClass: "marker-labels"
                    };
                }
            }
        });
    };
});
