var f = angular.module('ngForm', ['uiGmapgoogle-maps', 'json-tree', 'ngFileUpload']);

// Google Maps API key to allow us to embed the map
f.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        // key: 'AIzaSyB8nllB0zwraQo5qJMGdtcxulsTPJOnd8U',
        key: "AIzaSyA7HRzSi5HhyKTX9Xw7CZ-9XScwq04TZyc",
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

// Parse service for unpacking and sorting LiPD file data
f.factory("CompileService", function($q){

  // parse the csv metadata and return an object
  var setCsvMeta = function(dat, filename){
    // parse the data using Papa module
    var s = Papa.parse(dat);
    // set fields of interest for later validation
    s["rows"]  = s.data.length;
    s["cols"] = s.data[0].length;
    s["delimiter"] = s.meta.delimiter;
    // set the filename, but split and pop so we dont get full file path
    s["filename"] = filename.split("/").pop();
    return s;
  }

  // get the text from the ZipJs entry object. Parse JSON as-is and pass CSV to next step.
  var getText = function(entry){
    var d = $q.defer();
    var filename = entry.filename;
    entry.getData(new zip.TextWriter(), function(text) {
      try{
        // blindly attempt to parse as jsonld file
        d.resolve(JSON.parse(text));
      } catch(err){
        // if parsing jsonld file fails, that's because it's a csv file. So parse as csv instead.
        d.resolve(setCsvMeta(text, filename));
      }
      });
    return d.promise;
  }

  // parse array of ZipJS entry objects into usable objects with more relevant information added.
  var parseFiles = function(entries){
    console.log("parsing data in factory");
    var d = $q.defer();
    // array of promises
    var promises = [];
    try{
      // loop for each entry object in the array
      angular.forEach(entries, function(entry){
        // if the object isn't empty
        if(entry){
          // if the entry represents a csv or jsonld file, keep going. If it's a bagit manifest file, skip over it.
          if(entry.filename.indexOf(".csv") >= 0 || entry.filename.indexOf(".jsonld") >= 0){
            // push the promise to the master list
            promises.push(getText(entry));
          }
        }
      });
      // return when all promises are filled
      return $q.all(promises);
    }catch(err){
      console.log(err);
    }
  }
  return {
    parseFiles : parseFiles
    }
});


// Controller for the Upload form
f.controller('FormCtrl', ['$scope', '$log', '$timeout', '$q', '$http', 'Upload', "CompileService",
function($scope, $log, $timeout, $q, $http, Upload, CompileService){

    // User data holds all the user selected or imported data
    $scope.json = {
      "metadata":{
          "lipdVersion": 1.2,
          "archiveType": "",
          "dataSetName": "",
          "funding": [
            {"agencyName": "", "grant": ""}
          ],
          "pub": [
            {"identifier":[
              {"type": "doi",
              "id":"",
              "url":""}]}
          ],
          "geo": {"geometry":{"coordinates":[0,0,0]}},
          "chronData": {
            "chronMeasurementTable": {},
            "chronModel":[
              {"method": {},
              "ensembleTable":{},
              "summaryTable": {},
              "distributionTable": []
            }]},
          "paleoData": {
            "paleoMeasurementTable": {},
            "paleoModel":[
              {"method": {},
              "ensembleTable":{},
              "summaryTable": {},
              "distributionTable": []
            }]}
          },
      "simple":{

      }
    }
    $scope.pageMeta = {
      "toggle": "",
      "simpleView": false,
      "simpleViewRm": ["@context", "tsid", "number", "google", "md5", "lipdversion", "investigator"],
      "valid": false,
      "filePicker": false
    }
    // track all csvs by filename, and the # of columns in the file
    $scope.csvFiles = {};

    // NOTE: to do case insensitve key checking, you'd have to loop over every field. You cannot use "hasOwnProperty"

    $scope.tmp = {
      "lowKeys": [],
      "miscKeys": ["studyname", "proxy", "metadatamd5",
                  "googlespreadsheetkey", "googlemetadataworksheet",
                  "@context", "tagmd5", "datasetname"],
      "reqRootKeys": ["archiveType", "dataSetName", "paleoData", "geo"],
      "reqPubKeys": ["author", "title", "year", "journal"],
      "reqTableKeys": ["number", "variableName", "TSid"],
      "optionalKeys": [""]
    }
    $scope.feedback = {
      "posMsgs": [],
      "errCt": 0,
      "errMsgs": [],
      "wrnCt":0,
      "wrnMsgs": [],
      "dataCanDo": [],
    }
    $scope.geoMarkers = [];

  // MISC

    // get and set all the CSV metadata in the scope
    $scope.getCsvMetadata = function(){

    }

    // filter metadata for simple view. Recursive function that removes keys that match a predefined set in "simpleViewRm"
    $scope.advancedToSimpleView = function(x){
      if(Array.isArray(x)){
        console.log("array");
        for(i=0; i<x.length; i++){
          x[i] = $scope.advancedToSimpleView(x[i]);
        }
      }
      else if(typeof(x) === "object"){
        console.log("object");
        // stay safe: default to keeping the key
        var rmKey = false;
        for(key in x){
          console.log(key);
          // check if this key is a keeper
          rmKey = $scope.isSimpleKey(key);
          if(rmKey){
            // key is not a keeper. remove it.
            delete x[key]
          } else {
            // this is a keeper key, so dive down with the value
            x[key] = $scope.advancedToSimpleView(x[key]);
          }
        }
      }
      console.log(x)
      console.log("end of function");
      return(x)
    } // end fn

    // determine whether a key should be removed for the simple view
    $scope.isSimpleKey = function(key){
      // default to keeping the key.
      var rmKey = false;
      try{
        // base case: this is a string, so check if it needs to be removed.
        if(typeof(key) === "string"){
          // exact match: if the key is in the 'remove' array, then remove it.
          if($scope.pageMeta.simpleViewRm.indexOf(key.toLowerCase()) !== -1){
            // bad key
            rmKey = true;
          } else {
            // substring match: for each item in the 'remove' array
            for(i=0; i<$scope.pageMeta.simpleViewRm.length; i++){
              // if the word in the 'remove' array is a substring of the current key, remove it.
              if($scope.pageMeta.simpleViewRm[i].indexOf(key.toLowerCase()) !== -1){
                // bad key
                rmKey = true;
              }
            }
          }
        }
      } catch(err) {
      }
      return(rmKey);
    }

    // error logger. add to count and log message to user.
    $scope.logFeedback = function(errType, msg, key){
      if(errType === "warn"){
        $scope.feedback.wrnCt++;
        $scope.feedback.wrnMsgs.push(msg);
      } else if (errType === "err"){
        $scope.feedback.errCt++;
        $scope.feedback.errMsgs.push(msg);
      } else if (errType === "pos"){
        $scope.feedback.posMsgs.push(msg);
      }
    }

    // WATCHERS

    // watch for updated metadata information, then display the changes in the pre/code box (if it's being shown)
    $scope.$watch("json", function(){
      var mp = document.getElementById("metaPretty");
      if (mp){ mp.innerHTML = JSON.stringify($scope.json.metadata, undefined, 2);}
      var c = document.getElementById("csvPretty");
      if (c){ c.innerHTML = JSON.stringify($scope.csvFiles, undefined, 2);}
    }, true);

    $scope.verifyValid = function(){
      if(!$scope.pageMeta.valid){
        if($scope.feedback.errCt === 0 && $scope.pageMeta.filePicker === true){
          $scope.pageMeta.valid = true;
        }
      }
    }

    // triggers a new validation loop. resets and checks all data again.
    $scope.validate = function(){
      console.log("validating");
      // wipe all page data and start from scratch.
      $scope.tmp.lowKeys = [];
      $scope.geoMarkers = [];
      $scope.pageMeta.valid = false;
      $scope.feedback = {
        "posMsgs": [],
        "errCt": 0,
        "errMsgs": [],
        "wrnCt":0,
        "wrnMsgs": [],
        "dataCanDo": []
      }
      $scope.verifyStructure($scope.json.metadata);
      $scope.verifyRequiredFields($scope.json.metadata);
      $scope.verifyCapabilities($scope.json.metadata);
      $scope.verifyValid();
    }

    $scope.numberInRange = function(start, end, val){
      if(val >= start && val <= end){
        return(true);
      }
      return(false);
    }


  // CAPABILITIES

    // master function. calls all sub routines to see what can be done with the amount of data given
    $scope.verifyCapabilities = function(m){
      // check what data is available
      // This will create the "progress bar" of how complete a data set is.
    }

    // check if there is enough information given to run bchron
    $scope.canYouBchron = function(m){
    }


  // REQUIRED FIELDS


    // master for checking for required fields. call sub-routines.
    $scope.verifyRequiredFields = function(m){

      // call sub-routine checks
      $scope.requiredRoot(m);
      $scope.requiredPub(m);
      $scope.requiredGeo(m);
      $scope.requiredPaleoChron("paleo", m);
      $scope.requiredPaleoChron("chron", m);

    }

    // verify required fields at all levels of paleoData & chronData
    $scope.requiredPaleoChron = function(pc, m){

      // I'll use "paleoData" in comments, but this function applies to paleoData and chronData
      var pdData = pc + "Data";
      var meas = pc + "MeasurementTable";
      var mod = pc + "Model";

      // paleoData not found
      if(!m.hasOwnProperty(pdData)){
        $scope.logFeedback("err", "Missing data: paleoData", "paleoData");
      }
      // paleoData found
      else {
        // for each object in the paleoData list
        for(i=0; i<m[pdData].length; i++){
          // hold table in variable.
          var table = m[pdData][i];
          var crumbs = pdData + i + meas;

          // measurementTable found
          if(table.hasOwnProperty(meas)) {
            for(k=0; k<table[meas].length; k++){
              // hold current meas table object in a variable
              var measObj = table[meas][k];
              var crumbs = pdData + i + meas + k;
              $scope.requiredTable(measObj, crumbs);
            }
          } // end meas

          // paleoMeasurementTable not found, and it's required
          else if(!table.hasOwnProperty(meas) && pc == "paleo"){
            // log error for missing required table
            $scope.logFeedback("err", "Missing data: " + crumbs, meas);
          }
          // paleoModel found
          if(table.hasOwnProperty(mod)){
            for(k=0; k<table[mod].length; k++){
              var modObj = table[mod][k];
              var crumbs = pdData + i + mod + k;
              // found summary table
              if(modObj.hasOwnProperty("summaryTable")){
                $scope.requiredTable(modObj.summaryTable, crumbs + ".summaryTable");
              }
              // found ensemble table
              if(modObj.hasOwnProperty("ensembleTable")){
                $scope.requiredTable(modObj.ensembleTable, crumbs + ".ensembleTable");
              }
              // found distribution table
              if(modObj.hasOwnProperty("distributionTable")){
                for(j=0; j<modObj.distributionTable.length; j++){
                  var distObj = modObj.distributionTable[j];
                  $scope.requiredTable(distObj, crumbs + ".distributionTable" + j);
                }
              }
            }
          }
        }
      }
    }

    // each table must have "filename"
    // each column must have "number", "tsid", and "variableName"
    $scope.requiredTable = function(t, crumbs){

      var filename = "";
      // filename not found
      if(!t.hasOwnProperty("filename")){
        $scope.logFeedback("err", "Missing data: " + crumbs + ".filename", "filename");
      } else {
        filename = t.filename;
      }

      // columns not found
      if(!t.hasOwnProperty("columns")){
        $scope.logFeedback("err", "Missing data: " + crumbs + ".columns", "columns");
      }
      // columns found
      else if(t.hasOwnProperty("columns")){

        if (filename){
          $scope.requiredColumnsCtMatch(filename, t.columns);
        }
        // loop over each column in the table
        for(i=0; i<t.columns.length; i++){
          // loop over each of the required column keys
          for(k in $scope.tmp.reqTableKeys){
            currKey =$scope.tmp.reqTableKeys[k];
            // see if this column has each of the required keys
            if(!t.columns[i].hasOwnProperty(currKey)){
              // required key is missing, log error
              $scope.logFeedback("err", "Missing data: " + crumbs + ".column" + i + "." + currKey, currKey);
            }
          } // end table keys
        } // end columns loop
      } // end 'if columns exist'
    }

    // check that column count in a table match the column count in the CSV data
    $scope.requiredColumnsCtMatch = function(filename, columns){
      var csvCt = $scope.csvFiles[filename]["cols"];
      var metaCt = columns.length;
      if(csvCt !== metaCt){
        $scope.logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
      } else {
        $scope.logFeedback("pos", "Csv and Jsonld columns match: " + filename, filename);
      }

    }

    // verify required keys in metadata root level
    $scope.requiredRoot = function(m){
      // loop through and check for required fields. (lipdVersion, archiveType, paleoMeasurementTable..what else???)
      for (var i = 0; i < $scope.tmp.reqRootKeys.length; i++) {
        // the current key to look for
        var key = $scope.tmp.reqRootKeys[i];
        if(!m.hasOwnProperty(key)){
          // key not found! log the error
          $scope.logFeedback("err", "Missing data: " + key, key);
        }

      }
    }

    // pub is not mandatory, but if pub is present, then it must have the required keys
    $scope.requiredPub = function(m){
      try{
        // pub not found, log a warning.
        if(!m.hasOwnProperty("pub")){
          $scope.logFeedback("err", "No publication data", "pub");
        }
        // pub found, make sure it has the required keys
        else {
          // for each pub in the pub list
          for(i=0; i<m.pub.length; i++){
            var curPub = m.pub[i];
            // loop over required keys, and see if this pub has the key
            for(k=0;k<$scope.tmp.reqPubKeys.length;k++){
              var key = $scope.tmp.reqPubKeys[k];
              if(!m.pub[i].hasOwnProperty(key)){
                // this pub is missing a required key!
                $scope.logFeedback("err", "Missing data: " + "pub"+ i + key, key);
              }
            }
          }
        }
      }catch(err){
        $scope.logFeedback("warn", "Encountered problem validating: pub");
      }
    }

    // checks if there is coordinate information needed to plot a map of the location
    $scope.requiredGeo = function(m){
      try {
        coords = m.geo.geometry.coordinates.length;
        // start building map marker(s)
        if(coords == 2 || coords == 3){
          // get coordinate values
          lat = m.geo.geometry.coordinates[0];
          lon = m.geo.geometry.coordinates[1];
          // check if values are in range
          latValid = $scope.numberInRange(-90, 90, lat);
          lonValid = $scope.numberInRange(-180, 180, lon);
          // both values are in the correct ranges
          if(latValid && lonValid){
            // start making the marker on the map
            $scope.moveMapToMarker(lat, lon);
            $scope.addMapMarker(lat, lon);
          } else {
            // check if longitude is range
            if(!lonValid){
              $scope.logFeedback("error", "Longitude out of range: Enter value from -180 to 180", "longitude");
            }
            // check if latitude is in range
            if(!latValid){
              $scope.logFeedback("error", "Latitude out of range: Enter value from -90 to 90", "latitude");
            }
          }
        } else {
          // there aren't any coordinate values to make the map
          $scope.logFeedback("error", "Missing data: " + "geo - coordinates" , "coordinates");
        }
      } catch(err) {
        $scope.logFeedback("warn", "Unable to map location: encountered an error", "geo");
        console.log("requiredGeo: " + err);
      }
    }

  // VERIFY STRUCTURE

    // master fucntion. call all subroutines to determine if this is a valid lipd structure
    $scope.verifyStructure = function(m){
      // check that data fields are holding the correct value data types
      for(var k in m){
        try{
          var correctType = null;
          lowKey = k.toLowerCase();
          v = m[k];
          $scope.tmp.lowKeys.push(lowKey);
          if(lowKey === "archivetype"){
            correctType = $scope.verifyDataType("string", k, v)
          }
          // Valid LiPD versions: 1.0, 1.1, 1.2
          else if(lowKey === "lipdversion"){
            // check that the value is a number
            v = parseInt(v)
            correctType = $scope.verifyDataType("number", k, v);
            if(correctType){
              if([1.0, 1.1, 1.2].indexOf(v) == -1){
                // LiPD version wasn't valid. Log errors to scope.
                $scope.logFeedback("err", "Invalid LiPD Version: Valid versions are 1.0, 1.1, and 1.2", "lipdVersion");
              } // end if in
            } // end data type check

          }
          // pub must follow BibJSON standards
          else if(lowKey === "pub"){
            $scope.verifyArrObjs(k, v);

          } else if(lowKey === "investigators" || lowKey === "investigator"){
            $scope.verifyArrObjs(k, v);

          } else if(lowKey === "funding"){
            $scope.verifyArrObjs(k, v);

          }
          // geo must follow GeoJSON standards
          else if (lowKey === "geo"){
            $scope.verifyDataType("object", k, v);

          } else if (lowKey == "chrondata"){
            $scope.verifyPaleoChron("chron", k, v)

          } else if (lowKey === "paleodata"){
            $scope.verifyPaleoChron("paleo", k, v)

          } else {
            // anything goes? no rules for these keys
            if($scope.tmp.miscKeys.indexOf(lowKey) === -1){
              $scope.logFeedback("warn", "No rules found for key: " + k, k);
              console.log("verifyStructure: No rules for key: " + k);
            }
          }
        } catch(err){
          console.log("verifyStructure: Caught error parsing: " + k);
        }

      }

    }

    // todo Do I need to verify these for structure????
    // if pub section exists, make sure it matches the bib json standard
    // if geo section exists, make sure it matches the geo json standard



    // check if the data type for a given key matches what we expect for that key
    $scope.verifyDataType = function(dt, k, v){
      try{
        // special case: check for object array.
        if(dt === "array"){
          if(!Array.isArray(v)){
            $scope.logFeedback("err", "Invalid data type for: " + k + ". Expected: " + dt, k);
            return(false);
          }
        } else {
          // expecting specified data type, but didn't get it.
          if(typeof(v) != dt){
            $scope.logFeedback("err", "Invalid data type for: " + k + ". Expected: " + dt, k);
            return(false);
          } // end if
        } // end else
      } catch(err) {
        // caught some other unknown error
        console.log("verifyDataType: Caught error parsing. Expected: " + cdt + ", Given: " + typeof(v));
      } // end catch
      return(true);
    }

    // Check for an Array with objects in it.
    $scope.verifyArrObjs = function(k, v){
      isArr = $scope.verifyDataType("array", k, v);
      if(isArr){
        isObjs = $scope.verifyDataType("object", k, v[0])
        if(isObjs){
          return(true);
        }
      }
      console.log("verifyArrObjs: Invalid data type: expected: obj, given: " + typeof(v[0]));
      return(false);
    }

    // paleoData and chronData use the same structure. Use to verify data types in both.
    $scope.verifyPaleoChron = function(pdData, k, v){
      // check if the root paleoData or chronData is an array with objects.
      var correctTop = $scope.verifyArrObjs(k, v);
      if(correctTop){
        // create table names based on what "mode" we're in. chron or paleo
        var meas = pdData + "MeasurementTable";
        var mod = pdData + "Model";
        // check if measurement table exists
        if(v[0].hasOwnProperty(meas)){
          // check if measurement table is array with objects
          $scope.verifyArrObjs(meas, v[0][meas])
        } // end measurement table
        // check if model table exists
        if(v[0].hasOwnProperty(mod)){
          // check if model table is array with objects
          var correctBottom = $scope.verifyArrObjs(mod, v[0][mod]);
          var modTables = ["summaryTable", "distributionTable", "method", "ensembleTable"];
          if(correctBottom){
            // correct so far, so check if items in model table [0] are correct types
            for(i=0; i<modTables.length; i++){
              table = modTables[i];
              if(table === "distributionTable" && v[0][mod][0].hasOwnProperty(table)){
                $scope.verifyArrObjs(table, v[0][mod][0][table])
              } else {
                $scope.verifyDataType("object", table, v[0][mod][0][table])
              }
            } // end model table inner
          } // end correctBottom
        } // end has model table
      } // end correctTop
    } // end verify



  // MAPPING

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

    $scope.moveMapToMarker = function(lat, lon){
      $scope.map.center = {"latitude": lat, "longitude": lon};
      $scope.map.zoom = 2;
    }

    // Add another set of coordinates to the map
    $scope.addMapMarker = function(lat, lon) {
        // geoMarker IDs are sequential
        var newID = $scope.geoMarkers.length + 1;
        // push the marker and it's default options to the array of geoMarkers
        $scope.geoMarkers.push({
            id: newID,
            longitude: lat,
            latitude: lon,
            options: {
                draggable: true
            },
            events: {
                dragend: function(marker, eventName, args) {
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
        URL = window.webkitURL || obj.mozURL || obj.URL

        return {
          getEntries : function(file, onend) {
            zip.createReader(new zip.BlobReader(file), function(zipReader) {
              zipReader.getEntries(onend);
            }, onerror);
          }, // end getEntries
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
          }, // end getEntryFile
          getEntryFileData : function(entry, creationMethod, onend, onprogress) {
            var writer, zipFileEntry;

            function getData() {
              entry.getData(writer, function(blob) {
                var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
                onend(blobURL);
              }, onprogress);
            } // end getData

            if (creationMethod == "Blob") {
              writer = new zip.BlobWriter();
              return getData();
            } else {
              createTempFile(function(fileEntry) {
                zipFileEntry = fileEntry;
                writer = new zip.FileWriter(zipFileEntry);
                 onend(getData());
              });
            } // end else
          } // end getEntryFileData
        }; // end return
      })(); // end var model

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

    // Create all download links upfront. Don't wait for user click-event. Just make them.
    function createLinks(entry, li, a) {
      model.getEntryFileData(entry, creationMethodInput.value, function(blobURL) {
        if (unzipProgress.parentNode)
          unzipProgress.parentNode.removeChild(unzipProgress);
        unzipProgress.value = 0;
        unzipProgress.max = 0;
        a.href = blobURL;
        a.download = entry.filename;
      }, function() {
      });
    } // end createLinks

    if (typeof requestFileSystem == "undefined")
      creationMethodInput.options.length = 1;

    // When a file is chosen for upload, trigger the change event
    fileInput.addEventListener('change', function() {
      // disable the file input after a file has been chosen.
      fileInput.disabled = true;
      // get a list of file entries inside this zip
      model.getEntries(fileInput.files[0], function(entries) {
        fileList.innerHTML = "";
        var deferred = $q.defer();

        // use the service to parse data from the ZipJS entries
        CompileService.parseFiles(entries)
          .then(function(res){
            console.log("got raw data");

            // function that splits jsonld and csv entries into different scope variables
            function splitValidate(objs){
              // loop over each csv/jsonld object
              angular.forEach(objs, function(obj){
                // this is a jsonld object
                if(obj.hasOwnProperty("archiveType") || obj.hasOwnProperty("dataSetName") || obj.hasOwnProperty("paleoData")){
                  try{
                    $scope.json.metadata = obj
                  }catch(err){
                    console.log("Jsonld object couldn't be set to $scope.");
                  }
                }
                // this is a csv object
                else if (obj.hasOwnProperty("rows") || obj.hasOwnProperty("cols") || obj.hasOwnProperty("delimiter")){
                  try{
                    if(obj.filename){
                      $scope.csvFiles[obj.filename] = obj
                    } else {
                      console.log("Csv file is missing filename");
                    }
                  }catch(err){
                    console.log("Csv object couldn't be set to $scope.");
                  }
                }
              });
              $scope.validate();
            }

            // set the raw data into the scope.
            $scope.rawData = res;
            // split the data, and then callback to start validation.
            splitValidate(res);
        });

        // loop for each file in the zip
        entries.forEach(function(entry) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          // display the name of the file in the page
          a.textContent = entry.filename;
          // defaults link to nothing until click even is activated.
          a.href = "#";
          createLinks(entry, li, a);
          // when user clicks on file name in list, then trigger download file
          a.addEventListener("click", function(event) {
            // if click even activated, and file has not been downloaded yet, then go get data, create download link, and download
            if (!a.download) {
              download(entry, li, a);
              event.preventDefault();
              return false;
            }
            // if file was already downloaded, then the download will just start on a link click anyways
          }, false);

          // replace 'a'  tag with our new modified 'a' tag
          li.appendChild(a);
          // replace 'li' tag with new modified 'li' tag
          fileList.appendChild(li);
        }); // end for each file loop


      });
      // once the change even has triggered, it cannot be triggered again until page refreshes.
    }, false);
  })();

})(this);
}]);
