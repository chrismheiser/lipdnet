var f = angular.module('ngCreateLipd', ['uiGmapgoogle-maps', 'ngFileUpload']);

// Google Maps API key to allow us to embed the map
f.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyB8nllB0zwraQo5qJMGdtcxulsTPJOnd8U',
        v: '3.20',
        libraries: 'weather,geometry,visualization'
    });
});

f.run([function() {
  if (typeof(Storage) !== "undefined") {
      // Code for localStorage/sessionStorage.
      sessionStorage.clear();
      console.log("Session Storage has been cleared");
  } else {
      // Sorry! No Web Storage support..
      console.log("There is no support for Session Storage. Please try a different browser.");
  }
}]);

// Controller for the Upload form
f.controller('CreateCtrl',['$scope', 'Upload', '$timeout', '$q', '$http', function($scope, $log, $timeout, $default, Upload, $q, $http) {


    // User data holds all the user selected or imported data
    $scope.keys = {
      "advKeys": ["@context", "tsid", "number", "google", "md5", "lipdversion", "investigators"],
      "lowKeys": [],
      "miscKeys": ["studyname", "proxy", "metadatamd5", "googlespreadsheetkey", "googlemetadataworksheet", "@context", "tagmd5", "datasetname", "description"],
      "reqRootKeys": ["archiveType", "dataSetName", "paleoData", "geo"],
      "reqPubKeys": ["authors", "title", "year", "journal"],
      "reqTableKeys": ["number", "variableName", "TSid"],
      "reqGeoKeys": ["coordinates"]
    };
    $scope.feedback = {
      "missingTsidCt": 0,
      "wrnCt": 0,
      "errCt": 0,
      "tsidMsgs": [],
      "posMsgs": [],
      "errMsgs": [],
      "wrnMsgs": [],
      "dataCanDo": []
    };
    $scope.geoMarkers = [];
    $scope.files = {
      "lipdFilename": "",
      "dataSetName": "",
      "fileCt": 0,
      "bagit": {},
      "csv": {},
      "json": {
        "lipdVersion": 1.2,
        "archiveType": "",
        "dataSetName": "",
        "funding": [{ "agencyName": "", "grant": "" }],
        "pub": [{ "identifier": [{ "type": "doi",
            "id": "",
            "url": "" }] }],
        "geo": { "geometry": { "coordinates": [0, 0, 0] } },
        "chronData": [{
          "chronMeasurementTable": {},
          "chronModel": [{
            "method": {},
            "ensembleTable": {},
            "summaryTable": {},
            "distributionTable": []
          }]
        }],
        "paleoData": [{
          "paleoMeasurementTable": {},
          "paleoModel": [{
            "method": {},
            "ensembleTable": {},
            "summaryTable": {},
            "distributionTable": []
          }]
        }]
      }
    };
    $scope.allFiles = [];
    $scope.allFilenames = [];
    $scope.downloadPromises = [];
    $scope.pageMeta = {
      "toggle": "",
      "simpleView": true,
      "valid": false,
      "captcha": false
    };
    $scope.feedback = {
      "missingTsidCt": 0,
      "wrnCt": 0,
      "errCt": 0,
      "tsidMsgs": [],
      "posMsgs": [],
      "errMsgs": [],
      "wrnMsgs": [],
      "dataCanDo": []
    };
    $scope.pubCt = 1;
    $scope.fundCt = 1;
    $scope.paleoCt = 1;
    $scope.chronCt = 1;
    $scope.paleoModelCt = 1;
    $scope.chronModelCt = 1;

    $scope.$watch("meta", function(){
      document.getElementById("metaPretty").innerHTML = JSON.stringify($scope.files.json, undefined, 2);
    }, true);


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
      "number": 1,
      "variableName": "",
      "description": "",
      "units": "",
      "values": ""
    }];
    $scope.colsChron = [{
      "number": 1,
      "variableName": "",
      "description": "",
      "units": "",
      "values": ""
    }];
    $scope.pubType = ['Article'];
    $scope.funding = [{
        "id": "1",
        "a": "fundingAgency",
        "f": "fundingGrant",
        "p": "fundingInvestigator",
        "c": "fundingCountry"
    }];
    $scope.geo = {};
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
          "number": newID,
          "variableName": "",
          "description": "",
          "units": "",
          "values": ""
        });
    };
    // Add Chron column
    $scope.addColumnChron = function() {
        var newID = $scope.colsChron.length + 1;
        $scope.colsChron.push({
            "number": newID,
            "variableName": "",
            "description": "",
            "units": "",
            "values": ""
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
            "f": "fundingGrant",
            "p": "fundingInvestigtor",
            "c": "fundingCountry"
        });
    };

    // show contents of file upload
    // $scope.showContent = function($fileContent) {
    //     $scope.meta = $fileContent;
    // };

    // Initialize the map
    // $scope.flagstaff = { latitude: 35.185, longitude: -111.6526};

    // set google map default window to USA
    $scope.map = {
        center: {
            latitude: 0,
            longitude: 0
        },
        zoom: 1,
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
    $scope.addCoordinates();


}]);
