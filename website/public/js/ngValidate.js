// 'use strict';

// var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
//   return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
// } : function (obj) {
//   return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
// };

// deprecated : cgBusy, "vcRecaptcha"
var f = angular.module('ngValidate', ['uiGmapgoogle-maps', 'json-tree', 'ngFileUpload', "ngMaterial", "ui.bootstrap", "cgBusy", "toaster"]);


f.value('cgBusyDefaults',{
  message:'Please wait...',
  backdrop: true,
  minDuration: 0,
  templateUrl: "loading",
});

f.directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeHandler = scope.$eval(attrs.customOnChange);
      element.on('change', onChangeHandler);
      element.on('$destroy', function() {
        element.off();
      });
    }
  };
});

// Google Maps API key to allow us to embed the map
f.config(function (uiGmapGoogleMapApiProvider, $mdThemingProvider, $mdAriaProvider) {
  // $mdThemingProvider.theme('dark-grey').backgroundPalette('grey').dark();
  uiGmapGoogleMapApiProvider.configure({
    // key: 'AIzaSyB8nllB0zwraQo5qJMGdtcxulsTPJOnd8U',
    key: "AIzaSyA7HRzSi5HhyKTX9Xw7CZ-9XScwq04TZyc",
    v: '3.20',
    libraries: 'weather,geometry,visualization'
  });
  $mdAriaProvider.disableWarnings();


});

// IMPORT SERVICE
// Parse service for unpacking and sorting LiPD file data
f.factory("ImportService", ["$q", function ($q) {

  // parse the csv metadata and return an object
  var setCsvMeta = function setCsvMeta(dat) {
    // parse the data using Papa module
    var x = Papa.parse(dat);
    // set fields of interest for later validation
    x = misc.putCsvMeta(x);
    return x;
  };

  var compilePromise = function compilePromise(entry, dat, type) {
    console.log("parsing: " + entry.filename.split("/").pop());
    // var d = $q.defer();
    var x = {};
    x.type = type;
    x.filenameFull = entry.filename;
    x.filenameShort = entry.filename.split("/").pop();
    x.data = dat;
    x.pretty = JSON.stringify(dat, undefined, 2);
    return x;
  };

  // get the text from the ZipJs entry object. Parse JSON as-is and pass CSV to next step.
  var getText = function getText(entry, type) {
    var d = $q.defer();

    // Case for JSON data. Need exception because we validate the JSON with JSONLint
    // It is no longer a zip.TextWriter object like the other entries.
    if(entry.hasOwnProperty("type")){
      d.resolve(compilePromise(entry, entry.data, entry.type));
    }
    // For all other normal cases.
    else {
        // var filename = entry.filename;
        entry.getData(new zip.TextWriter(), function (text) {
            if (type === "bagit") {
                d.resolve(compilePromise(entry, text, type));
            } else if (type === "json") {
              d.resolve();
            } else if (type === "csv") {
                // if parsing jsonld file fails, that's because it's a csv file. So parse as csv instead.
                d.resolve(compilePromise(entry, setCsvMeta(text), type));
            }
        });
    }

    return d.promise;
  };

  // parse array of ZipJS entry objects into usable objects with more relevant information added.
  var parseFiles = function parseFiles(entries) {
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
    var _t = {};
    _t[filename] = dat;
    d.resolve(_t);
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
        csvContent += dataString + "\n";
    });
    return(csvContent);
  }; // end prepCsvEntry

  // parse array of ZipJS entry objects into usable objects with more relevant information added.
  var prepZip = function prepZip(dat) {
    console.log("prepZip");
    return(dat);
  };

  return {
    prepZip: prepZip,
    prepForDownload: prepForDownload,
    prepCsvEntry: prepCsvEntry
  };
}]);
