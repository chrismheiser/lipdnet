// 'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

// UPLOAD EVENTS
// 1. Disable Upload button
// 2. Use ImportService to parse data
// 3. Put data in $scope.files, sorted by type (json, csv, bagit)
// 4a. Start validation
// 4b. Reset all validation metadata variables (errors, warnings, keys, etc..)
// 4c. Verify LiPD v1.2 structure
// 4d. Verify Required Data is given
// 4e. Verify bagit files are given (is properly bagged LiPD)
// 4f. Verify valid LiPD file (no errors)
// 4g. Create the Simple View

// DOWNLOAD EVENTS
// 1. Use ExportService to organize $scope.files data
// 2. Open zip file and add files
// 3. Close zip file and download
// 4. Reset zip file to null

var f = angular.module('ngValidate', ['uiGmapgoogle-maps', 'json-tree', 'ngFileUpload', "ngMaterial", "ngTable", "cgBusy", "vcRecaptcha"]);

// Google Maps API key to allow us to embed the map
f.config(function (uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    // key: 'AIzaSyB8nllB0zwraQo5qJMGdtcxulsTPJOnd8U',
    key: "AIzaSyA7HRzSi5HhyKTX9Xw7CZ-9XScwq04TZyc",
    v: '3.20',
    libraries: 'weather,geometry,visualization'
  });
});

f.run([function () {
  if (typeof Storage !== "undefined") {
    // Code for localStorage/sessionStorage.
    sessionStorage.clear();
    console.log("Session Storage has been cleared");
  } else {
    // Sorry! No Web Storage support..
    console.log("There is no support for Session Storage. Please try a different browser.");
  }
}]);

// IMPORT SERVICE
// Parse service for unpacking and sorting LiPD file data
f.factory("ImportService", ["$q", function ($q) {

  // parse the csv metadata and return an object
  var setCsvMeta = function setCsvMeta(dat) {
    // parse the data using Papa module
    var x = Papa.parse(dat);
    // set fields of interest for later validation
    x.rows = x.data.length;
    x.cols = x.data[0].length;
    x.delimiter = x.meta.delimiter;
    return x;
  };

  var compilePromise = function compilePromise(entry, dat, type) {
    console.log("compilePromse: " + entry.filename.split("/").pop());
    var d = $q.defer();
    var x = {};
    x.type = type;
    x.filenameFull = entry.filename;
    x.filenameShort = entry.filename.split("/").pop();
    // how do we get the blobURL here?
    // x["blobURL"] = "";
    x.data = dat;
    x.pretty = JSON.stringify(dat, undefined, 2);
    return x;
  };

  // get the text from the ZipJs entry object. Parse JSON as-is and pass CSV to next step.
  var getText = function getText(entry, type) {
    var d = $q.defer();
    // var filename = entry.filename;
    entry.getData(new zip.TextWriter(), function (text) {
      if (type === "bagit") {
        d.resolve(compilePromise(entry, text, type));
      } else if (type === "json") {
        // blindly attempt to parse as jsonld file
        d.resolve(compilePromise(entry, JSON.parse(text), type));
      } else if (type === "csv") {
        // if parsing jsonld file fails, that's because it's a csv file. So parse as csv instead.
        d.resolve(compilePromise(entry, setCsvMeta(text), type));
      }
    });
    return d.promise;
  };

  // parse array of ZipJS entry objects into usable objects with more relevant information added.
  var parseFiles = function parseFiles(entries) {
    console.log("parseFiles");
    // array of promises
    var promises = [];
    try {
      // loop for each entry object in the array
      angular.forEach(entries, function (entry) {
        // if the object isn't empty
        if (entry) {
          // filter out the system files that being with '._' These slow down processing and we don't want them
          if (entry.filename.split("/").pop().indexOf("._") !== 0) {
            if (entry.filename.indexOf(".csv") >= 0) {
              // push the promise to the master list
              promises.push(getText(entry, "csv"));
            } else if (entry.filename.indexOf(".jsonld") >= 0 || entry.filename.indexOf(".json") >= 0) {
              // push the promise to the master list
              promises.push(getText(entry, "json"));
            }
            // track the bagit filenames
            else if (entry.filename.indexOf(".txt") >= 0) {
                promises.push(getText(entry, "bagit"));
            }
          }
        }
      });
      // return when all promises are filled
      console.log("Exiting parseFiles");
      return $q.all(promises);
    } catch (err) {
      console.log(err);
    }
  };

  return {
    parseFiles: parseFiles
  };
}]);

// EXPORT SERVICE
// Organize and prep data to be zipped and downloaded
f.factory("ExportService", ["$q", function ($q) {


  // get the text from the ZipJs entry object. Parse JSON as-is and pass CSV to next step.
  var getText = function getText(filename, dat) {
    var d = $q.defer();
    d.resolve({filename, dat});
    return d.promise;
  };

  // prep all files for zip download.
  // make data "write ready" and index by filename
  var prepForDownload = function(_d1){
    var d = $q.defer();
    var promises = [];

    // add in the jsonld
    var _jsonFilename = _d1.dataSetName + ".jsonld";
    // convert formatted json into stringified json
    var _jsonPrepped = JSON.stringify(_d1.json, null, 4);
    promises.push(getText(_jsonFilename, _jsonPrepped));

    // BAGIT ITEMS IGNORED. NEW BAGIT FILES WILL BE GENERATED IN BACKEND
    // loop for bagit items
    // for (var _filename1 in _d1.bagit) {
    //   // create entry in flat scope obj. ref by filename, and link data. no special work needed here
    //   promises.push(getText(_filename1, _d1.bagit[_filename1]["data"]));
    // }

    // loop for csv items
    for (var _filename2 in _d1.csv) {
      // skip loop if the property is from prototype
      if (!_d1.csv.hasOwnProperty(_filename2)) continue;
      // convert formatted csv data from the json obj
      var csvArrs = _d1.csv[_filename2]["data"];
      // turn the formatted csv data into a compiled 'csv string'
      var csvStr = prepCsvEntry(csvArrs);
      // push the data to the master array
      promises.push(getText(_filename2, csvStr));
    }
    // resolve the array
    return $q.all(promises);
  }; // end prepForDownload

  // concat all the csv arrays into a flat data string that can be written to file
    var prepCsvEntry = function(csvArrs){
    // header for the csv file
    var csvContent = "";
    angular.forEach(csvArrs, function(entry, idx){
      // turn the array into a joined string by commas.
       dataString = entry.join(",");
       // add this new string onto the growing master string. if it's the end of the data string, then add newline char
      //  csvContent += idx < entry.length ? dataString + "\n" : dataString;
      csvContent += dataString + "\n";

    });
    return(csvContent);

  }; // end prepCsvEntry

  // parse array of ZipJS entry objects into usable objects with more relevant information added.
  var prepZip = function prepZip(dat) {
    console.log("enter prepZip");
    return(dat);
  };

  return {
    prepZip: prepZip,
    prepForDownload: prepForDownload,
    prepCsvEntry: prepCsvEntry
  };
}]);


// Controller - Validate Form
f.controller('ValidateCtrl', ['$scope', '$log', '$timeout', '$q', '$http', 'Upload', "ImportService", "ExportService", "$mdDialog", "NgTableParams", function ($scope, $log, $timeout, $q, $http, Upload, ImportService, ExportService, $mdDialog, NgTableParams) {

  $scope._myPromiseImport = "";
  $scope._myPromiseExport = "";
  // something related to modal windows
  // $scope.status = '  ';
  // something related to modal windows
  // $scope.customFullscreen = false;

  // TEST AREA FOR MODAL WINDOWS
  // var self = this;
  // $scope.dataToPass = "";
  // $scope.tableParams = new NgTableParams({}, { dataset: $scope.dataToPass });
  //
  // $scope.showAdvanced = function (ev, file) {
  //
  //   var modal = "/modal";
  //   if (file.type === "json") {
  //     modal = "/modalJson";
  //   } else if (file.type === "csv") {
  //     modal = "/modalCsv";
  //   } else if (file.type === "bagit") {
  //     modal = "/modalTxt";
  //   }
  //
  //   $mdDialog.show({
  //     locals: { dataToPass: file },
  //     controller: mdDialogCtrl,
  //     templateUrl: modal,
  //     parent: angular.element(document.body),
  //     targetEvent: ev,
  //     clickOutsideToClose: true,
  //     fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
  //   }).then(function (answer) {
  //     $scope.status = 'You said the information was "' + answer + '".';
  //   }, function () {
  //     $scope.status = 'You cancelled the dialog.';
  //   });
  // };
  //
  // var mdDialogCtrl = function mdDialogCtrl($scope, $mdDialog, dataToPass) {
  //   $scope.mdDialogData = dataToPass;
  //   $scope.dataToPass = dataToPass;
  //
  //   $scope.hide = function () {
  //     $mdDialog.hide();
  //   };
  //
  //   $scope.cancel = function () {
  //     $mdDialog.cancel();
  //   };
  //
  //   $scope.answer = function (answer) {
  //     $mdDialog.hide(answer);
  //   };
  // };

  // END TEST AREA FOR MODAL WINDOWS


  // FILES: User data holds all the user's LiPD data
  $scope.files = {
    "lipdFilename": "",
    "dataSetName": "",
    "fileCt": 0,
    "bagit": {},
    "csv": {},
    "jsonSimple": {
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
    },
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
  // PAGEMETA: Data about how to transform the page view based on user input
  $scope.pageMeta = {
    "toggle": "",
    "simpleView": true,
    "valid": false,
    "filePicker": false,
    "dlFallback": false,
    "dlFallbackMsg": "",
    "captcha": false,
  };
  // FEEDBACK: All warnings, errors, and messages received from the validator
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
  // MAP: Google map location markers
  $scope.mapMarkers = [];
  // set google map default window to USA
  $scope.map = {
    center: {
      latitude: 0,
      longitude: 0
    },
    zoom: 2,
    bounds: {},
    options: {
      scrollwheel: false,
      streetViewControl: false
    },
  };
  // STATUS: PASS/FAIL/OTHER status given by validator response.
  $scope.status = "N/A";

  // MISC Functions

  // Reset the page
  // All metadata and data about the page is emptied when the Upload button is clicked. Ready for another file upload.
  $scope.resetPage = function(){
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
    $scope.mapMarkers = [];
    $scope.files = {
      "lipdFilename": "",
      "dataSetName": "",
      "fileCt": 0,
      "bagit": {},
      "csv": {},
      "jsonSimple": {
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
      },
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
    $scope.pageMeta = {
      "toggle": "",
      "simpleView": true,
      "valid": false,
      "filePicker": false,
      "dlFallback": false,
      "dlFallbackMsg": "",
      "captcha": false,
    };
    $scope.status = "N/A";
  };

  $scope.startCaptcha = function(){
    $scope.pageMeta.captcha = true;
  };


  // WATCHERS
  // Watch for updated metadata information, then display the changes in the pre/code box (if it's being shown)
  $scope.$watch("files.json", function () {
    // console.log($scope.files.json);
    var mp = document.getElementById("metaPretty");
    if (mp) {
      console.log(mp);
      mp.innerHTML = JSON.stringify($scope.files.json, undefined, 2);
    }
    // Create the Simple View
    $scope.files.jsonSimple = misc.advancedToSimple($scope.files.json);
  }, true);

  // UPLOAD TO NODE: Upload *validated* lipd data to backend
  $scope.uploadZip = function (zip, cb) {
    Upload.upload({
        url: '/files',
        data: {file: zip.dat,
              filename: zip.filename}
    }).then(function (resp) {
        console.log('Success');
        console.log(resp);
        cb(resp);
    }, function (resp) {
        console.log('Error status: ' + resp.status);
    }, function (evt) {
        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
    });
  };

  // DOWNLOAD TO CLIENT: Download the *validated* LiPD file to client's computer
  $scope.downloadZip = function(){
    // use the service to parse data from the ZipJS entries
    $scope._myPromiseExport = ExportService.prepForDownload($scope.files);
    $scope._myPromiseExport.then(function (res) {
      console.log("ExportService.then()");
      //upload zip to node backend, then callback and download it afterward.
      $scope.uploadZip({"filename": $scope.files.lipdFilename, "dat": res}, function(tmp){
        // do get request to trigger download file immediately after download
        console.log("client side after upload");
        console.log(tmp.data);
        window.location.href = "http://localhost:3000/files/" + tmp.data;
        // window.location.href = "http://www.lipd.net/files/" + tmp.data;
        // reset the captcha
        $scope.pageMeta.captcha = false;
      });
    });
  };



  // ANONYMOUS FUNCTIONS

  // Set up zip.js object and its corresponding functions
  (function (obj) {

    var requestFileSystem = obj.webkitRequestFileSystem || obj.mozRequestFileSystem || obj.requestFileSystem;

    function onerror(message) {
      alert(message);
    }

    function createTempFile(callback) {
      var keysFilename = "keys.dat";
      requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function (filesystem) {
        function create() {
          filesystem.root.getFile(keysFilename, {
            create: true
          }, function (zipFile) {
            callback(zipFile);
          });
        }

        filesystem.root.getFile(keysFilename, null, function (entry) {
          entry.remove(create, create);
        }, create);
      });
    }

    var model = function () {
      var zipFileEntry, zipWriter, writer, creationMethod;
      URL = window.webkitURL || obj.mozURL || obj.URL;

      return {
        setCreationMethod : function(method) {
          creationMethod = method;
        },
        addFiles : function addFiles(files, oninit, onadd, onprogress, onend) {
          var addIndex = 0;

          function nextFile() {
            var file = files[addIndex];
            onadd(file);
            zipWriter.add(file.name, new zip.BlobReader(file), function() {
              addIndex++;
              if (addIndex < files.length)
                nextFile();
              else
                onend();
            }, onprogress);
          }

          function createZipWriter() {
            zip.createWriter(writer, function(writer) {
              zipWriter = writer;
              oninit();
              nextFile();
            }, onerror);
          }

          if (zipWriter)
            nextFile();
          else if (creationMethod == "Blob") {
            writer = new zip.BlobWriter();
            createZipWriter();
          } else {
            createTempFile(function(fileEntry) {
              zipFileEntry = fileEntry;
              writer = new zip.FileWriter(zipFileEntry);
              createZipWriter();
            });
          }
        },
        getEntries: function getEntries(file, onend) {
          zip.createReader(new zip.BlobReader(file), function (zipReader) {
            zipReader.getEntries(onend);
          }, onerror);
        }, // end getEntries
        getEntryFile: function getEntryFile(entry, creationMethod, onend, onprogress) {
          var writer, zipFileEntry;

          function getData() {
            entry.getData(writer, function (blob) {
              var blobURL = URL.createObjectURL(blob);
              onend(blobURL);
            }, onprogress);
          }

          if (creationMethod == "Blob") {
            writer = new zip.BlobWriter();
            getData();
          }
        },
        getBlobURL : function(callback) {
          zipWriter.close(function(blob) {
            var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
            callback(blobURL);
            zipWriter = null;
          });
        },
        getBlob : function(callback) {
          zipWriter.close(callback);
        }

      }; // end return


    }(); // end var model

    // Attach to respective DOM elements and set up listener for change event on file-input
    // When file is uploadesd, it will trigger data to be set to sessionStorage and be parsed.
    (function () {
      var fileInput = document.getElementById("file-input");
      var creationMethodInput = "Blob";
      var downloadButton = document.getElementById("download-btn");
      model.setCreationMethod("Blob");
      // if (typeof requestFileSystem == "undefined") creationMethodInput.options.length = 1;

      // When a file is chosen for upload, trigger the change event
      fileInput.addEventListener('change', function () {
        // disable the file input after a file has been chosen.
        fileInput.disabled = false;
        // fileInput.disabled = true;

        // get a list of file entries inside this zip
        model.getEntries(fileInput.files[0], function (entries) {
          // use the service to parse data from the ZipJS entries
          $scope._myPromiseImport = ImportService.parseFiles(entries);
          $scope._myPromiseImport.then(function (res) {
            console.log("ImportService.then()");

            lipdValidator.sortBeforeValidate(res, function(_response_1){
              console.log("sortBeforeValidate callback: sending to validate_ng.js");
              $scope.files.json = _response_1.json;
              lipdValidator.validate(_response_1, function(_response_2){
                try {
                  console.log("Setting validator response to NG scope");
                  $scope.feedback = _response_2.feedback;
                  $scope.status = _response_2.status;
                  // Get coordinates, add markers to map, and shift map.
                  var _coordinates = map.getCoordinates($scope.files.json);
                  if (_coordinates.latitude !== 0 && _coordinates.longitude !== 0){
                    $scope.mapMarkers = map.addMarker($scope.mapMarkers, _coordinates);
                    $scope.map = map.updateMap($scope.map, _coordinates);
                  }
                } catch(err) {
                  console.log("Error trying to prepare response. Ending request: " + err);
                }
              }); // end validate
            }); // end sortBeforeValidate
            //RETURNS OBJECT : {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.status};

          }); // end ImportService

        }); // end model.getEntries
        // once the change even has triggered, it cannot be triggered again until page refreshes.
      }, false); // end upload event listener

    })();
  })(this);
  }]);

  // END ANONYMOUS FUNCTIONS
