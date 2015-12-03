var f = angular.module('ngForm', ['uiGmapgoogle-maps']);

f.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyB8nllB0zwraQo5qJMGdtcxulsTPJOnd8U',
        v: '3.20',
        libraries: 'weather,geometry,visualization'
    });
});

// Controller for the Upload form
f.controller('FormCtrl', function($scope, $log, $timeout) {

    // User data holds all the user selected
    $scope.userData = {};

    $scope.uploadType = ['CSV (headerless)', 'Excel', 'NOAA', 'LiPD'];
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

    // $scope.addCoordinates = function() {
    //     var newID = $scope.geoCoordinates.length + 1;
    //     $scope.geoCoordinates.push({});
    // };

    // REMOVE ROW OF COORDINATES FROM PAGE
    $scope.removeCoords = function($index) {
        $scope.markers.splice($index, 1);
    };

    // AFTER COORDIANTES COMPLETE, PUSH COORDS TO USERDATA
    $scope.pushCoords = function() {

    };

    // ADD NEW DATA COLUMN
    $scope.addColumn = function() {
        var newID = $scope.columns.length + 1;
        $scope.columns.push({
            "Column": newID,
            "Parameter": "",
            "Description": "",
            "Units": ""
        });
    };

    // ADD NEW AUTHOR ROW
    $scope.addAuthor = function() {
        var newID = $scope.authors.length + 1;
        $scope.authors.push({
            'id': newID
        });
    };

    // ADD NEW FUNDING ROW
    $scope.addFunding = function() {
        var newID = $scope.funding.length + 1;
        $scope.funding.push({
            "id": newID,
            "a": "fundingAgency",
            "f": "fundingGrant"
        });
    }

    // SHOW CONTENTS OF ANY TEXT UPLOADED FILE
    $scope.showContent = function($fileContent) {
        $scope.userData = $fileContent;
    };

    // INITIALIZE MAP
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

    // PUSH NEW COORDINATES
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
