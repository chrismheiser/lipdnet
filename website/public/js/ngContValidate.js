// Controller - Validate Form
angular.module("ngValidate").controller('ValidateCtrl', ['$scope', '$log', '$timeout', '$q', '$http', 'Upload', "ImportService", "ExportService", "$uibModal","$sce", "toaster",
  function ($scope, $log, $timeout, $q, $http, Upload, ImportService, ExportService, $uibModal, $sce, toaster) {

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
    $scope.lipdPopover = $sce.trustAsHtml(create.getPopover("lipd"));
    $scope.wikiPopover = $sce.trustAsHtml(create.getPopover("wiki"));
    $scope.noaaPopover = $sce.trustAsHtml(create.getPopover("noaa"));
    $scope.dropdowns = {
      "current": {
        "table": { id: 1, name: 'measurement' },
        "delimiter": { id: 1, name: "\t", view: "Tab ( \\t )"},
        "parseMode": {id: 1, name: "new", view: "Start New"},
        "columnField": {id: 4, name: "notes"},
        "dms": {"lat": {id: 1, name: "N"}, "lon": {id: 1, name: "E"}}
      },
      "columnFields": create.fieldsList(),
      "tables": [
        { id: 1, name: 'measurement' },
        { id: 2, name: 'summary' },
        // { id: 3, name: 'ensemble' },
        // { id: 4, name: "distribution"}
      ],
      "delimiters": [
        { id: 1, name: "\t", view: "Tab ( \\t )"},
        { id: 2, name: ",", view: "Comma ( , )"},
        { id: 3, name: ";", view: "Semi-colon ( ; )" },
        { id: 4, name: "|", view: "Pipe ( | )"},
        { id: 5, name: " ", view: "Space"},
      ],
      "parseMode": [
        { id: 1, name: "new", view: "Start New"},
        { id: 2, name: "update", view: "Update Values in All Existing Columns"},
        { id: 3, name: "add", view: "Add New Column(s) to Existing Table" },
      ],
      "dms": {
        "lat": [{id: 1, name: "N"}, {id: 2, name: "S"}],
        "lon": [{id: 1, name: "E"}, {id: 2, name: "W"}]
      },
      "archiveType": create.archiveTypeList(),
      "timeUnit": create.timeUnitList(),
      "years": create.yearList(),
      "createdBy": create.createdByList(),
      "countries" : map.getCountries()
    };
    $scope.fields = create.defaultColumnFields();
    $scope.fieldMetadata = create.fieldMetadataLibrary();
    // Compilation of all LiPD file data
    $scope.files = {
      "modal": {},
      "lipdFilename": "",
      "dataSetName": "",
      "fileCt": 0,
      "bagit": {},
      "csv": {},
      "jsonSimple": {"lipdVersion": 1.3},
      "json": {"lipdVersion": 1.3, "createdBy": "lipd.net", "pub": [], "funding": [], "dataSetName": "", "geo": {
        "geometry": {"coordinates": []}},
        "paleoData": [{"measurementTable": [{"tableName": "paleo0measurement0", "filename": "paleo0measurement0.csv",
          "columns": []}]}]}
    };
    // Metadata about the page view, and manipulations
    $scope.pageMeta = {
      "resetColumnMeta": true,
      "busyPromise": null,
      "header": false,
      "editColumn": false,
      "decimalDegrees": true,
      "fileUploaded": false,
      "toggle": "",
      "simpleView": true,
      "valid": false,
      "filePicker": false,
      "dlFallback": false,
      "dlFallbackMsg": "",
      "oldVersion": "NA",
      "noaaReady": false,
      "wikiReady": false,
      "tourMeta": {},
    };

    // All feedback warnings, errors, and messages received from the validator
    $scope.feedback = {
      "lipdVersion": "NA",
      "missingTsidCt": 0,
      "wrnCt": 0,
      "errCt": 0,
      "validLipd": "NA",
      "validWiki": "NA",
      "validNoaa": "NA",
      "tsidMsgs": [],
      "posMsgs": [],
      "errMsgs": [],
      "wrnMsgs": [],
      "dataCanDo": []
    };
    // Degrees minutes seconds for coordinate conversions
    $scope.dms = {
      "lon": {
        "d": 0,
        "m": 0,
        "s": 0,
        "dir": $scope.dropdowns.current.dms.lon
      },
      "lat":{
        "d": 0,
        "m": 0,
        "s": 0,
        "dir": $scope.dropdowns.current.dms.lat
      }
    };
    // Set google map default view
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
    // All files, w/ contents, found in the LiPD archive. Used in "feedback.jade"
    $scope.allFiles = [];

    $scope.$watch("files.json", function () {
      // Create the Simple View
      $scope.files.jsonSimple = misc.advancedToSimple($scope.files.json);
    }, true);

    $scope.addBlock = function(entry, blockType, pc){
      toaster.pop('success', "Added a new " + blockType + " entry", "", 4000);
      // Need to initialize the first entry of chronData measurement table, when it doesn't yet exist.
      if (pc === "chron" && typeof(entry) === "undefined"){
        $scope.files.json = create.addChronData($scope.files.json, blockType);
        return;
      } else {
        // Add a block of data to the JSON. (i.e. funding, paleoData table, publication, etc.)
        entry = create.addBlock(entry, blockType, pc);
      }
      return entry;
    };

    $scope.addRmProperty = function(entry, name) {
      // console.log("addRm: " + name);
      entry = create.addRmProperty(entry, name);
      // console.log(entry);
      return entry;
    };

    $scope.addColumnField = function(entry){
      var _field = $scope.dropdowns.current.columnField.name;
      // Adding an entry that is a nested array item
      if(["interpretation"].indexOf(_field) !== -1){
        $scope.showModalBlock(entry, true, _field, 0);
      }
      // Adding an entry that is a nested object item
      else if (["calibration", "hasResolution", "physicalSample"].indexOf(_field) !== -1){
        $scope.showModalBlock(entry, true, _field, null);
      }
      // Adding any regular field
      else if(!entry.hasOwnProperty(_field)){
        entry[_field] = "";
      }
    };

    $scope.checkSession = function(){
      var _prevSession = sessionStorage.getItem("lipd");
      if(_prevSession){
        $scope.showModalAsk({"title": "Found previous session",
            "message": "We detected LiPD data from a previous session. Would you like to restore the data?",
            "button1": "Restore Data",
            "button2": "Clear Data",
            "button3": "Close"
          },
          function(_truth){
            if(_truth){
              // start loading in the old session
              _prevSession = JSON.parse(_prevSession);
              $scope.allFiles = _prevSession.allFiles;
              $scope.status = _prevSession.status;
              $scope.map = _prevSession.map;
              $scope.dms = _prevSession.dms;
              $scope.feedback = _prevSession.feedback;
              $scope.pageMeta = _prevSession.pageMeta;
              $scope.files = _prevSession.files;
            } else {
              sessionStorage.removeItem("lipd");
            }
          });
      }
      // setInterval($scope.saveSession(),3000);
    };

    $scope.addCustom = function(entry){
      // Adding a field that is restricted / automated. Don't allow
      if (["TSid"].indexOf(entry.tmp.custom) !== -1){
        $scope.showModalAlert({"title": "Restricted field", "message": "You may not add, remove, or edit fields that are automatically generated"});
      }
      else if(entry.tmp.custom && !entry.hasOwnProperty(entry.tmp.custom)){
        entry[entry.tmp.custom] = "";
      }
      entry.tmp.custom = "";
    };

    $scope.convertCoordinates = function(){
      if(typeof($scope.files.json.geo.geometry.coordinates) === "undefined"){
        $scope.files.json.geo.geometry.coordinates = [0,0];
      }
      console.log($scope.dms);
      var _vals = misc.convertCoordinates($scope.pageMeta.decimalDegrees, $scope.files.json.geo.geometry.coordinates, $scope.dms);
      $scope.files.json.geo.geometry.coordinates = _vals.dd;
      $scope.dms = _vals.dms;
      $scope.dropdowns.current.dms.lat = _vals.dms.lat.dir;
      $scope.dropdowns.current.dms.lon = _vals.dms.lon.dir;
    };

    $scope.downloadNoaa = function(){

      var dev = location.host === "localhost:3000";
      $scope.files.dataSetName = $scope.files.json.dataSetName;
      $scope.files.lipdFilename = $scope.files.dataSetName + ".lpd";

      $scope.showModalAlert({"title": "NOAA Beta", "message": "Please note the 'NOAA Ready' and 'NOAA Download' features of this web site are BETA features, and as such are not fully implemented and are being improved. If you would like to contribute LiPD data to NOAA, please contact NOAA WDS-Paleo at: paleo@noaa.gov"});
      if ($scope.feedback.errCt > 0){
        $scope.showModalAlert({"title": "File contains errors", "message": "You are downloading data that still has errors. Be aware that using a file that isn't fully valid may cause issues."});
      }
      // Fix up the json a bit so it's ready to be sorted and downloaded
      create.closingWorkflowNoaa($scope.files, $scope.files.dataSetName, $scope.files.csv, function(_newScopeFiles){
        // Receive a new, corrected version of $scope.files
        console.log("Let me bring this to the backroom.");
        // The original $scope.files
        // console.log($scope.files);
        // The corrected version of $scope.files
        console.log(_newScopeFiles);
        $scope.uploadNoaa({"name": $scope.files.lipdFilename, "dat": _newScopeFiles}, function(resp){
          console.log("Received backend response");
          console.log(resp);
          if (resp.status !== 200){
            window.alert("HTTP " + resp.status + ": Error downloading file\n" + resp.statusText);
          } else {
            console.log("We have liftoff. Here ya go!");
            // Are we on dev or production? Use href accordingly
            if(dev){
              window.location.href = "http://localhost:3000/noaa/" + resp.data;
            } else {
              window.location.href = "http://www.lipd.net/noaa/" + resp.data;
            }
          }
        });
      });
    };

    $scope.downloadZip = function(){
      var dev = location.host === "localhost:3000";
      $scope.files.dataSetName = $scope.files.json.dataSetName;
      $scope.files.lipdFilename = $scope.files.dataSetName + ".lpd";

      if ($scope.feedback.errCt > 0){
        $scope.showModalAlert({"title": "File contains errors", "message": "You are downloading data that still has errors. Be aware that using a file that isn't fully valid may cause issues."});
      }

      // Correct the filenames, clean out the empty entries, and make $scope.files data ready for the ExportService
      var _newScopeFiles = create.closingWorkflow($scope.files, $scope.files.dataSetName, $scope.files.csv);

      // Go to the export service. Create an array where each object represents one output file. {Filename: Text} data pairs
      $scope._myPromiseExport = ExportService.prepForDownload(_newScopeFiles);
      $scope.pageMeta.busyPromise = $scope._myPromiseExport;
      $scope._myPromiseExport.then(function (filesArray) {
        //upload zip to node backend, then callback and download it afterward.
        console.log("Let me bring this to the backroom.");
        console.log(filesArray);
        // console.log($scope.files);
        $scope.uploadZip({"filename": $scope.files.lipdFilename, "dat": filesArray}, function(resp){
          console.log("Received backend response");
          console.log(resp);
          // do get request to trigger download file immediately after download
          if (resp.status !== 200){
            window.alert("HTTP " + resp.status + ": Error downloading file!");
          } else {
            console.log("We have liftoff. Here ya go!");
            // Are we on dev or production? Use href accordingly
            if(dev){
              window.location.href = "http://localhost:3000/files/" + resp.data;
            } else {
              window.location.href = "http://www.lipd.net/files/" + resp.data;
            }
          }

        });
      });
    };

    $scope.expandEntry = function(x, entry){
      // Turn off ALL toggles in the given chunk of metadata
      x = create.turnOffToggles(x, "toggle");
      // Now turn on the toggle for this specific entry
      if (typeof entry.tmp === "undefined"){
        entry["tmp"] = {"toggle": true};
      } else{
        entry.tmp.toggle = true;
      }
    };

    // $scope.expandEntry = function(arr, idx){
    //   // Expand the target idx, and make sure that all other idx's are collapsed. Only allow one expansion at once.
    //   if(typeof arr[idx].tmp === "undefined"){
    //     arr[idx]["tmp"] = {"toggle": true};
    //   } else {
    //     arr[idx].tmp.toggle = true;
    //   }
    //   for(var _p = 0; _p<arr.length; _p++){
    //     if(_p !== idx){
    //       if(typeof arr[_p].tmp === "undefined") {
    //         arr[_p]["tmp"] = {"toggle": false};
    //       } else {
    //         arr[_p].tmp.toggle = false;
    //       }
    //     }
    //   }
    //   return arr;
    // };

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
        entry.tmp.doiWarn = true;
      } else {
        alert("DOI entered does not match the DOI format");
      }
      return entry;
    };

    $scope.getTooltip = function(section, key){
      return create.fieldMetadataLibrary(section, key);
    };

    $scope.makeNoaaReady = function(alert){
      // The noaaReady boolean is bound to the switch
      if(!$scope.pageMeta.noaaReady){
        // Make Ready
        create.addFieldsToCols($scope.files.json, ["dataType", "dataFormat"], function(_d2){
          if(alert){
            $scope.showModalAlert({"title": "NOAA Validation", "message": "The fields that NOAA requires have been " +
            "added where necessary. For a list of these requirements, hover your mouse pointer over the 'NOAA " +
            "requirements' bar on the left side of the page. Reference the 'NOAA Variable Naming' link under 'Quick Links' on the home page for variable information."});
          }
          $scope.files.json = _d2;
          console.log($scope.files.json.paleoData);
        });
      } else {
        if(alert){
          // Don't remove fields, only remove
          $scope.showModalAlert({"title": "Fields may be ignored", "message": "Validation is no longer using NOAA rules."});
        }
      }
    };

    $scope.makeWikiReady = function(){
      // The wikiReady boolean is bound to the switch
      if(!$scope.pageMeta.wikiReady){
        // Make Ready
        create.addFieldsToCols($scope.files.json, ["takenAtDepth", "inferredVariableType", "proxyObservationType"], function(_d2){
          $scope.showModalAlert({"title": "Wiki Validation", "message": "The fields that the Linked Earth Wiki requires have been " +
          "added where necessary. For a list of these requirements, hover your mouse pointer over the 'Wiki " +
          "requirements' bar on the left side of the page."});
          $scope.files.json = _d2;
          console.log($scope.files.json.paleoData);
        });
      } else {
        // Don't remove fields. just alert
        $scope.showModalAlert({"title": "Fields may be ignored", "message": "Validation is no longer using Wiki rules."});
      }
    };

    $scope.parseCsv = function(table, parentIdx, idx, options){
      var _parse_mode = $scope.dropdowns.current.parseMode.name;
      var _delimiter = $scope.dropdowns.current.delimiter.name;

      // we can't guarantee a dataSetName yet, so build this csv filename as best we can for now.
      var _csvname = options.pc + parentIdx + options.tt + idx + ".csv";

      table.tableName = options.pc + parentIdx + options.tt + idx;

      // Delimiter: stored in scope, shared across all tables
      // table.tmp.values refers to the TextArea box on the page
      var _csv = Papa.parse(table.tmp.values, {
        "delimiter": _delimiter
      });

      // Add row, column, transposed data to csv object
      _csv = misc.putCsvMeta(_csv);

      // Transpose values: one array = one column's values
      table.filename = _csvname;


      // New Table: Remove existing data and place all new data.
      if(_parse_mode === "new"){
        // Set the transposed data to temporary table data
        table.tmp.values = _csv.transposed;
        // initialize X amount of columns
        table.columns = new Array(table.tmp.values.length);
        // start adding each column to the array
        for(var _i=0; _i < table.tmp.values.length; _i++){
          if($scope.pageMeta.header){
            // Header exists. Set variableName and values
            table.columns[_i] = {"number": _i + 1, "variableName": table.tmp.values[_i][0], "units": "", "values": table.tmp.values[_i].slice(1, table.tmp.values.length-1)};
          } else {
            // No header. Set values.
            table.columns[_i] = {"number": _i + 1, "variableName": "", "units": "", "values": table.tmp.values[_i]};
          }
        }
      }

      // Update: Keep metadata, update values
      else if(_parse_mode === "update"){
        // Do the amount of parsed values columns === the existing amount of metadata columns?
        if (table.columns.length === _csv.transposed.length){
          // Set the transposed data to temporary table data
          table.tmp.values = _csv.transposed;
          console.log(table.tmp.values);
          for (var _c = 0; _c < table.columns.length; _c++){
            if($scope.pageMeta.header){
              // Header exists. Set variableName and values
              table.columns[_c]["values"] = table.tmp.values[_c].slice(1, table.tmp.values.length-1);
              table.columns[_c]["variableName"] = table.tmp.values[_c][0]
            } else {
              console.log("updating values, keeping metadata");
              // No header. Set values.
              table.columns[_c]["values"] = table.tmp.values[_c];
            }
          }
        } else {
          // If the table currently has N columns, you must provide N columns worth of values for 'Keep Existing Columns" to map new values to old column metadata properly
          $scope.showModalAlert({"title": "Column counts do not match", "message": "The number of columns provided does not match the existing number of columns to be updated."})
        }
      }

      // Add: Add these columns to existing columns.
      else if (_parse_mode === "add") {
        var _add_idx = table.columns.length;

        // Set the transposed data to temporary table data
        table.tmp.values = _csv.transposed;

        // Loop over the new values data
        for(var _n=0; _n<table.tmp.values.length; _n++){
          if($scope.pageMeta.header){
            // Header exists. Set variableName and values
            table.columns[_add_idx] = {"number": _add_idx + 1, "variableName": table.tmp.values[_n][0], "units": "", "values": table.tmp.values[_n].slice(1, table.tmp.values.length-1)};
          } else {
            // No header. Set values.
            table.columns[_add_idx] = {"number": _add_idx + 1, "variableName": "", "units": "", "values": table.tmp.values[_n]};
          }
          // We are using an index that is one greater than the current column count.
          _add_idx++;
        }
      }

      // Headers: Remove the headers from the values data.
      if ($scope.pageMeta.header){
        // Remove the header row from _csv.data (first array)  and _csv.transposed (first element of each array)
        _csv = misc.removeCsvHeader(_csv);
      }

      if(_parse_mode === "add"){
        // Update the _csv data in the scope with the new data, col counts, etc.
        // Get the existing values data
        var _csv_obj = create.getParsedCsvObj(_csvname, $scope.files.csv);
        _csv = create.updateCsvScope(_csv_obj.data, _csv);

      }

      if($scope.pageMeta.noaaReady){
        table = create.addFieldsToTable(table, ["dataFormat", "dataType"]);

      }
      if($scope.pageMeta.wikiReady){
        table = create.addFieldsToTable(table, ["takenAtDepth", "inferredVariableType", "proxyObservationType"]);
      }

      // Values are finished processing. Set data to scope.
      $scope.files.csv[_csvname] = _csv;
      // // $scope.pageMeta.keepColumnMeta = true;
      // // Remove the values from the text field. After being processed, the values formatting gets jumbled and cannot be parsed again.
      // // If they want to update or parse new values, they'll have to copy/paste them in again.
      table.tmp.values = "";
      return table;
    };

    $scope.removeBlock = function(entry, idx){
      create.rmBlock(entry, idx);
    };

    $scope.resetCsv = function(entry){
      // To reset a parsed CSV table, you need to undo all of the below
      // entry.values, entry.filename, entry.columns,
      // $scope.files.csv[_csvname] = _csv;
      entry.tmp.values = null;
      entry.tmp.parse = false;
      $scope.files.csv[entry.filename] = null;
      // entry.filename = null;
      entry.columns = null;
      entry.tmp.toggle = !entry.tmp.toggle;
      return entry;
    };

    $scope.resetPage = function(){
      // All metadata and data about the page is emptied when the Upload button is clicked. Ready for another file upload.
      $scope.allFiles = [];
      $scope.feedback = {
        "lipdVersion": "NA",
        "missingTsidCt": 0,
        "wrnCt": 0,
        "errCt": 0,
        "validLipd": "NA",
        "validWiki": "NA",
        "validNoaa": "NA",
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
        "modal": {},
        "lipdFilename": "",
        "dataSetName": "",
        "fileCt": 0,
        "bagit": {},
        "csv": {},
        "jsonSimple": {"lipdVersion": 1.3},
        "json": {"lipdVersion": 1.3, "createdBy": "lipd.net", "pub": [], "funding": [], "dataSetName": "", "geo": {
          "geometry": {"coordinates": []}},
          "paleoData": [{"measurementTable": [{"tableName": "paleo0measurement0", "filename": "paleo0measurement0.csv",
            "columns": []}]}]}
      };
      $scope.pageMeta = {
        "keepColumnMeta": false,
        "header": false,
        "appendColumn": false,
        "decimalDegrees": true,
        "fileUploaded": false,
        "toggle": "",
        "simpleView": true,
        "valid": false,
        "filePicker": false,
        "dlFallback": false,
        "dlFallbackMsg": "",
        "oldVersion": "NA",
        "noaaReady": false,
        "wikiReady": false
      };
      $scope.status = "N/A";
    };

    $scope.removePaleoChron = function(pc){
      $scope.showModalAsk({"title": "Delete ALL data in this section?",
          "message": "Are you sure you want to delete all data from the " + pc + "Data section? I won't be able to bring it back.",
        "button1": "Yes",
        "button2": "No"}, function(truth){
        if(truth === true){
          if(pc === "chron"){
            $scope.files.json.chronData = [];
          } else if (pc === "paleo"){
            $scope.files.json.paleoData = [{"measurementTable": [{"tableName": "", "missingValue": "NaN",
              "filename": "", "columns": []}]}];
          }
        }
      });
    };

    $scope.rmColumnField = function(entry, _field){
      if(entry.hasOwnProperty(_field)){
        if (["TSid"].indexOf(_field) !== -1){
          $scope.showModalAlert({"title": "Restricted field", "message": "You may not add, remove, or edit fields that are automatically generated"});
        } else {
          delete entry[_field];
        }
      }
    };

    $scope.saveSession = function(){
      try{
        delete $scope.pageMeta.busyPromise;
        var _dat = JSON.stringify({
          "allFiles": $scope.allFiles,
          "status": $scope.status,
          "map": $scope.map,
          "dms": $scope.dms,
          "feedback": $scope.feedback,
          "pageMeta": $scope.pageMeta,
          "files": $scope.files
        });
        console.log("Saving progress: ");
        // console.log($scope.roughSizeOfObject(_dat));
        sessionStorage.setItem("lipd", _dat);
        toaster.pop('note', "Saving progress...", "Saving your data to the browser session in case something goes wrong", 4000);
      } catch(err){
        toaster.pop('error', "Error saving progress", "Unable to save progress. Data may be too large for browser storage", 4000);
      }
    };

    $scope.setCountry = function(name){
      if (!$scope.files.json.geo.properties.country){
        $scope.files.json.geo = create.addBlock($scope.files.json.geo, "geo", null);
      }
      $scope.files.json.geo.properties.country = name;
    };

    $scope.isBlock = function(field){
      // Data is a block if the field is in this list.
      if(["physicalSample", "hasResolution", "calibration"].includes(field)){
        return true;
      }
      return false;
    };

    $scope.isArr = function(field){
      // Data is a block if the field is in this list.
      if(["interpretation"].includes(field)){
        return true;
      }
      return false;
    };

    $scope.isProperty = function(field){
      // Do not show any temporary fields, data, or nested blocks.
      if(["number", "variableName", "units", "toggle", "description", "values", "checked", "tmp", "interpretation", "physicalSample", "hasResolution", "calibration"].includes(field)){
        return false;
      }
      return true;
    };

    $scope.showModalAlert = function(msg){
      // FORMAT: msg = {"title": "", "msg": ""}
      $scope.modal = msg;
      var modalInstance = $uibModal.open({
        templateUrl: 'modal-alert',
        controller: 'ModalCtrlAlert',
        size: "md",
        resolve: {
          data: function () {
            return $scope.modal;
          }
        }
      });
    };

    $scope.showModalAsk = function(msg, cb){
      // FORMAT: msg = {"title": "", "msg": "", "button1": "", "button2": "", "button3": ""}
      $scope.modal = msg;
      var modalInstance = $uibModal.open({
        templateUrl: 'modal-ask',
        controller: 'ModalCtrlAsk',
        size: "md",
        resolve: {
          data: function () {
            return $scope.modal;
          }
        }
      });
      modalInstance.result.then(function (selected) {
        cb(selected);
      });
    };

    $scope.showModalBlock = function(entry, _create, _key, idx){
      // FORMAT: options = {"data": [] or {}, "create": bool, "key": "", "idx": null or int}
      // Use idx === null or !== null to determine if this is an
      var arrType = idx !== null;

      // Get the data
      var _data = entry[_key];
      // If data not initialized or creating from scratch, then make the object
      if((typeof _data === 'undefined' || !_data) && !arrType){
        _data = {};
      } else if ((typeof _data === 'undefined' || !_data) && arrType){
        _data = [];
      }
      if(_create && arrType){
        idx = _data.length;
        _data.push({});
      }
      //Set options to pass to modal controller
      $scope.modal = {"data": _data, "create": _create, "key": _key, "idx": idx};
      var modalInstance = $uibModal.open({
        templateUrl: 'modal-block',
        controller: 'ModalCtrlBlock',
        size: "lg",
        resolve: {
          data: function () {
            return $scope.modal;
          }
        }
      });
      modalInstance.result.then(function (new_data) {
        if (new_data === "delete"){
          if(arrType){
            _data.splice(idx, 1);
            entry[_key] = _data;
          } else {
            delete entry[_key];
          }
        } else if(new_data !== "cancel"){
          entry[_key] = new_data;
        }
        return entry;
      });
      return entry;
    };

    $scope.showModalFileContent = function(data){
      // Showing contents of individual file links
      $scope.modal = data;
      var modalInstance = $uibModal.open({
        templateUrl: 'modal-file',
        controller: 'ModalCtrlFile',
        size: "lg",
        resolve: {
          data: function () {
            return $scope.modal;
          }
        }
      });
    };

    $scope.startTour = function(){
      var intro = introJs();
      intro.setOptions({
        steps: create.tourSteps()});
      $scope.beforeAfterTour("before", function(tourMeta){
        $scope.pageMeta.tourMeta = tourMeta;
        intro.start();
      });
      intro.onexit(function() {
        $scope.beforeAfterTour("after", function(tourMeta){
          $scope.pageMeta.tourMeta = tourMeta;
        });
      });
    };

    $scope.beforeAfterTour = function(mode, cb){
      if(mode === "before"){
        var beforeSettings = {"noaaReady": false,
          "pub": {"added": false, "expanded": false},
          "funding": {"added": false, "expanded": false},
          "paleo": {"expanded": false, "values": false, "header": false}};
        // Turn on NOAA switch
        if (!$scope.pageMeta.noaaReady){
          $scope.makeNoaaReady(false);
          $scope.pageMeta.noaaReady = true;
          beforeSettings.noaaReady = false;
        }

        // create and/or open pub 1
        // does pub 1 exist?
        if(typeof $scope.files.json.pub[0] === "undefined"){
          // no, add block and expand
          $scope.files.json.pub = $scope.addBlock($scope.files.json.pub, "pub", null);
          $scope.files.json.pub[0].tmp = {"toggle": false};
          beforeSettings.pub.added = true;
        }
        // is it expanded?
        if(!$scope.files.json.pub[0].tmp.toggle){
          // no, expand it.
          $scope.files.json.pub[0].tmp.toggle = true;
          beforeSettings.pub.expanded = true;
        }

        // create and/or open funding 1
        // does funding 1 exist?
        if(typeof $scope.files.json.funding[0] === "undefined"){
          // no, add block and expand
          $scope.files.json.funding = $scope.addBlock($scope.files.json.funding, "funding", null);
          $scope.files.json.funding[0].tmp = {"toggle": false};
          beforeSettings.funding.added = true;
        }
        // is it expanded?
        if(!$scope.files.json.funding[0].tmp.toggle){
          // no, expand it.
          $scope.files.json.funding[0].tmp.toggle = true;
          beforeSettings.funding.expanded = true;
        }

        // open paleo 1 meas 1
        var pdt = $scope.files.json.paleoData[0].measurementTable[0];
        if (typeof pdt.tmp === "undefined"){
          pdt.tmp = {"toggle": false, "values": ""};
        }
        if (typeof pdt.tmp.toggle === "undefined"){
          pdt.tmp.toggle = true;
          beforeSettings.paleo.expanded = false;
        }
        if (!pdt.tmp.toggle){
          pdt.tmp.toggle = true;
          beforeSettings.paleo.expanded = false;
        }
        if (typeof pdt.tmp.values === "undefined" || !pdt.tmp.values) {
          $scope.pageMeta.header = true;
          pdt.tmp.values = "Depth\t Age\n3\t1900";
          beforeSettings.paleo.values = true;
          beforeSettings.paleo.header = true;
        }
        cb(beforeSettings);
      } else if(mode === "after"){
        $scope.pageMeta.noaaReady = $scope.pageMeta.tourMeta.noaaReady;
        $scope.files.json.pub[0].tmp.toggle = $scope.pageMeta.tourMeta.pub.expanded;
        $scope.files.json.funding[0].tmp.toggle = $scope.pageMeta.tourMeta.funding.expanded;
        $scope.files.json.paleoData[0].measurementTable[0].tmp.toggle = $scope.pageMeta.tourMeta.paleo.expanded;
        $scope.pageMeta.header = $scope.pageMeta.tourMeta.paleo.header;

        if($scope.pageMeta.tourMeta.pub.added){
          $scope.files.json.pub.splice(0,1);
        }
        if($scope.pageMeta.tourMeta.funding.added){
          $scope.files.json.funding.splice(0,1);
        }
        if($scope.pageMeta.tourMeta.paleo.values){
          $scope.files.json.paleoData[0].measurementTable[0].tmp.values = "";
        }
        cb({});
      }
    };

    $scope.startHints = function(){
      var intro = introJs();
      intro.setOptions({
        hints: [
          {
            intro: "Welcome to the Create LiPD page! This tour is designed to teach you the ins and outs of creating or " +
            "editing a LiPD file. We tried to make working with LiPD data as simple as possible, but some parts of the process " +
            "inevitably need more explanation."
          },
          {
            // Map
            element: document.querySelector(".step1"),
            hint: "The map uses your coordinate data to drop a pin on your dataset's location.",
            hintPosition: "bottom-left"
          },
          {
            // Choose file button
            element: document.querySelector(".step2"),
            hint: "If you have a LiPD file and would like to upload it, use the 'Choose File' button to browse your computer and select the file.",
            hintPosition: 'top'
          },
          {
            // Validate button
            element: document.querySelector(".step3"),
            hint: 'LiPD files must abide by our designed structure, follow standards, and meet minimum data requirements to be considered a valid file. Use this button to determine if your file is valid.',
            hintPosition: 'right'
          },
          {
            // Save Session button
            element: document.querySelector(".step4"),
            hint: "Need a break from your dataset? Did your internet connection disconnect? Save the session and come back later. Just don't close your internet browser!",
            hintPosition: 'right'
          },
          {
            // Download lipd button
            element: document.querySelector(".step5"),
            hint: 'Download your validated data as a LiPD file to your local computer.',
            hintPosition: "top-middle"
          },
          {
            // Download NOAA button
            element: document.querySelector(".step6"),
            hint: "Download your validated data as a NOAA template text file. Please note, one text file is created for every paleo measurement table in your dataset.",
            hintPosition: "top-middle"
          },
          {
            // NOAA ready, wiki ready switches
            element: document.querySelector(".step7"),
            hint: "The LinkedEarth Wiki and NOAA have additional data requirements on top of the normal LiPD requirements. Turning on these switches will add custom data input fields to the page and add rules to the validation process.",
            hintPosition: "middle-left"
          },
          {
            // Feedback boxes
            element: document.querySelector(".step8"),
            hint: "Validation results. Every time you press the 'Validate' button, these boxes will show the results. A valid file may have warnings, but must not have any errors.",
            hintPosition: "right"
          },
          {
            // Requirements boxes
            element: document.querySelector(".step9"),
            hint: "The requirements boxes give you feedback on how complete your dataset is and if you meet different levels of requirements. Hover your mouse pointer over each box to view specific requirements for each.",
            hintPosition: "right"
          },
          {
            // Files list
            element: document.querySelector(".step10"),
            hint: "All files ( .jsonld, .csv, .txt ) archived withing the LiPD file are listed here after upload. The filenames listed may be clicked to view the contents inside.",
            hintPosition: "right"
          }
        ]
      });
      intro.onhintsadded(function() {
        console.log('all hints added');
      });
      intro.onhintclick(function(hintElement, item, stepId) {
        console.log('hint clicked', hintElement, item, stepId);
      });
      intro.onhintclose(function (stepId) {
        console.log('hint closed', stepId);
      });
      intro.addHints();
    };

    $scope.toggleCsvBox = function(entry) {
      entry.tmp.parse=!entry.tmp.parse;
    };

    $scope.uploadNoaa = function (_file, cb) {
      // Upload *validated* lipd data to backend
      $scope.pageMeta.busyPromise = Upload.upload({
        url: '/noaa',
        data: {dat: _file.dat,
          name: _file.name}
      });
      $scope.pageMeta.busyPromise.then(function (resp) {
        // console.log('Success');
        // console.log(resp);
        cb(resp);
      }, function (resp) {
        console.log(resp);
        console.log('Error status: ' + resp.status);
        cb(resp);
      }, function (evt) {
        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
      });
    };

    $scope.uploadZip = function (_file, cb) {
      // Upload *validated* lipd data to backend
      $scope.pageMeta.busyPromise = Upload.upload({
        url: '/files',
        data: {file: _file.dat,
          filename: _file.filename
          // headers: {"Content-type": "application/json",
          //           'Access-Control-Allow-Origin': '*',
          //           'Access-Control-Allow-Methods': 'GET, POST',
          //           'Access-Control-Allow-Headers': 'x-prototype-version,x-requested-with'
          // }
        }
      });
      $scope.pageMeta.busyPromise.then(function (resp) {
        // console.log('Success');
        // console.log(resp);
        cb(resp);
      }, function (resp) {
        console.log(resp);
        console.log('Error status: ' + resp.status);
        cb(resp);
      }, function (evt) {
        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
      });
    };

    $scope.validate = function(){
      console.log($scope.files);
      console.log($scope.files.json);
      // Go through all validations steps, and update scope data.
      // rearrange coordinates from dict to array when necessary, and set the map if coordinates exist
      $scope.files = map.fixCoordinates($scope.files);
      // convert dms coordinates where necessary
      $scope.files.json = misc.checkCoordinatesDms($scope.files.json, $scope.dms, $scope.pageMeta.decimalDegrees);
      $scope.map = map.updateMap($scope.map, $scope.files);
      versions.update_lipd_version($scope.files, function(_results1){
          console.log("Updated Versions");
          $scope.pageMeta.oldVersion = _results1.version;
          lipdValidator.validate(_results1.files, $scope.pageMeta, function(_results){
            try{
              $scope.files = _results.files;
              $scope.feedback = _results.feedback;
              $scope.status = _results.status;
              console.log(_results);
            } catch(err){
              console.log("validate: Error trying to prepare results: " + err);
            }
          });
        }
      );

    };

    vc.propertiesQuerySearch = function(query) {
      return query ? vc.properties.list.filter(createFilterFor(query)) : vc.properties.list.filter(createFilterFor(''));
    };

    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(item) {
        // console.log(item);
        return (angular.lowercase(item.name).indexOf(lowercaseQuery) === 0) ||
          (angular.lowercase(item.name).indexOf(lowercaseQuery) === 0);
      };
    }

    window.onload = $scope.checkSession();

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
          $scope.files.lipdFilename = fileInput.files[0].name;
          $scope.files.dataSetName = fileInput.files[0].name.slice(0, -4);
          // get a list of file entries inside this zip
          model.getEntries(fileInput.files[0], function (entries) {
            // use the service to parse data from the ZipJS entries
            $scope.pageMeta.busyPromise = ImportService.parseFiles(entries);
            $scope.pageMeta.busyPromise.then(function (res) {
              // Set response to allFiles so we can list all the filenames found in the LiPD archive.
              $scope.allFiles = res;
              $scope.pageMeta.fileUploaded = true;
              $scope.pageMeta.keepColumnMeta = true;
              // Gather some metadata about the lipd file, and organize it so it's easier to manage.
              lipdValidator.restructure(res, $scope.files, function(_response_1){
                $scope.files = _response_1;
                if($scope.files.fileCt > 40){
                  $scope.showModalAlert({"title": "Wow! That's a lot of files!", "message": "We expanded the page to fit everything, so be sure to scroll down to see your data tables."})
                }
                $scope.validate();
                $scope.files.json = create.initColumnTmp($scope.files.json);
                $scope.files.json = create.initMissingArrs($scope.files.json);
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

