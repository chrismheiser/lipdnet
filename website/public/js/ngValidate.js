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

  // doSomething.test1("PASS STRING1");
  // doSomething.test2("PASS THE  STRING");
  // console.log(doSomething.test);
  // lipdValidation.test();

  $scope._myPromiseImport = "";
  $scope._myPromiseExport = "";
  // something related to modal windows
  $scope.status = '  ';
  // something related to modal windows
  $scope.customFullscreen = false;

  // TEST AREA FOR MODAL WINDOWS
  var self = this;
  $scope.dataToPass = "";
  $scope.tableParams = new NgTableParams({}, { dataset: $scope.dataToPass });

  $scope.showAdvanced = function (ev, file) {

    var modal = "/modal";
    if (file.type === "json") {
      modal = "/modalJson";
    } else if (file.type === "csv") {
      modal = "/modalCsv";
    } else if (file.type === "bagit") {
      modal = "/modalTxt";
    }

    $mdDialog.show({
      locals: { dataToPass: file },
      controller: mdDialogCtrl,
      templateUrl: modal,
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
    }).then(function (answer) {
      $scope.status = 'You said the information was "' + answer + '".';
    }, function () {
      $scope.status = 'You cancelled the dialog.';
    });
  };

  var mdDialogCtrl = function mdDialogCtrl($scope, $mdDialog, dataToPass) {
    $scope.mdDialogData = dataToPass;
    $scope.dataToPass = dataToPass;

    $scope.hide = function () {
      $mdDialog.hide();
    };

    $scope.cancel = function () {
      $mdDialog.cancel();
    };

    $scope.answer = function (answer) {
      $mdDialog.hide(answer);
    };
  };

  // END TEST AREA FOR MODAL WINDOWS

  $scope.allFiles = [];
  $scope.allFilenames = [];
  $scope.downloadPromises = [];

  // Files: User data holds all the user selected or imported data
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

  // PageMeta: Data about how the upload form changes
  $scope.pageMeta = {
    "toggle": "",
    "simpleView": true,
    "valid": false,
    "filePicker": false,
    "dlFallback": false,
    "dlFallbackMsg": "",
    "captcha": false,
  };

  // NOTE: to do case insensitve key checking, you'd have to loop over every field. You cannot use "hasOwnProperty"
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

  // MISC Functions

  // Reset all metadata and data about the page.
  $scope.resetPage = function(){
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
    $scope.allFiles = [];
    $scope.allFilenames = [];
    $scope.downloadPromises = [];
    $scope.pageMeta = {
      "toggle": "",
      "simpleView": true,
      "valid": false,
      "filePicker": false,
      "dlFallback": false,
      "dlFallbackMsg": "",
      "captcha": false,
    };
  };

  $scope.startCaptcha = function(){
    $scope.pageMeta.captcha = true;
  };

  $scope.isBagit = function(filename){
    if (filename.indexOf(".txt") >= 0){
      return true;
    } else {
      return false;
    }
  };

  // Generate a TSid. An alphanumeric unique ID. Prefix + 8 chars.
  $scope.generateTSid = function(){
    var _tsid = "";
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    // Create TSID.
    // VAL prefix for tracability back to validator
    // 8 alphanumeric characters to match TSid standard format.
    _tsid = "VAL" + s4() + s4();
    return _tsid;
  };

  // PopulateTSid: Table Level
  // Check all columns in a table with TSid's where necessary
  $scope.populateTSids3 = function(table){
    // Safe check. Make sure table has "columns"
    if (table.hasOwnProperty("columns")) {
      // Loop over all columns in the table
      for (var _i2 = 0; _i2 < table["columns"].length; _i2++) {
        var col = table["columns"][_i2];
        // Check for TSid key in column
        if(!col.hasOwnProperty("TSid")){
          // populate if doesn't exist.
          var _tsid = $scope.generateTSid();
          table["columns"][_i2]["TSid"] =  _tsid;
        }
      }
    }
    return table;
  };

  // PopulateTSid: Paleo/Chron level
  // Find all data tables
  $scope.populateTSids2 = function(d, pc){
    var pcData = pc + "Data";
    var meas = pc + "MeasurementTable";
    var mod = pc + "Model";
    // Check for entry
    if (d.hasOwnProperty(pcData)) {
      // Loop for each paleoData/chronData table
      for (var _k2 = 0; _k2 < d[pcData].length; _k2++) {
        // Is there a measurement table?
        if (d[pcData][_k2].hasOwnProperty(meas)) {
          var table = d[pcData][_k2][meas];
          // Loop for all meas tables
          for (var _j = 0; _j < table.length; _j++) {
            // Process table entry
            d[pcData][_k2][meas][_j] = $scope.populateTSids3(table[_j]);
          }
        }
        // Is there a model table?
        if (d[pcData][_k2].hasOwnProperty(mod)) {
          var table = d[pcData][_k2][mod];
          // Loop for each paleoModel table
          for (var _j2 = 0; _j2 < table.length; _j2++) {
            // Is there a summaryTable?
            if (d[pcData][_k2][mod][_j2].hasOwnProperty("summaryTable")) {
              // Process table
              d[pcData][_k2][mod][_j2]["summaryTable"] = $scope.populateTSids3(table[_j2]["summaryTable"]);
            } // end summary
            // Is there a ensembleTable?
            if (table[_j2].hasOwnProperty("ensembleTable")) {
              // Process table
              d[pcData][_k2][mod][_j2]["ensembleTable"] = $scope.populateTSids3(table[_j2]["ensembleTable"]);
            } // end ensemble
            // Is there a distributionTable?
            if (table[_j2].hasOwnProperty("distributionTable")) {
              table2 = table[_j2]["distributionTable"];
              // Loop for all dist tables
              for (var p = 0; p < table[_j2]["distributionTable"].length; p++) {
                // Process table
                d[pcData][_k2][mod][_j2]["distributionTable"][p] = $scope.populateTSids3(table2[p]);
              }
            } // end dist
          } // end model loop
        } // end model
      } // end paleoData loop
    } // end if hasOwnProperty
    return d;
  };

  $scope.populateTSids1 = function(){
    // using files.json

    // run once for paleoData and chronData
    pc = ["paleo", "chron"];
    for (var _i4 = 0; _i4 < pc.length; _i4++) {
      var _pc1 = pc[_i4];
      var _pc2 = pc[_i4] + "Data";
      // If paleoData found, continue.
      if($scope.files.json.hasOwnProperty(_pc2)){
        // Process the paleoData, and replace the data in the json
        $scope.files.json = $scope.populateTSids2($scope.files.json, _pc1);
      }
    }

    // Revalidate to remove TSid errors
    $scope.validate();
  };

  // Error log: Tally the error counts, and log messages to user
  $scope.logFeedback = function (errType, msg, key) {
    if (errType === "warn") {
      $scope.feedback.wrnCt++;
      $scope.feedback.wrnMsgs.push(msg);
    } else if (key === "TSid") {
      $scope.feedback.missingTsidCt++;
      $scope.feedback.tsidMsgs.push(msg);
    } else if (errType === "err") {
      $scope.feedback.errCt++;
      $scope.feedback.errMsgs.push(msg);
    } else if (errType === "pos") {
      $scope.feedback.posMsgs.push(msg);
    }
  };

  // WATCHERS

  // NOT IN USE
  // Watch for updated metadata information, then display the changes in the pre/code box (if it's being shown)
  $scope.$watch("files.json", function () {
    console.log($scope.files.json);
    var mp = document.getElementById("metaPretty");
    if (mp) {
      console.log(mp);
      mp.innerHTML = JSON.stringify($scope.files.json, undefined, 2);
    }
    // var c = document.getElementById("csvPretty");
    // if (c) {
    //   c.innerHTML = JSON.stringify($scope.files.csv, undefined, 2);
    // }
  }, true);


  // Validate: Triggered during file upload, and with "Validate" button click.
  $scope.validate = function () {
    console.log("validating");
    // wipe all page data and start from scratch.
    $scope.keys.lowKeys = [];
    $scope.geoMarkers = [];
    $scope.pageMeta.valid = false;
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
    console.log("verifyStructure");
    $scope.verifyStructure($scope.files.json);
    console.log("verifyRequiredFields");
    $scope.verifyRequiredFields($scope.files.json);
    console.log("verifyBagit");
    $scope.verifyBagit($scope.files.bagit);
    console.log("verifyValid");
    $scope.verifyValid();
    var jsonCopy = JSON.parse(JSON.stringify($scope.files.json));
    console.log("advancedToSimple");
    $scope.advancedToSimple(jsonCopy);
    console.log("Finished Validate");
  };

  $scope.numberInRange = function (start, end, val) {
    if (val >= start && val <= end) {
      return true;
    }
    return false;
  };

  // END WATCHERS




  // VERIFY STRUCTURE

  // master fucntion. call all subroutines to determine if this is a valid lipd structure
  $scope.verifyStructure = function (m) {
    // check that data fields are holding the correct value data types
    for (var k in m) {
      try {
        var correctType = null;
        lowKey = k.toLowerCase();
        v = m[k];
        $scope.keys.lowKeys.push(lowKey);
        if (lowKey === "archivetype") {
          correctType = $scope.verifyDataType("string", k, v);
        } else if (lowKey === "lipdversion") {
          // Valid LiPD versions: 1.0, 1.1, 1.2
          // check that the value is a number
          v = parseInt(v);
          correctType = $scope.verifyDataType("number", k, v);
          if (correctType) {
            if ([1.0, 1.1, 1.2].indexOf(v) == -1) {
              // LiPD version wasn't valid. Log errors to scope.
              $scope.logFeedback("err", "Invalid LiPD Version: Valid versions are 1.0, 1.1, and 1.2", "lipdVersion");
            } // end if in
          } // end data type check
        } else if (lowKey === "pub") {
          // pub must follow BibJSON standards
          $scope.verifyArrObjs(k, v);
        } else if (lowKey === "investigators" || lowKey === "investigator") {
          $scope.verifyDataType("any", k, v);
        } else if (lowKey === "funding") {
          $scope.verifyArrObjs(k, v);
        } else if (lowKey === "geo") {
          // geo must follow GeoJSON standards
          $scope.verifyDataType("object", k, v);
        } else if (lowKey == "chrondata") {
          $scope.verifyPaleoChron("chron", k, v);
        } else if (lowKey === "paleodata") {
          $scope.verifyPaleoChron("paleo", k, v);
        } else {
          // anything goes? no rules for these keys
          if ($scope.keys.miscKeys.indexOf(lowKey) === -1) {
            $scope.logFeedback("warn", "No rules found for key: " + k, k);
            console.log("verifyStructure: No rules for key: " + k);
          }
        }
      } catch (err) {
        console.log("verifyStructure: Caught error parsing: " + k);
      }
    }
  };

  // todo Do I need to verify these for structure????
  // if pub section exists, make sure it matches the bib json standard
  // if geo section exists, make sure it matches the geo json standard

  // check if the data type for a given key matches what we expect for that key
  $scope.verifyDataType = function (dt, k, v) {
    try {
      // special case: check for object array.
      if (dt === "array") {
        if (!Array.isArray(v)) {
          $scope.logFeedback("err", "Invalid data type: " + k + ".\n- Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
          return false;
        }
      } else if (dt === "any"){
        return true;
      } else {
        // expecting specified data type, but didn't get it.
        if ((typeof v === 'undefined' ? 'undefined' : _typeof(v)) != dt) {
          $scope.logFeedback("err", "Invalid data type: " + k + ".\n- Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
          return false;
        } // end if
      } // end else
    } catch (err) {
      // caught some other unknown error
      console.log("verifyDataType: Caught error parsing.\n- Expected: " + cdt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)));
    } // end catch
    return true;
  };

  // Check for an Array with objects in it.
  $scope.verifyArrObjs = function (k, v) {
    isArr = $scope.verifyDataType("array", k, v);
    if (isArr) {
      isObjs = $scope.verifyDataType("object", k, v[0]);
      if (isObjs) {
        return true;
      }
    }
    console.log("verifyArrObjs: Invalid data type: expected: obj, given: " + _typeof(v[0]));
    return false;
  };

  // paleoData and chronData use the same structure. Use to verify data types in both.
  $scope.verifyPaleoChron = function (pdData, k, v) {

    // value is an array
    if (!Array.isArray(v)) {
      $scope.logFeedback("err", "Invalid data type: " + k + ". Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
    } else if (Array.isArray(v) && v.length > 0) {
      // check if the root paleoData or chronData is an array with objects.
      var correctTop = $scope.verifyArrObjs(k, v);

      if (correctTop) {
        // create table names based on what "mode" we're in. chron or paleo
        var meas = pdData + "MeasurementTable";
        var mod = pdData + "Model";
        // check if measurement table exists
        if (v[0].hasOwnProperty(meas)) {
          // check if measurement table is array with objects
          $scope.verifyArrObjs(meas, v[0][meas]);
        } // end measurement table
        // check if model table exists
        if (v[0].hasOwnProperty(mod)) {
          // check if model table is array with objects
          var correctBottom = $scope.verifyArrObjs(mod, v[0][mod]);
          var modTables = ["summaryTable", "distributionTable", "method", "ensembleTable"];
          if (correctBottom) {
            // correct so far, so check if items in model table [0] are correct types
            for (i = 0; i < modTables.length; i++) {
              table = modTables[i];
              if (v[0][mod][0].hasOwnProperty(table)) {
                if (table === "distributionTable") {
                  $scope.verifyArrObjs(table, v[0][mod][0][table]);
                } else {
                  $scope.verifyDataType("object", table, v[0][mod][0][table]);
                }
              } // if has property
            } // end model table inner
          } // end correctBottom
        } // end has model table
      } // end correctTop
    } // end else
  }; // end verify

  // END VERIFY STRUCTURE




  // REQUIRED DATA

  // master for checking for required fields. call sub-routines.
  $scope.verifyRequiredFields = function (m) {
    // call sub-routine checks
    $scope.requiredRoot(m);
    $scope.requiredPaleoChron("paleo", m);
    $scope.requiredPaleoChron("chron", m);
  };

  // verify required fields at all levels of paleoData & chronData
  $scope.requiredPaleoChron = function (pc, m) {

    // I'll use "paleoData" in comments, but this function applies to paleoData and chronData
    var pdData = pc + "Data";
    var meas = pc + "MeasurementTable";
    var mod = pc + "Model";

    // paleoData not found
    if (!m.hasOwnProperty(pdData)) {
      if (pc === "paleo") {
        $scope.logFeedback("err", "Missing data: " + pdData + " section", pdData);
      }
    }
    // paleoData found
    else {
        if (pc === "paleo" && m[pdData].length === 0) {
          $scope.logFeedback("err", "Missing data: " + meas, meas);
        } else {
          // for each object in the paleoData list
          for (var i = 0; i < m[pdData].length; i++) {
            // hold table in variable.
            var table = m[pdData][i];
            var crumbs = pdData + i + meas;

            // measurementTable found
            if (table.hasOwnProperty(meas)) {
              for (var k = 0; k < table[meas].length; k++) {
                // hold current meas table object in a variable
                var measObj = table[meas][k];
                var crumbs = pdData + i + meas + k;
                $scope.requiredTable(measObj, crumbs);
              }
            } // end meas

            // paleoMeasurementTable not found, and it's required
            else if (!table.hasOwnProperty(meas) && pc == "paleo") {
                // log error for missing required table
                $scope.logFeedback("err", "Missing data: " + crumbs, meas);
              }
            // paleoModel found
            if (table.hasOwnProperty(mod)) {
              for (var k = 0; k < table[mod].length; k++) {
                var modObj = table[mod][k];
                var crumbs = pdData + i + mod + k;
                // found summary table
                if (modObj.hasOwnProperty("summaryTable")) {
                  $scope.requiredTable(modObj.summaryTable, crumbs + ".summaryTable");
                }
                // found ensemble table
                if (modObj.hasOwnProperty("ensembleTable")) {
                  $scope.requiredTable(modObj.ensembleTable, crumbs + ".ensembleTable");
                }
                // found distribution table
                if (modObj.hasOwnProperty("distributionTable")) {
                  for (var j = 0; j < modObj.distributionTable.length; j++) {
                    var distObj = modObj.distributionTable[j];
                    $scope.requiredTable(distObj, crumbs + ".distributionTable" + j);
                  } // end for
                } // end dist
              } // end model loop
            } // end if model
          } // end paleoData object loop
        } // end else
      } // end else
  }; // end requiredPaleoChron fn

  // each table must have "filename" and "missingValue"
  // each column must have "number", "tsid", and "variableName"
  $scope.requiredTable = function (t, crumbs) {

    // look for table filename
    var filename = "";
    if (!t.hasOwnProperty("filename")) {
      $scope.logFeedback("err", "Missing data: " + crumbs + ".filename", "filename");
    } else {
      filename = t.filename;
    }

    // look for table missing value
    var missingValue = "";
    if (!t.hasOwnProperty("missingValue")) {
      $scope.logFeedback("err", "Missing data: " + crumbs + ".missingValue", "missingValue");
    } else {
      missingValue = t.missingValue;
    }

    // columns not found
    if (!t.hasOwnProperty("columns")) {
      $scope.logFeedback("err", "Missing data: " + crumbs + ".columns", "columns");
    }
    // columns found
    else if (t.hasOwnProperty("columns")) {

        if (filename) {
          $scope.requiredColumnsCtMatch(filename, t.columns);
        }
        // loop over each column in the table
        for (var i = 0; i < t.columns.length; i++) {
          // loop over each of the required column keys
          for (var k in $scope.keys.reqTableKeys) {
            currKey = $scope.keys.reqTableKeys[k];
            // see if this column has each of the required keys
            if (!t.columns[i].hasOwnProperty(currKey)) {
              // required key is missing, log error
              $scope.logFeedback("err", "Missing data: " + crumbs + ".column" + i + "." + currKey, currKey);
            }
          } // end table keys
        } // end columns loop
      } // end 'if columns exist'
  }; // end requiredTable fn

  // check that column count in a table match the column count in the CSV data
  $scope.requiredColumnsCtMatch = function (filename, columns) {
    var csvCt = $scope.files.csv[filename]["cols"];
    var metaCt = columns.length;
    // edge case: ensemble table that has "two" columns, but actuall column 2 is a list of columns.
    if (csvCt !== metaCt) {
      // column counts don't match. Do we have two columns? Might be an ensemble table
      if (columns.length === 2) {
        // Is column 2 an array of columns? (most likely)
        if (Array.isArray(columns[1]["number"])) {
          // calculate how many columns this array REALLY represents.
          metaCt = columns[1].number.length - 1 + metaCt;
          // Do the column counts match now?
          if (csvCt !== metaCt) {
            // Okay, there is actually an error now. Log it.
            $scope.logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
          }
        }
        // is column 1 an array of column numbers? (less likely)
        else if (Array.isArray(columns[0]["number"])) {
            // calculate how many columns this array REALLY represents.
            metaCt = columns[0].number.length - 1 + metaCt;
            // Do the column counts match now?
            if (csvCt !== metaCt) {
              // Okay, there is actually an error now. Log it.
              $scope.logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
            }
          }
          // We have 2 columns, but neither one represents an array of columns. It's just a coincidence. Normal error.
          else {
              $scope.logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
            }
      }
      // column counts don't match, and this is not an ensemble table. Error
      else {
          $scope.logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
        }
    } // end if colCt dont match
  }; // end requiredColumnsCtMatch fn

  // verify required keys in metadata root level
  $scope.requiredRoot = function (m) {
    // loop through and check for required fields. (lipdVersion, archiveType, paleoMeasurementTable..what else???)
    for (var i = 0; i < $scope.keys.reqRootKeys.length; i++) {
      // Current key
      var key = $scope.keys.reqRootKeys[i];
      // Pub found. Check for required keys.
      if (key === "pub" && m.hasOwnProperty(key)) {
        $scope.requiredPub(m);
      } else if (key === "geo") {
        // Geo found. Check for valid data.
        if (m.hasOwnProperty(key)) {
          $scope.requiredGeo(m);
        }
        // Geo not found. Coordinates are definitely missing, which triggers an error.
        else {
            $scope.logFeedback("err", "Missing data: " + "coordinates", "coordinates");
          }
      }
      // All other required root keys
      else if (!m.hasOwnProperty(key)) {
          // key not found! log the error
          $scope.logFeedback("err", "Missing data: " + key, key);
        }
    }
  };

  // pub is not mandatory, but if pub is present, then it must have the required keys
  $scope.requiredPub = function (m) {
    try {
      // pub not found, log a warning.
      if (!m.hasOwnProperty("pub")) {
        $scope.logFeedback("warn", "No publication data", "pub");
      }
      // pub found, make sure it has the required keys
      else {
          // for each pub in the pub list
          for (var i = 0; i < m.pub.length; i++) {
            var curPub = m.pub[i];
            // loop over required keys, and see if this pub has the key
            for (var k = 0; k < $scope.keys.reqPubKeys.length; k++) {
              var key = $scope.keys.reqPubKeys[k];
              if (!m.pub[i].hasOwnProperty(key)) {
                // this pub is missing a required key!
                $scope.logFeedback("err", "Missing data: " + "pub" + i + key, key);
              }
            }
          }
        }
    } catch (err) {
      $scope.logFeedback("warn", "Encountered problem validating: pub");
    }
  };

  // checks if there is coordinate information needed to plot a map of the location
  $scope.requiredGeo = function (m) {
    try {
      coords = m.geo.geometry.coordinates.length;
      // start building map marker(s)
      if (coords == 2 || coords == 3) {
        // get coordinate values
        // GEOJSON specifies [ LONGITUDE , LATITUDE, ELEVATION (optional)]
        lon = m.geo.geometry.coordinates[0];
        lat = m.geo.geometry.coordinates[1];
        // check if values are in range
        lonValid = $scope.numberInRange(-180, 180, lon);
        latValid = $scope.numberInRange(-90, 90, lat);
        // both values are in the correct ranges
        if (latValid && lonValid) {
          // start making the marker on the map
          $scope.moveMapToMarker(lon, lat);
          $scope.addMapMarker(lon, lat);
        } else {
          // check if longitude is range
          if (!lonValid) {
            $scope.logFeedback("error", "Longitude out of range: Enter value from -180 to 180", "longitude");
          }
          // check if latitude is in range
          if (!latValid) {
            $scope.logFeedback("error", "Latitude out of range: Enter value from -90 to 90", "latitude");
          }
        }
      } else {
        // there aren't any coordinate values to make the map
        $scope.logFeedback("error", "Missing data: " + "geo - coordinates", "coordinates");
      }
    } catch (err) {
      $scope.logFeedback("warn", "Unable to map location", "geo");
      console.log("requiredGeo: " + err);
    }
  };

  // END REQUIRED DATA




  // VERIFY BAGIT

  // verify the 4 bagit files are present, indicating a properly bagged LiPD file.
  $scope.verifyBagit = function (files) {
    var validBagitFiles = ["tagmanifest-md5.txt", "manifest-md5.txt", "bagit.txt", "bag-info.txt"];
    var count = 0;
    var errors = 0;
    angular.forEach(validBagitFiles, function (filename) {
      if (files.hasOwnProperty(filename)) {
        count++;
      } else {
        //
        errors++;
        $scope.logFeedback("err", "Missing bagit file: " + filename);
      }
    });
    // if all 4 bagit files are found, display valid bagit message
    if (count === 4) {
      $scope.logFeedback("pos", "Valid Bagit File", "bagit");
    }
  };

  // END VERIFY BAGIT



  // 4. VERIFY VALID

  // Check for Valid LiPD data. If no errors, then it's valid.
  $scope.verifyValid = function () {
    if ($scope.feedback.missingTsidCt > 1) {
      // Count all TSid errors as one culmulative error
      // $scope.feedback.errCt++;
      // Count all TSid errors as a single error
      $scope.feedback.errCt++;
      $scope.feedback.errMsgs.push("Missing data: TSid from " + $scope.feedback.missingTsidCt + " columns.");
    }
    if (!$scope.pageMeta.valid) {
      if ($scope.feedback.errCt === 0) {
        $scope.pageMeta.valid = true;
      }
    }
  };

  // END VERIFY VALID




  // CREATE SIMPLE VIEW

  // Create the "Simple View" data. Copy the "Advanced View" data, and remove what's not necessary.
  $scope.advancedToSimple = function (d) {
    // remove items from root
    d = $scope.rmAdvKeys(d, false);

    // Geo: instead of removing items, just grab the one item that we do want.
    if (d.hasOwnProperty("geo")) {
      try {
        coords = d["geo"]["geometry"]["coordinates"];
        d["geo"] = { "geometry": { 'coordinates': coords } };
      } catch (err) {
        // no coordinates or no geo found
      }
    }

    // Pub: remove items from publication
    d = $scope.rmAdvKeys(d, false);

    // loop for each section
    pc = ["paleo", "chron"];
    for (var _i3 = 0; _i3 < pc.length; _i3++) {
      var pcData = pc[_i3] + "Data";
      var meas = pc[_i3] + "MeasurementTable";
      var mod = pc[_i3] + "Model";
      if (d.hasOwnProperty(pcData)) {
        for (var _k2 = 0; _k2 < d[pcData].length; _k2++) {
          if (d[pcData][_k2].hasOwnProperty(meas)) {
            var table = d[pcData][_k2][meas];
            for (var _j = 0; _j < table.length; _j++) {
              // remove items from table
              table[_j] = $scope.rmAdvKeys(table[_j], true);
            }
          }
          if (d[pcData][_k2].hasOwnProperty(mod)) {
            var table = d[pcData][_k2][mod];
            for (var _j2 = 0; _j2 < table.length; _j2++) {
              if (table[_j2].hasOwnProperty("summaryTable")) {
                // remove items from table
                table[_j2]["summaryTable"] = $scope.rmAdvKeys(table[_j2]["summaryTable"], true);
              }
              if (table[_j2].hasOwnProperty("ensembleTable")) {
                // remove items from table
                table[_j2]["ensembleTable"] = $scope.rmAdvKeys(table[_j2]["ensembleTable"], true);
              }
              if (table[_j2].hasOwnProperty("distributionTable")) {
                table2 = table[_j2]["distributionTable"];
                for (var p = 0; p < table[_j2]["distributionTable"].length; p++) {
                  // remove items from table
                  table2[p] = $scope.rmAdvKeys(table[_j2]["distributionTable"][p], true);
                }
              }
            }
          }
        }
      }
    }
    $scope.files.jsonSimple = d;
  }; // end fn

  // Use "simpleViewRm" list to remove all unnecessary Advanced View items.
  $scope.rmAdvKeys = function (d, isTable) {
    try {
      // get all keys in this object
      var keys = Object.keys(d);
      // make all keys case-insensitive
      for (var _i = 0; _i < keys.length; _i++) {
        var key = keys[_i];
        var keyLow = key.toLowerCase();
        // look for an exact match inside advKeys
        if ($scope.keys.advKeys.indexOf(keyLow) > 0) {
          delete d[key];
        }
        // look for a substring match inside each advKey entry
        else {
            for (var _k = 0; _k < $scope.keys.advKeys.length; _k++) {
              if ($scope.keys.advKeys[_k].indexOf(keyLow) > 0) {
                delete d[key];
                break;
              }
            }
          }
      }
      // if this is a table, then check the columns too.
      if (isTable) {
        if (d.hasOwnProperty("columns")) {
          for (var _i2 = 0; _i2 < d["columns"].length; _i2++) {
            $scope.rmAdvKeys(d["columns"][_i2], false);
          }
        }
      }
    } catch (err) {
      console.log("rmAdvKeys: " + err);
    }
    return d;
  };

  // END CREATE SIMPLE VIEW




  // GOOGLE MAP

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
    streetViewControl: false
  };

  $scope.moveMapToMarker = function (lon, lat) {
    $scope.map.center = { "latitude": lat, "longitude": lon };
    $scope.map.zoom = 6;
  };

  // Add another set of coordinates to the map
  $scope.addMapMarker = function (lon, lat) {
    // geoMarker IDs are sequential
    var newID = $scope.geoMarkers.length + 1;
    // push the marker and it's default options to the array of geoMarkers
    $scope.geoMarkers.push({
      id: newID,
      longitude: lon,
      latitude: lat,
      options: {
        draggable: true
      },
      events: {
        dragend: function dragend(marker, eventName, args) {
          $scope.geoMarkers.options = {
            draggable: true,
            labelContent: "lat: " + lat + ' ' + 'lon: ' + lon,
            labelAnchor: "100 0",
            labelClass: "marker-labels"
          };
        }
      }
    });
  };

  // END GOOGLE MAP


  // UPLOAD TO NODE

  // Upload VALIDATED lipd data to backend
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

  // END UPLOAD

  // DOWNLOAD FROM NODE

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

  // END DOWNLOAD


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

            // function that splits jsonld and csv entries into different scope variables
            function splitValidate(objs) {
              console.log("splitValidate");
              $scope.allFiles = objs;
              $scope.files.fileCt = objs.length;
              // loop over each csv/jsonld object. sort them into the scope by file type
              angular.forEach(objs, function (obj) {
                if (obj.type === "json") {
                  $scope.files.dataSetName = obj.filenameFull.split("/")[0];
                  $scope.files.lipdFilename = obj.filenameFull.split("/")[0] + ".lpd";
                  $scope.files.json = obj.data;
                } else if (obj.type === "csv") {
                  $scope.files.csv[obj.filenameShort] = obj.data;
                } else if (obj.type === "bagit") {
                  $scope.files.bagit[obj.filenameShort] = obj;
                } else {
                  console.log("Not sure what to do with this file: " + obj.filenameFull);
                }
              });
              // start validation
              $scope.validate();
            }

            // split the data, and then callback to start validation.
            splitValidate(res);
          }); // end ImportService

        }); // end model.getEntries
        // once the change even has triggered, it cannot be triggered again until page refreshes.
      }, false); // end upload event listener

    })();
  })(this);
  }]);

  // END ANONYMOUS FUNCTIONS
