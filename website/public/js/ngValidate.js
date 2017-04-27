// 'use strict';

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

// deprecated : cgBusy
var f = angular.module('ngValidate', ['uiGmapgoogle-maps', 'json-tree', 'ngFileUpload', "ngMaterial", "vcRecaptcha", "ui.bootstrap"]);

// Google Maps API key to allow us to embed the map
f.config(function (uiGmapGoogleMapApiProvider, $mdThemingProvider) {
  // $mdThemingProvider.theme('dark-grey').backgroundPalette('grey').dark();
  uiGmapGoogleMapApiProvider.configure({
    // key: 'AIzaSyB8nllB0zwraQo5qJMGdtcxulsTPJOnd8U',
    key: "AIzaSyA7HRzSi5HhyKTX9Xw7CZ-9XScwq04TZyc",
    v: '3.20',
    libraries: 'weather,geometry,visualization'
  });
});

f.directive('formatValues', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope:{
      value:'=ngModel',
      model: "="
    },
    link: function (scope, element, attrs, ngModel) {
      //format text going to user (model to view)
      ngModel.$formatters.push(function(value) {
        // console.log(value);
        var _str = "";
        // if the array is longer than 5 values, then take snippets from beginning and end of array (common)
        if(value.length > 5){
          for(var _i=0; _i<5;_i++){
            if (_i === 3){
              _str += "...   " + value[value.length-2];
            } else if (_i === 4){
              _str += ",   " + value[value.length-1];
            } else {
              _str += value[_i] + ",   ";
            }
          }
        // if array is less than 5 values, then display the whole thing. no truncation.
        } else {
          for(var _w=0; _w<value.length;_w++){
            _str += value[_w];
            if (_w !== value.length-1){
              _str += ",   ";
            }
          }
        }
      return _str;
      });
    }
  };
});

f.directive("spaceValues", function(){
  return {
    restrict: 'A',
    require: 'ngModel',
    scope:{
      value:'=ngModel',
      model: "="
    },
    link: function (scope, element, attrs, ngModel) {
      //format text going to user (model to view)
      ngModel.$formatters.push(function(value) {
        // console.log(value);
        var _str = "";
        for(var _i=0; _i<value.length;_i++){
          _str += value[_i] + ",  ";
        }
      return _str;
      });
    }
  };
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
        try{
          var _json_parsed = JSON.parse(text);
          d.resolve(compilePromise(entry, _json_parsed, type));
        } catch(err){
          d.reject("JSONLD file could not be parsed");
        }
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
f.controller('ValidateCtrl', ['$scope', '$log', '$timeout', '$q', '$http', 'Upload', "ImportService", "ExportService", "$mdDialog",
                    function ($scope, $log, $timeout, $q, $http, Upload, ImportService, ExportService, $mdDialog) {
  var vc = this;
  vc.properties = {
      item : null,
      search : null,
      properties: vc.properties || [],
      list : [
        // physical sample
        // calibration
        // climate interpretation
        // {"view": "Climate Interpretation", "name": "climateInterpretation", "checked": false},
        {"view": "Basis", "name": "basis", "checked": false},
        {"view": "Proxy", "name": "proxy", "checked": false},
        {"view": "Material", "name": "material", "checked": false},
        {"view": "Method", "name": "method", "checked": false},
        {"view": "Seasonality", "name": "seasonality", "checked": false},
        {"view": "Data Type", "name": "dataType", "checked": false},
        {"view": "UseInGlobalTemperatureAnalysis", "name": "useInGlobalTemperatureAnalysis", "checked": false},

        {"view": "Sensor Species", "name": "sensorSpecies", "checked": false},
        {"view": "Sensor Genus", "name": "sensorGenus", "checked": false},
        {"view": "Variable Type", "name": "variableType", "checked": false},
        {"view": "Proxy Observation Type", "name": "proxyObservationType", "checked": false},
        {"view": "Inferred Variable Type", "name": "inferredVariableType", "checked": false},
        {"view": "Notes", "name": "notes", "checked": false},
      ]
  };
  $scope._myPromiseImport = null;
  $scope._myPromiseExport = null;
  $scope.dropdowns = {
    "current": {
      "table": { id: 1, name: 'measurement' },
      "delimiter": { id: 1, name: "\t", view: "Tab ( \\t )"},
    },
    "tables": [
      { id: 1, name: 'measurement' },
      { id: 2, name: 'summary' },
      { id: 3, name: 'ensemble' },
      { id: 4, name: "distribution"}
    ],
    "delimiters": [
      { id: 1, name: "\t", view: "Tab ( \\t )"},
      { id: 2, name: ",", view: "Comma ( , )"},
      { id: 3, name: ";", view: "Semi-colon ( ; )" },
      { id: 4, name: "|", view: "Pipe ( | )"},
      { id: 5, name: " ", view: "Space"},
    ],
    "archiveType": create.archiveTypeList(),
    "countries" : map.getCountries(),
  };
  $scope.fields = [
    "basis", "proxy", "material", "method", "seasonality", "dataType", "useInGlobalTemperatureAnalysis", "sensorSpecies", "sensorGenus", "variableType", "proxyObservationType", "inferredVariableType", "notes"
  ];
  $scope.oneAtATime = true;
  // FILES: User data holds all the user's LiPD data
  $scope.files = {
    "lipdFilename": "",
    "dataSetName": "",
    "fileCt": 0,
    "bagit": {},
    "csv": {},
    "jsonSimple": {"lipdVersion": 1.2},
    "json": {"lipdVersion": 1.2, "pub": [], "funding": [], "dataSetName": "", "geo": {},
          "paleoData": [{"paleoMeasurementTable": [{"paleoDataTableName": "", "missingValue": "NaN",
          "filename": "", "columns": []}]}]},
  };
  // PAGEMETA: Data about how to transform the page view based on user input
  $scope.pageMeta = {
    "header": false,
    "fileUploaded": false,
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
  // set google map default window to USA
  $scope.map = {
    "config": {
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
    },
    "markers": []
  };
  // STATUS: PASS/FAIL/OTHER status given by validator response.
  $scope.status = "N/A";
  // ALLFILES: Use this to list all the files found in the LiPD archive. List is shown on page.
  $scope.allFiles = [];

  $scope.clearCustom = function(entry){
    if(entry.tmp.custom){
      $scope.fields.push(entry.tmp.custom);
    }
    entry.tmp[entry.tmp.custom] = true;
    entry.tmp.custom = "";
    return entry;
  };

  $scope.addRmProperty = function(entry, name) {
    entry = create.addRmProperty(entry, name);
    return entry;
  };

  $scope.showProperty = function(name){
    if (["number", "variableName", "units", "toggle", "values", "checked", "tmp"].includes(name)){
      return false;
    }
    return true;
  };

  $scope.toggleCsvBox = function(entry) {
    entry.toggle=!entry.toggle;
  };

  $scope.getSet = function(value){
    $scope.files.dataSetName = value;
    $scope.files.lipdFilename = value + ".lpd";
  };

  $scope.setCountry = function(name){
    if (!$scope.files.json.geo.properties.country){
      $scope.files.json.geo = create.addBlock($scope.files.json.geo, "geo", null);
    }
    $scope.files.json.geo.properties.country = name;
  };

  $scope.resetPage = function(){
    // All metadata and data about the page is emptied when the Upload button is clicked. Ready for another file upload.
    $scope.allFiles = [];
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
    $scope.map = {
      "config": {
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
      },
      "markers": []
    };
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
    // Download button was clicked, show the captcha challenege
    $scope.pageMeta.captcha = true;
  };

  $scope.$watch("files.json", function () {
    // Trigger when json data changes
    // var mp = document.getElementById("metaPretty");
    // if (mp) {
    //   console.log(mp);
    //   mp.innerHTML = JSON.stringify($scope.files.json, undefined, 2);
    // }
    // Create the Simple View
    $scope.files.jsonSimple = misc.advancedToSimple($scope.files.json);
  }, true);

  $scope.uploadZip = function (zip, cb) {
    // Upload *validated* lipd data to backend
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

  $scope.downloadZip = function(){

    // Remove temporary fields from the JSON data
    var _newJson = JSON.parse(JSON.stringify($scope.files));
    _newJson.json = create.rmTmpEmptyData(_newJson.json);
    // Append the DataSetName to the front of all the CSV files.
    var _addDataSetName = create.addDataSetName($scope.files.dataSetName, $scope.files.csv);
    if (_addDataSetName){
      // Add Datasetname to all json and csv filenames.
      _newJson = create.alterFilenames(_newJson);
    }
    // Download the *validated* LiPD file to client's computer
    // use the service to parse data from the ZipJS entries
    $scope._myPromiseExport = ExportService.prepForDownload(_newJson);
    $scope._myPromiseExport.then(function (res) {
      // console.log("ExportService.then()");
      //upload zip to node backend, then callback and download it afterward.
      // console.log("Export response");
      // console.log(res);
      $scope.uploadZip({"filename": $scope.files.lipdFilename, "dat": res}, function(tmp){
        // do get request to trigger download file immediately after download
        // console.log("client side after upload");
        // console.log(tmp.data);
        window.location.href = "http://localhost:3000/files/" + tmp.data;
        // window.location.href = "http://www.lipd.net/files/" + tmp.data;
        // reset the captcha
        $scope.pageMeta.captcha = false;
      });
    });
  };

  $scope.validate = function(){
    // Go through all validations steps, and update scope data.
    var _options = {"fileUploaded": $scope.pageMeta.fileUploaded};
    // console.log($scope.files);
    // rearrange coordinates from dict to array when necessary, and set the map if coordinates exist
    $scope.files = map.fixCoordinates($scope.files);
    $scope.map = map.updateMap($scope.map, $scope.files);

    // start the string of validation events.
    lipdValidator.populateTSids($scope.files, function(_data){
      // console.log("Setting new JSON with TSids.");
      // console.log(_data);
      $scope.files = _data;
      lipdValidator.validate($scope.files, _options, function(_response_2){
        try {
          // console.log("Setting validator response to NG scope");
          $scope.feedback = _response_2.feedback;
          $scope.status = _response_2.status;
        } catch(err) {
          console.log("Error trying to prepare response. Ending request: " + err);
        }
      }); // end validate
    });

  };

  $scope.parseCsv = function(entry, idx, options){
    _csv = null;
    // we can't guarantee a datasetname yet, so build this csv filename as best we can for now.
    var _csvname = options.pc + '0' + options.tt + idx + ".csv";
    // Semi-colon delimiter is checked. Pass this as an argument to PapaParse
    // console.log($scope.dropdowns.current.delimiter.name);
    _csv = Papa.parse(entry.values, {
      "delimiter": $scope.dropdowns.current.delimiter.name
    });

    // add row, column, and transposed metadata to the parsed CSV object.
    _csv = misc.putCsvMeta(_csv);

    // set the transposed data to entry.values. Transposed data is needed so we can display column data properly
    entry.values = _csv.transposed;

    // transpose values so we can store each value array with its column
    entry.filename = _csvname;
    // initialize X amount of columns
    entry.columns = new Array(entry.values.length);
    // start adding each column to the array
    for(var _i=0; _i < entry.values.length; _i++){
      if($scope.pageMeta.header){
        // Header exists, we can set the variableName field as well! VariableName will be the first index
        entry.columns[_i] = {"number": _i + 1, "variableName": entry.values[_i][0], "units": "", "values": entry.values[_i].splice(1, entry.values.length)};
      } else {
        // Headers do not exist. Set values directly
        entry.columns[_i] = {"number": _i + 1, "variableName": "", "units": "", "values": entry.values[_i]};
      }
    }
    // If headers are present, we need to do some extra cleanup
    if ($scope.pageMeta.header){
      // Remove the header row from _csv.data (first array)  and _csv.transposed (first element of each array)
      _csv = misc.removeCsvHeader(_csv);

    }
    // CSV is all finished processing. Set data to scope.
    $scope.files.csv[_csvname] = _csv;
    // console.log($scope.files.csv);
    // console.log(entry);
    return entry;
  };

  $scope.addBlock = function(entry, blockType, pc){
    if (pc === "chron"){
      $scope.files.json = create.addChronData($scope.files.json);
    }
    // Add a block of data to the JSON. (i.e. funding, paleoData table, publication, etc.)
    entry = create.addBlock(entry, blockType, pc);
    console.log(entry);
    return entry;
  };

  $scope.removeBlock = function(entry, idx){
    entry = create.rmBlock(entry, idx);
    return;
  };

  $scope.fetchPublication = function(entry){
    console.log(entry);
    console.log(entry.identifier[0].id);
    var _re = /\b(10[.][0-9]{3,}(?:[.][0-9]+)*\/(?:(?![\"&\'<>,])\S)+)\b/;
    var _match = _re.exec(entry.identifier[0].id);
    console.log(_match);
    if (_match){
      var _url =  "http://dx.doi.org/" + entry.identifier[0].id;
      $http({
        "method": "GET",
        "url": _url,
        "headers": {"accept": "application/rdf+xml;q=0.5, application/citeproc+json;q=1.0"}
      })
        .then(function (response) {
          console.log("DOI Response object");
          console.log(response);
          entry = create.sortDoiResponse(response, entry);
        }, function(response) {
          console.log("Unable to fetch DOI data: ");
          // console.log(response);
          alert("HTTP 404: No data found for that DOI");
        });
    } else {
      alert("DOI entered does not match the DOI format");
    }
    return entry;
  };

  vc.propertiesQuerySearch = function(query) {
        var results = query ? vc.properties.list.filter(createFilterFor(query)) : vc.properties.list.filter(createFilterFor(''));
        return results;
    };

  function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(item) {
          // console.log(item);
          return (angular.lowercase(item.name).indexOf(lowercaseQuery) === 0) ||
              (angular.lowercase(item.name).indexOf(lowercaseQuery) === 0);
      };
    }

  // Anyonymous
  (function (obj) {
    // Set up zip.js object and its corresponding functions
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


    // // Attach to respective DOM elements and set up listener for change event on file-input
    // // When file is uploadesd, it will trigger data to be set to sessionStorage and be parsed.
    (function () {
      var fileInput = document.getElementById("file-input");
      var creationMethodInput = "Blob";
      var downloadButton = document.getElementById("download-btn");
      model.setCreationMethod("Blob");
      // if (typeof requestFileSystem == "undefined") creationMethodInput.options.length = 1;

      fileInput.onclick = function () {
          this.value = null;
      };

      // When a file is chosen for upload, trigger the change event
      fileInput.addEventListener('change', function () {

        // if the upload button is clicked && a file is chosen, THEN reset the page and data.
        $scope.resetPage();

        // get a list of file entries inside this zip
        model.getEntries(fileInput.files[0], function (entries) {
          // use the service to parse data from the ZipJS entries
          $scope._myPromiseImport = ImportService.parseFiles(entries);
          $scope._myPromiseImport.then(function (res) {
            console.log("ImportService.then()");
            // Set response to allFiles so we can list all the filenames found in the LiPD archive.
            $scope.allFiles = res;
            $scope.pageMeta.fileUploaded = true;
            // Gather some metadata about the lipd file, and organize it so it's easier to manage.
            lipdValidator.sortBeforeValidate(res, function(_response_1){
              console.log("sortBeforeValidate callback: sending to validate_ng.js");
              $scope.files = _response_1;
              $scope.validate();
              $scope.files.json = create.initColumnTmp($scope.files.json);
            }); // end sortBeforeValidate
            //RETURNS OBJECT : {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.status};

          }, function(reason){
            $scope.resetPage();
            alert("Error parsing JSON-LD file. File cannot be validated");
          }); // end ImportService

        }); // end model.getEntries
        // once the change even has triggered, it cannot be triggered again until page refreshes.
      }, false); // end upload event listener

    })();
  })(this);
  }]); // end Anonymous
