// Controller - Validate Form
angular.module("ngValidate").controller('ValidateCtrl', ['$scope', '$log', '$timeout', '$q', '$http', 'Upload', "ImportService", "ExportService", "$uibModal","$sce", "toaster",
  function ($scope, $log, $timeout, $q, $http, Upload, ImportService, ExportService, $uibModal, $sce, toaster) {

    // var url = "http://wiki.linked.earth/store/ds/query?query=";
    // var params = "PREFIX%20core%3A%20%3Chttp%3A%2F%2Flinked.earth%2Fontology%23%3E%0APREFIX%20wiki%3A%20%3Chttp%3A%2F%2Fwiki.linked.earth%2FSpecial%3AURIResolver%2F%3E%0ASELECT%20DISTINCT%20%3Flabel%0AWHERE%20%7B%0A%20%20%3Fs%20a%20core%3AInferredVariable%20.%0A%20%20%3Fs%20%3Fproperty%20%3Fc%20.%0A%20%20%3Fproperty%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23label%3E%20%3Flabel.%0A%7D";
    // var xhr = new XMLHttpRequest();
    // xhr.open("POST", url+params, true);
    // //Send the proper header information along with the request
    // xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // xhr.send(params);
    // xhr.onreadystatechange = function() {
    //   if (xhr.readyState === 4) {
    //     console.log("fields");
    //     console.log(xhr.response); //Outputs a DOMString by default
    //   }
    // };
    //
    // var url2 = "http://wiki.linked.earth/store/ds/query?query=";
    // var params2 = "PREFIX%20core%3A%20%3Chttp%3A%2F%2Flinked.earth%2Fontology%23%3E%0APREFIX%20wiki%3A%20%3Chttp%3A%2F%2Fwiki.linked.earth%2FSpecial%3AURIResolver%2F%3E%0ASELECT%20%3Fds%20%3Fname%0AWHERE%20%7B%0A%20%20%3Fds%20a%20core%3ADataset%20.%0A%20%20%3Fds%20core%3Aname%20%3Fname%0A%7D";
    // var xhr2 = new XMLHttpRequest();
    // xhr2.open("GET", url2+params2, true);
    // xhr2.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // xhr2.send(params2);
    // xhr2.onreadystatechange = function() {
    //   if (xhr2.readyState === 4) {
    //     console.log("datasets");
    //     console.log(xhr2.response); //Outputs a DOMString by default
    //   }
    // };

    $scope.lipdPopover = $sce.trustAsHtml('' +
      '<h5>LiPD Requirements</h5><br>' +
      '<p>Root Level:</p><ul>' +
      '<li>dataSetName</li>' +
      '<li>archiveType</li>' +
      '<li>createdBy</li>' +
      '</ul><br><p>Geo:</p><ul>' +
      '<li>coordinates</li>' +
      '</ul><br><p>paleoData:</p><ul>' +
      '<li>measurementTable</li>' +
      '</ul><br><p>Column Level:</p><ul>' +
      '<li>variableName</li>' +
      '<li>units ("unitless" if units not applicable)</li>' +
      '<li>values</li>' +
      '</ul>');

    $scope.wikiPopover = $sce.trustAsHtml('' +
      '<h5>Linked Earth Wiki Requirements</h5><br>' +
      '<p>In addition to the normal LiPD Requirements: </p>' +

      '</ul><br><p>Column Level:</p><ul>' +
      '<li>proxyObservationType</li>' +
      '<li>variableType</li>' +
      '<li>takenAtDepth</li>' +
      '<li>inferredVariableType</li>' +
      '</ul>');
    $scope.noaaPopover = $sce.trustAsHtml('' +
      '<h5>NOAA Requirements</h5><br>' +
      '<p>In addition to the normal LiPD Requirements: </p>' +

      '</ul><br><p>NOAA specific:</p><ul>' +
      '<li>maxYear</li>' +
      '<li>minYear</li>' +
      '<li>timeUnit</li>' +
      '<li>onlineResource</li>' +
      '<li>onlineResourceDescription</li>' +
      '<li>modifiedDate</li><br>' +
      '</ul><p>Root Level:</p><ul>' +
      '<li>investigators</li>' +
      '</ul><br><p>Geo:</p><ul>' +
      '<li>siteName</li>' +
      '<li>location</li>' +
      '</ul><br><p>Column Level:</p><ul>' +
      '<li>description</li>' +
      '<li>dataFormat</li>' +
      '<li>dataType</li>'
    );

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
    $scope.dropdowns = {
      "current": {
        "table": { id: 1, name: 'measurement' },
        "delimiter": { id: 1, name: "\t", view: "Tab ( \\t )"},
      },
      "tables": [
        { id: 1, name: 'measurement' },
        { id: 2, name: 'summary' },
        { id: 3, name: 'ensemble' },
        // { id: 4, name: "distribution"}
      ],
      "delimiters": [
        { id: 1, name: "\t", view: "Tab ( \\t )"},
        { id: 2, name: ",", view: "Comma ( , )"},
        { id: 3, name: ";", view: "Semi-colon ( ; )" },
        { id: 4, name: "|", view: "Pipe ( | )"},
        { id: 5, name: " ", view: "Space"},
      ],
      "archiveType": create.archiveTypeList(),
      "timeUnit": create.timeUnitList(),
      "years": create.yearList(),
      "createdBy": create.createdByList(),
      "countries" : map.getCountries()
    };
    $scope.fields = create.defaultColumnFields();
    // Compilation of all LiPD file data
    $scope.files = {
      "modal": {},
      "lipdFilename": "",
      "dataSetName": "",
      "fileCt": 0,
      "bagit": {},
      "csv": {},
      "jsonSimple": {"lipdVersion": 1.3},
      "json": {"lipdVersion": 1.3, "createdBy": "lipd.net", "pub": [], "funding": [], "dataSetName": "", "geo": {},
        "paleoData": [{"measurementTable": [{"tableName": "", "missingValue": "NaN",
          "filename": "", "columns": []}]}]}
    };
    // Metadata about the page view, and manipulations
    $scope.pageMeta = {
      "busyPromise": null,
      "header": false,
      "decimalDegrees": true,
      "fileUploaded": false,
      "toggle": "",
      "simpleView": true,
      "valid": false,
      "filePicker": false,
      "dlFallback": false,
      "dlFallbackMsg": "",
      "captcha": false,
      "oldVersion": "NA",
      "noaaReady": false,
      "wikiReady": false
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
        "s": 0
      },
      "lat":{
        "d": 0,
        "m": 0,
        "s": 0
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
      // Need to initialize the first entry of chronData measurement table, when it doesn't yet exist.
      if (pc === "chron" && typeof(entry) === "undefined"){
        $scope.files.json = create.addChronData($scope.files.json);
      }
      // Add a block of data to the JSON. (i.e. funding, paleoData table, publication, etc.)
      entry = create.addBlock(entry, blockType, pc);
      return entry;
    };

    $scope.addRmProperty = function(entry, name) {
      if (name === "interpretation"){
        $scope.showModalInterpretation(function(selected){
          if(selected === "cancel"){
            entry.tmp[name] = !entry.tmp[name];
          } else{
            if (entry.interpretation === undefined){
              entry.interpretation = [selected];
            } else {
              entry["interpretation"].push(selected);
            }
          }
        });
      }
      else{
        entry = create.addRmProperty(entry, name);
      }
      return entry;
    };

    $scope.makeNoaaReady = function(){
      if(!$scope.pageMeta.noaaReady){
        // Make Ready
        create.addNoaaReady($scope.files.json, function(_d2){
          $scope.genericModalAlert({"title": "NOAA Validation", "message": "The fields that NOAA requires have been " +
          "added where necessary. For a list of these requirements, hover your mouse pointer over the 'NOAA " +
          "requirements' bar on the left side of the page."});
          $scope.files.json = _d2;
        });
      } else {
        // Don't remove fields. just alert
        $scope.genericModalAlert({"title": "Fields may be ignored", "message": "Validation is no longer using NOAA rules."});
      }
    };

    $scope.makeWikiReady = function(){
      if(!$scope.pageMeta.wikiReady){
        // Make Ready
        create.addWikiReady($scope.files.json, function(_d2){
          $scope.genericModalAlert({"title": "Wiki Validation", "message": "The fields that the Linked Earth Wiki requires have been " +
          "added where necessary. For a list of these requirements, hover your mouse pointer over the 'Wiki " +
          "requirements' bar on the left side of the page."});
          $scope.files.json = _d2;
        });
      } else {
        // Don't remove fields. just alert
        $scope.genericModalAlert({"title": "Fields may be ignored", "message": "Validation is no longer using Wiki rules."});
      }
    };

    $scope.genericModalAlert = function(msg){
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

    $scope.genericModalAsk = function(msg, cb){
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

    // Show options for creating interpretation block
    $scope.showModalInterpretation= function(cb){
      var modalInstance = $uibModal.open({
        templateUrl: 'modal-interp',
        controller: 'ModalCtrlInterp',
        size: "lg"
      });
      modalInstance.result.then(function (selected) {
        cb(selected);
      });

    };

    // Showing contents of individual file links
    $scope.showModalFileContent = function(data){
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

    $scope.clearCustom = function(entry){
      if(entry.tmp.custom){
        $scope.fields.push(entry.tmp.custom);
      }
      entry.tmp[entry.tmp.custom] = true;
      entry.tmp.custom = "";
      return entry;
    };

    $scope.roughSizeOfObject = function(object) {

      var objectList = [];
      var stack = [ object ];
      var bytes = 0;

      while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
          bytes += 4;
        }
        else if ( typeof value === 'string' ) {
          bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
          bytes += 8;
        }
        else if
        (
          typeof value === 'object'
          && objectList.indexOf( value ) === -1
        )
        {
          objectList.push( value );

          for( var i in value ) {
            stack.push( value[ i ] );
          }
        }
      }
      return bytes;
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
        console.log($scope.roughSizeOfObject(_dat));
        sessionStorage.setItem("lipd", _dat);
        toaster.pop('note', "Saving progress...", "Saving your data to the browser session in case something goes wrong", 4000);
      } catch(err){
        toaster.pop('error', "Error saving progress", "Unable to save progress. Data may be too large for browser storage", 4000);
      }
    };

    $scope.checkSession = function(){
      var _prevSession = sessionStorage.getItem("lipd");
      if(_prevSession){
        $scope.genericModalAsk({"title": "Found previous session",
          "message": "We detected LiPD data from a previous session. Would you like to restore the data?",
          "button1": "Restore Data",
          "button2": "Clear Data",
          "button3": "Close"
      },
          function(_truth){
            console.log(_truth);
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

    $scope.downloadZip = function(){

      // Fix up the json a bit so it's ready to be sorted and downloaded
      var _newJson = create.closingWorkflow($scope.files, $scope.files.dataSetName, $scope.files.csv);

      // Download the *validated* LiPD file to client's computer
      // use the service to parse data from the ZipJS entries
      $scope._myPromiseExport = ExportService.prepForDownload(_newJson);
      $scope.pageMeta.busyPromise = $scope._myPromiseExport;
      $scope._myPromiseExport.then(function (res) {
        //upload zip to node backend, then callback and download it afterward.
        $scope.uploadZip({"filename": $scope.files.lipdFilename, "dat": res}, function(resp){
          // reset the captcha
          $scope.pageMeta.captcha = false;
          // do get request to trigger download file immediately after download
          if (resp.status !== 200){
            window.alert("Error downloading file");
          } else {
            // window.location.href = "http://localhost:3000/files/" + resp.data;
            window.location.href = "http://www.lipd.net/files/" + resp.data;
          }

        });
      });
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

    $scope.getSet = function(value){
      $scope.files.dataSetName = value;
      $scope.files.lipdFilename = value + ".lpd";
      console.log("getSet: filename = " + $scope.files.lipdFilename);
    };

    $scope.resetCsv = function(entry){
      // To reset a parsed CSV table, you need to undo all of the below
      // entry.values, entry.filename, entry.columns,
      // $scope.files.csv[_csvname] = _csv;
      entry.values = null;
      $scope.files.csv[entry.filename] = null;
      entry.filename = null;
      entry.columns = null;
      entry.toggle = !entry.toggle;
      return entry;
    };

    $scope.parseCsv = function(entry, idx, options){
      // we can't guarantee a datasetname yet, so build this csv filename as best we can for now.
      var _csvname = options.pc + '0' + options.tt + idx + ".csv";
      // Semi-colon delimiter is checked. Pass this as an argument to PapaParse
      // console.log($scope.dropdowns.current.delimiter.name);
      var _csv = Papa.parse(entry.values, {
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
      return entry;
    };

    $scope.removeBlock = function(entry, idx){
      create.rmBlock(entry, idx);
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
        "json": {"lipdVersion": 1.3, "createdBy": "lipd.net", "pub": [], "funding": [], "dataSetName": "", "geo": {},
          "paleoData": [{"measurementTable": [{"tableName": "", "missingValue": "NaN",
            "filename": "", "columns": []}]}]}
      };
      $scope.pageMeta = {
        "header": false,
        "decimalDegrees": true,
        "fileUploaded": false,
        "toggle": "",
        "simpleView": true,
        "valid": false,
        "filePicker": false,
        "dlFallback": false,
        "dlFallbackMsg": "",
        "captcha": false,
        "oldVersion": "NA",
        "noaaReady": false,
        "wikiReady": false
      };
      $scope.status = "N/A";
    };

    $scope.setCountry = function(name){
      if (!$scope.files.json.geo.properties.country){
        $scope.files.json.geo = create.addBlock($scope.files.json.geo, "geo", null);
      }
      $scope.files.json.geo.properties.country = name;
    };

    $scope.showProperty = function(name){
      if(["number", "variableName", "units", "toggle", "values", "checked", "tmp", "interpretation"].includes(name)){
        return false;
      }
      return true;
    };

    $scope.checkCaptcha = function(){
      if($scope.gRecaptchaResponse){
        $scope.downloadZip();
      } else {
        // Download button was clicked, show the captcha challenge
        $scope.pageMeta.captcha = true;
      }
    };

    $scope.toggleCsvBox = function(entry) {
      entry.toggle=!entry.toggle;
    };

    $scope.uploadZip = function (_file, cb) {
      // Upload *validated* lipd data to backend
      $scope.pageMeta.busyPromise = Upload.upload({
        url: '/files',
        data: {file: _file.dat,
          filename: _file.filename}
      });
      $scope.pageMeta.busyPromise.then(function (resp) {
        console.log('Success');
        console.log(resp);
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
              // Gather some metadata about the lipd file, and organize it so it's easier to manage.
              lipdValidator.restructure(res, $scope.files, function(_response_1){
                $scope.files = _response_1;
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

