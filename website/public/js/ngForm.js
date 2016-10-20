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

// Controller for the Upload form
f.controller('FormCtrl',['$scope', 'Upload', '$timeout', '$q', '$http',
function($scope, $log, $timeout, $default, Upload, $q, $http) {

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
      "simpleView": true,
      "simpleViewRm": ["@context", "tsid", "number", "google", "md5", "lipdversion", "investigator"],
      "valid": false,
      "filePicker": false
    }
    $scope.tmp = {
      "lowKeys": [],
      "otherKnownKeys": ["studyname", "proxy", "metadatamd5", "googlespreadsheetkey", "googlemetadataworksheet",
      "@context", "tagmd5", "datasetname"],
      "rootRequired": ["archiveType", "lipdVersion", "dataSetName", "paleoData", "geo", "pub"],
      "geoRequired": ["coordinates"],
      "pubRequired": ["author", "title", "pubYear", "journal"],
      "optionalKeys": [""]
    }
    $scope.feedback = {
      "errCt": 0,
      "errMsgs": [],
      "wrnCt":0,
      "wrnMsgs": [],
      "dataCanDo": [],
    }
    $scope.geoMarkers = [];

  // MISC

    $scope.verifyBibJson = function(){
      // if pub section exists, make sure it matches the bib json standard
    }

    $scope.verifyGeoJson = function(){
      // if geo section exists, make sure it matches the geo json standard

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
    $scope.logError = function(errType, msg, key){
      if(errType === "warn"){
        $scope.feedback.wrnCt++;
        $scope.feedback.wrnMsgs.push(msg)
      } else if (errType === "err"){
        $scope.feedback.errCt++;
        $scope.feedback.errMsgs.push(msg)
      }
    }



    // WATCHERS

    // watch for updated metadata information, then display the changes in the pre/code box (if it's being shown)
    $scope.$watch("json", function(){
      var mp = document.getElementById("metaPretty");
      if (mp){ mp.innerHTML = JSON.stringify($scope.json.metadata, undefined, 2);}
    }, true);

    $scope.verifyValid = function(){
      if(!$scope.pageMeta.valid){
        if($scope.feedback.errCt === 0 && $scope.pageMeta.filePicker === true){
          $scope.pageMeta.valid = true;
        }
      }
    }

    // triggers a new validation loop. resets and checks all data again.
    $scope.validate = function(m){
      console.log("validating");
      // wipe all page data and start from scratch.
      $scope.tmp.lowKeys = [];
      $scope.geoMarkers = [];
      $scope.pageMeta.valid = false;
      $scope.feedback = {
        "errCt": 0,
        "errMsgs": [],
        "wrnCt":0,
        "wrnMsgs": [],
        "dataCanDo": []
      }
      $scope.verifyStructure(m);
      $scope.verifyRequiredFields(m);
      $scope.verifyCapabilities(m);
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
      $scope.canYouMap(m);
    }

    // checks if there is coordinate information needed to plot a map of the location
    $scope.canYouMap = function(m){
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
              $scope.logError("warn", "Longitude out of range: Enter value from -180 to 180", "longitude");
            }
            // check if latitude is in range
            if(!latValid){
              $scope.logError("warn", "Latitude out of range: Enter value from -90 to 90", "latitude");
            }
          }
        } else {
          // there aren't any coordinate values to make the map
          $scope.logError("warn", "Unable to map location: No coordinates given", "geo");
        }
      } catch(err) {
        $scope.logError("warn", "Unable to map location: encountered an error", "geo");
        console.log("canYouMap: " + err);
      }
    }

    // check if there is enough information given to run bchron
    $scope.canYouBchron = function(m){
    }


  // REQUIRED FIELDS

    $scope.verifyRequiredFields = function(m){
      // loop through and check for required fields. (lipdVersion, archiveType, paleoMeasurementTable..what else???)
      for (var i = 0; i < $scope.tmp.rootRequired.length; i++) {
        k = $scope.tmp.rootRequired[i];
        if($scope.tmp.lowKeys.indexOf(k.toLowerCase()) == -1){
          $scope.logError("err", "Missing required data: " + k);
        }
      }
      // check for nested items
      try{
        pmt = m.paleoData[0].paleoMeasurementTable[0];
        if(pmt === null){
          $scope.logError("err", "Missing required data: paleoMeasurementTable");
        }
      } catch(err) {
        console.log("verifyRequiredFields: Error trying to get paleoMeasurementTable");
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

          } else if(lowKey === "lipdversion"){
            // check that the value is a number
            v = parseInt(v)
            correctType = $scope.verifyDataType("number", k, v);
            if(correctType){
              // Valid LiPD versions: 1.0, 1.1, 1.2
              if([1.0, 1.1, 1.2].indexOf(v) == -1){
                // LiPD version wasn't valid. Log errors to scope.
                $scope.logError("err", "Invalid LiPD Version: Valid versions are 1.0, 1.1, and 1.2", "lipdVersion");
              } // end if in
            } // end data type check

          } else if(lowKey === "pub"){
            $scope.verifyArrObjs(k, v);

          } else if(lowKey === "investigators" || lowKey === "investigator"){
            $scope.verifyArrObjs(k, v);

          } else if(lowKey === "funding"){
            $scope.verifyArrObjs(k, v);

          } else if (lowKey === "geo"){
            $scope.verifyDataType("object", k, v);

          } else if (lowKey == "chrondata"){
            $scope.verifyPaleoChron("chron", k, v)

          } else if (lowKey === "paleodata"){
            $scope.verifyPaleoChron("paleo", k, v)

          } else {
            // anything goes? no rules for these keys
            if($scope.tmp.otherKnownKeys.indexOf(lowKey) === -1){
              $scope.logError("warn", "No rules found for key: " + k, k);
              console.log("verifyStructure: No rules for key: " + k);
            }
          }
        } catch(err){
          console.log("verifyStructure: Caught error parsing: " + k);
        }

      }

    }

    // check if the data type for a given key matches what we expect for that key
    $scope.verifyDataType = function(dt, k, v){
      try{
        // special case: check for object array.
        if(dt === "array"){
          if(!Array.isArray(v)){
            $scope.logError("err", "Invalid data type for: " + k + ". Expected: " + dt, k);
            return(false);
          }
        } else {
          // expecting specified data type, but didn't get it.
          if(typeof(v) != dt){
            $scope.logError("err", "Invalid data type for: " + k + ". Expected: " + dt, k);
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
    $scope.verifyPaleoChron = function(pc, k, v){
      // check if the root paleoData or chronData is an array with objects.
      var correctTop = $scope.verifyArrObjs(k, v);
      if(correctTop){
        // create table names based on what "mode" we're in. chron or paleo
        var meas = pc + "MeasurementTable";
        var mod = pc + "Model";
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
                // boolean to know that the user chose a file to upload
                $scope.pageMeta.filePicker = true;
                // set the raw json to a scope variable
                $scope.json.metadata = JSON.parse(text);
                // start validation on the json that we got
                $scope.validate(JSON.parse(text));
                // create a 'simple view' version of the json metadata. remove keys that aren't vital/needed
                // $scope.json.simple = $scope.advancedToSimpleView(JSON.parse(text));
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
