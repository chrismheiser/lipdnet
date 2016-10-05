var f = angular.module('ngForm', ['uiGmapgoogle-maps']);


// f.directive('toggleClass', function() {
//     return {
//         restrict: 'A',
//         link: function(scope, element, attrs) {
//             element.bind('click', function() {
//                 element.toggleClass(attrs.toggleClass);
//             });
//         }
//     };
// });

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
    $scope.meta = {
      "funding": [],
      "pub": [],
      "geo": {"geomety":{"coordinates":[]}},
      "chronData": {"chronMeasurementTable": {}, "chronModel":{}},
      "paleoData": {"paleoMeasurementTable": {}, "paleoModel":{}}
    };
    $scope.metaErrors = {}
    $scope.pageMeta = {"toggle": ""}
    $scope.geoMarkers = [];

    $scope.pubCt = 1;
    $scope.fundCt = 1;
    $scope.paleoCt = 1;
    $scope.chronCt = 1;
    $scope.paleoModelCt = 1;
    $scope.chronModelCt = 1;
    $scope.errorCt = 0;


    // LiPD may end up being the only option, but I can foresee where we might accept jsonld files also.
    // $scope.uploadType = ['LiPD'];

    // Predefined form data
    $scope.unitsDistance = [
      { "short": "m", "long": 'Meters (m)'},
      { "short": "km", "long": 'Kilometers (km)'},
      { "short": "ft", "long": 'Feet (ft)'},
      { "short": "mi", "long": 'Miles (mi)'}
    ];
    $scope.authors = [{
        id: "1"
    }];
    $scope.colsPaleo = [{
        "Number": "1",
        "Variable Name": "",
        "Description": "",
        "Units": ""
    }];
    $scope.colsChron = [{
        "Number": "1",
        "Variable Name": "",
        "Description": "",
        "Units": ""
    }];
    $scope.pubType = ['Article']
    $scope.funding = [{
        "id": "1",
        "agency": "fundingAgency",
        "fund": "fundingGrant"
    }];
    $scope.geo = {}
    $scope.geoType = ['Feature'];
    $scope.geoGeometryType = ['Point', "MultiPoint", 'LineString', 'Polygon'];
    $scope.geoCoordinates = [{}];

    $scope.updateScopesFromChild = function(key, newVal) {
      $scope.$parse(key) = newVal;
    };

    $scope.addCoordinates = function() {
        var newID = $scope.geoCoordinates.length + 1;
        $scope.geoCoordinates.push({});
    };

    // Remove row of coordinates
    $scope.removeCoords = function($index) {
      $scope.geoMarkers.splice($index, 1);
    };

    // Coordinates are complete, push to userData (Is this needed? Should be automatically linked to userData)
    $scope.pushCoords = function() {
      // push to $scope.meta or $scope.geo.coords?
    };

    // Add Paleo column
    $scope.addColumnPaleo = function() {
        var newID = $scope.colsPaleo.length + 1;
        $scope.colsPaleo.push({
            "Number": newID,
            "Variable Name": "",
            "Description": "",
            "Units": ""
        });
    };
    // Add Chron column
    $scope.addColumnChron = function() {
        var newID = $scope.colsChron.length + 1;
        $scope.colsChron.push({
            "Number": newID,
            "Variable Name": "",
            "Description": "",
            "Units": ""
        });
    };

    // Add Publication Author
    $scope.addAuthor = function() {
        var newID = $scope.authors.length + 1;
        $scope.authors.push({
            'id': newID
        });
    };

    // Add Funding Entry
    $scope.addFunding = function() {
        var newID = $scope.funding.length + 1;
        $scope.funding.push({
            "id": newID,
            "a": "fundingAgency",
            "f": "fundingGrant"
        });
    }

    // show contents of file upload
    // $scope.showContent = function($fileContent) {
    //     $scope.meta = $fileContent;
    // };

    // Initialize the map
    // $scope.flagstaff = { latitude: 35.185, longitude: -111.6526};

    // set google map default window to USA
    $scope.map = {
        center: {
            latitude: 38.2,
            longitude: -98
        },
        zoom: 4,
        bounds: {}
    };

    // default options for google map
    $scope.options = {
        scrollwheel: false,
        streetViewControl: false,
    };

    // Add another set of coordinates to the map
    $scope.addCoordinates = function() {
        // geoMarker IDs are sequential
        var newID = $scope.geoMarkers.length + 1;
        // push the marker and it's default options to the array of geoMarkers
        $scope.geoMarkers.push({
            id: newID,
            longitude: 0,
            latitude: 0,
            elevation: 0,
            unit: "m",
            options: {
                draggable: true
            },
            events: {
                dragend: function(marker, eventName, args) {
                    $scope.geoMarkers.options = {
                        draggable: true,
                        labelContent: "lat: " + $scope.geoMarkers.latitude + ' ' + 'lon: ' + $scope.geoMarkers.longitude,
                        labelAnchor: "100 0",
                        labelClass: "marker-labels"
                    };
                }
            }
        });
    };

});
