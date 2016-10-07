var f = angular.module('ngForm', ['uiGmapgoogle-maps', 'json-tree', 'ngFileUpload']);

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
      console.log("There is no support for Session Storage. Please try a different browser.")
  }
}]);

// Controller for the Upload form
f.controller('FormCtrl',['$scope', 'Upload', '$timeout', '$q', '$http', function($scope, $log, $timeout, $default, Upload, $q, $http) {


    // User data holds all the user selected or imported data
    $scope.json = {
      'metadata':{
          "lipdVersion": 1.2,
          "archiveType": "",
          "dataSetName": "",
          "funding": [],
          "pub": [{}],
          "geo": {"geometry":{"coordinates":[]}},
          "chronData": {"chronMeasurementTable": {}, "chronModel":{}},
          "paleoData": {"paleoMeasurementTable": {}, "paleoModel":{}}
          }
    }

    $scope.metaErrors = {}
    $scope.pageMeta = {"toggle": "", "valid": false, "filePicker": false}
    $scope.geoMarkers = [];

    $scope.pubCt = 1;
    $scope.fundCt = 1;
    $scope.paleoCt = 1;
    $scope.chronCt = 1;
    $scope.paleoModelCt = 1;
    $scope.chronModelCt = 1;
    $scope.errorCt = 0;
    $scope.warningCt = 0;

    $scope.$watch("json.metadata", function(){
      document.getElementById("metaPretty").innerHTML = JSON.stringify($scope.json.metadata, undefined, 2);
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
    $scope.addCoordinates();

  // ANONYMOUS FUNCTIONS

  // Set up zip.js object and its corresponding functions
  (function(obj) {

      var requestFileSystem = obj.webkitRequestFileSystem || obj.mozRequestFileSystem || obj.requestFileSystem;

      function onerror(message) {
        alert(message);
      }

      function createTempFile(callback) {
        var tmpFilename = "tmp.dat";
        requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem) {
          function create() {
            filesystem.root.getFile(tmpFilename, {
              create : true
            }, function(zipFile) {
              callback(zipFile);
            });
          }

          filesystem.root.getFile(tmpFilename, null, function(entry) {
            entry.remove(create, create);
          }, create);
        });
      }

      var model = (function() {
        var URL = obj.mozURL || obj.URL;

        return {
          getEntries : function(file, onend) {
            zip.createReader(new zip.BlobReader(file), function(zipReader) {
              zipReader.getEntries(onend);
            }, onerror);
          },
          getEntryFile : function(entry, creationMethod, onend, onprogress) {
            var writer, zipFileEntry;

            function getData() {
              entry.getData(writer, function(blob) {
                var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
                onend(blobURL);
              }, onprogress);
            }

            if (creationMethod == "Blob") {
              writer = new zip.BlobWriter();
              getData();
            } else {
              createTempFile(function(fileEntry) {
                zipFileEntry = fileEntry;
                writer = new zip.FileWriter(zipFileEntry);
                getData();
              });
            }
          },
          getEntryFileData : function(entry, creationMethod, onend, onprogress) {
            var writer, zipFileEntry;

            function getData() {
              entry.getData(writer, function(blob) {
                var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
                onend(blobURL);
              }, onprogress);
            }

            if (creationMethod == "Blob") {
              writer = new zip.BlobWriter();
              return getData();
            } else {
              createTempFile(function(fileEntry) {
                zipFileEntry = fileEntry;
                writer = new zip.FileWriter(zipFileEntry);
                 onend(getData());
              });
            }
          }
        };
      })();

  // Attach to respective DOM elements and set up listener for change event on file-input
  // When file is uploaded, it will trigger data to be set to sessionStorage and be parsed.
  (function() {

    // Attach to DOM elements related to zip upload
    var fileInput = document.getElementById("file-input");
    var unzipProgress = document.createElement("progress");
    var fileList = document.getElementById("file-list");
    var creationMethodInput = document.getElementById("creation-method-input");

    // Trigger download event when user clicks a zip file link.
    function download(entry, li, a) {
      model.getEntryFile(entry, creationMethodInput.value, function(blobURL) {
        // create the click event
        var clickEvent = document.createEvent("MouseEvent");
        // when finished unzip, remove child node
        if (unzipProgress.parentNode)
          unzipProgress.parentNode.removeChild(unzipProgress);
        // unzip progress initialize at 0
        unzipProgress.value = 0;
        unzipProgress.max = 0;
        // add mouse event to click event
        clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        // 'a href' tag gets updated with the blob url to the file data
        a.href = blobURL;
        // 'download' tag gets updated with original entry filename
        a.download = entry.filename;
        // dispatch and execute the click event
        a.dispatchEvent(clickEvent);
      }, function(current, total) {
        // start unzipping and track the progress
        unzipProgress.value = current;
        unzipProgress.max = total;
        li.appendChild(unzipProgress);
      });
    }

    // TODO
    // Create all download links upfront. Don't wait for user click-event. Just make them.
    function getWithoutDownload(entry, li, a) {
      model.getEntryFileData(entry, creationMethodInput.value, function(blobURL) {
        if (unzipProgress.parentNode)
          unzipProgress.parentNode.removeChild(unzipProgress);
        unzipProgress.value = 0;
        unzipProgress.max = 0;
        a.href = blobURL;
        a.download = entry.filename;
      }, function(current, total) {
        unzipProgress.value = current;
        unzipProgress.max = total;
        li.appendChild(unzipProgress);
      });
    }

    if (typeof requestFileSystem == "undefined")
      creationMethodInput.options.length = 1;

    // When a file is chosen for upload, trigger the change event
    fileInput.addEventListener('change', function() {
      // disable the file input after a file has been chosen.
      fileInput.disabled = true;
      // get a list of file entries inside this zip
      model.getEntries(fileInput.files[0], function(entries) {
        fileList.innerHTML = "";
        // loop for each file in the zip
        entries.forEach(function(entry) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          // display the name of the file in the page
          a.textContent = entry.filename;
          // defaults link to nothing until click even is activated.
          a.href = "#";
          // when user clicks on file name in list, then trigger download file
          a.addEventListener("click", function(event) {
            // if click even activated, and file has not been downloaded yet, then go get data, create download link, and download
            if (!a.download) {
              download(entry, li, a);
              event.preventDefault();
              return false;
            }
            // if file was already downloaded, then skip the legwork and go straight to downloading the file
          }, false);
          // check if this is the jsonld file. If it is, we want to load the data into the sesson storage.
          if(entry.filename.indexOf(".jsonld") >= 0){
            // get the data from the jsonld file, and set it to the sessionStorage
            entry.getData(new zip.TextWriter(), function(text) {

              // Set the text contains the entry data as a String
              sessionStorage.setItem("metadata", text);

              // wrap parse function in $apply, so the view is updated with the new information
              $scope.$apply(function(){
                // parse text into a JSON object, and then parse the metadata
                console.log("call parseMetadata form event listener. ")
                $scope.json.metadata = JSON.parse(text);
                $scope.pageMeta.filePicker = true;

              });
            }, function(current, total) {
              // onprogress callback
            });
          }

          // replace 'a'  tag with our new modified 'a' tag
          li.appendChild(a);
          // replace 'li' tag with new modified 'li' tag
          fileList.appendChild(li);
        });
      });
      // once the change even has triggered, it cannot be triggered again until page refreshes.
    }, false);
  })();

})(this);


}]);
