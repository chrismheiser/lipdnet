var f = angular.module('ngForm', ['uiGmapgoogle-maps']);

// Google Maps API key to allow us to embed the map
f.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyB8nllB0zwraQo5qJMGdtcxulsTPJOnd8U',
        v: '3.20',
        libraries: 'weather,geometry,visualization'
    });
});

// Controller for the Upload form
f.controller('FormCtrl', function($scope, $log, $timeout) {

    // User data holds all the user selected or imported data
    $scope.userData = {};

    // LiPD may end up being the only option, but I can foresee where we might accept jsonld files also.
    $scope.uploadType = ['LiPD'];

    // Predefined form data
    $scope.unitsDistance = [{
        "short": "m",
        "long": 'Meters (m)'
    }, {
        "short": "km",
        "long": 'Kilometers (km)'
    }, {
        "short": "ft",
        "long": 'Feet (ft)'
    }, {
        "short": "mi",
        "long": 'Miles (mi)'
    }];
    $scope.authors = [{
        id: "1"
    }];
    $scope.columns = [{
        "Column": "1",
        "Parameter": "",
        "Description": "",
        "Units": ""
    }];
    $scope.pubType = ['Article']
    $scope.funding = [{
        "id": "1",
        "a": "fundingAgency",
        "f": "fundingGrant"
    }];
    $scope.geoType = ['Feature'];
    $scope.geoGeometryType = ['Point', "MultiPoint", 'LineString', 'Polygon'];
    $scope.geoCoordinates = [{}];

    $scope.addCoordinates = function() {
        var newID = $scope.geoCoordinates.length + 1;
        $scope.geoCoordinates.push({});
    };

    // Remove row of coordinates
    $scope.removeCoords = function($index) {
      $scope.markers.splice($index, 1);
    };

    // Coordinates are complete, push to userData (Is this needed? Should be automatically linked to userData)
    $scope.pushCoords = function() {
      // push to $scope.userData or $scope.geo?
    };

    // Add data column
    $scope.addColumn = function() {
        var newID = $scope.columns.length + 1;
        $scope.columns.push({
            "Column": newID,
            "Parameter": "",
            "Description": "",
            "Units": ""
        });
    };

    // Add author
    $scope.addAuthor = function() {
        var newID = $scope.authors.length + 1;
        $scope.authors.push({
            'id': newID
        });
    };

    // Add funding
    $scope.addFunding = function() {
        var newID = $scope.funding.length + 1;
        $scope.funding.push({
            "id": newID,
            "a": "fundingAgency",
            "f": "fundingGrant"
        });
    }

    // Show contents of uploaded file
    $scope.showContent = function($fileContent) {
        $scope.userData = $fileContent;
    };

    // Initialize the map
    $scope.flagstaff ={ latitude: 35.185, longitude: -111.6526};
    $scope.map = {
        center: {
            latitude: 38.2,
            longitude: -98
        },
        zoom: 4,
        bounds: {}
    };
    $scope.options = {
        scrollwheel: false,
        streetViewControl: false,
    };
    $scope.markers = [];

    // Add another set of coordinates to the map
    $scope.addCoordinates = function() {
        var newID = $scope.markers.length + 1;
        $scope.markers.push({
            id: newID,
            longitude: 0,
            latitude: 0,
            options: {
                draggable: true
            },
            events: {
                dragend: function(marker, eventName, args) {
                    $scope.marker.options = {
                        draggable: true,
                        labelContent: "lat: " + $scope.marker.latitude + ' ' + 'lon: ' + $scope.marker.longitude,
                        labelAnchor: "100 0",
                        labelClass: "marker-labels"
                    };
                }
            }
        });
    };

});
