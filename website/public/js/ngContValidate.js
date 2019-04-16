// Controller - Validate Form
angular.module("ngValidate").controller('ValidateCtrl', ['$scope', '$log', '$timeout', '$q', '$http', 'Upload', "ImportService", "ExportService", "$uibModal","$sce", "toaster",
  function ($scope, $log, $timeout, $q, $http, Upload, ImportService, ExportService, $uibModal, $sce, toaster) {

    // Disable console logs in production environment
    var dev = location.host === "localhost:3000";
    if(!dev){
        console.log = function(){};
    }

    // Ontology: archiveType, units, inferredVariableType, proxyObservationType. These fields are pulled from the
    // LinkedEarth Wiki by index.js and served to us on page load. If the response is bad, we use fall back data.
    $scope.ontology = {};

    // Each popover is displayed when hovering over the feedback "requirements met / not met" boxes in the playground.
    // The html data is fetched from ng_create and then rendered into the popover box.
    $scope.lipdPopover = $sce.trustAsHtml(create.getPopover("lipd"));
    $scope.wikiPopover = $sce.trustAsHtml(create.getPopover("wiki"));
    $scope.noaaPopover = $sce.trustAsHtml(create.getPopover("noaa"));
    $scope.progressPopover = $sce.trustAsHtml(create.getPopover("progress"));

    // All dropdown box elements must be bound in the scope.
    $scope.dropdowns = {
        "tabletypepaleo": "",
        "tabletypechron": "",
        // 'current' shows the default selection, or the current selection (when a new selection is made by the user)
      "current": {
        "table": { id: 1, name: 'measurement' },
        "delimiter": { id: 1, name: "\t", view: "Tab ( \\t )"},
        "parseMode": {id: 1, name: "new", view: "Start New"},
        "columnField": {id: 4, name: "notes"},
        "dms": {"lat": {id: 1, name: "N"}, "lon": {id: 1, name: "E"}}
      },
      // Used in the "Add Fields" section of each column.
      "columnFields": create.fieldsList(),
      "tables": [
        { id: 1, name: 'measurement' },
        { id: 2, name: 'summary' },
        // { id: 3, name: 'ensemble' },
        // { id: 4, name: "distribution"}
      ],
      // Old csv data parser: User chooses what delimiter is used by
      "delimiters": [
        { id: 1, name: "\t", view: "Tab ( \\t )"},
        { id: 2, name: ",", view: "Comma ( , )"},
        { id: 3, name: ";", view: "Semi-colon ( ; )" },
        { id: 4, name: "|", view: "Pipe ( | )"},
        { id: 5, name: " ", view: "Space"},
      ],
      // Old csv data parser: User chooses what mode to parse their data.
      "parseMode": [
        { id: 1, name: "new", view: "Start New"},
        { id: 2, name: "update", view: "Update Values in All Existing Columns"},
        { id: 3, name: "add", view: "Add New Column(s) to Existing Table" },
      ],
      // Degrees minutes seconds for Geo section
      "dms": {
        "lat": [{id: 1, name: "N"}, {id: 2, name: "S"}],
        "lon": [{id: 1, name: "E"}, {id: 2, name: "W"}]
      },

      // Ontology: archiveType, units, inferredVariableType, proxyObservationType. These fields are pulled from the
      // LinkedEarth Wiki by index.js and served to us on page load. Data stored in $scope.ontology
      "archiveType": $scope.ontology.archiveType,
      "infVarType": $scope.ontology.infVarType,
      "proxyObsType": $scope.ontology.proxyObsType,
      // Time Unit used in NOAA section
      "timeUnit": create.timeUnitList(),
      // Years list used in Publication section
      "years": create.yearList(),
      // Created By is used in the Root section
      "createdBy": create.createdByList(),
      // Countries is used in the Geo section
      "countries" : map.getCountries()
    };

  /**
   * Initialize the Ontology data. Get the ontology from the backend.
   *
   * Process:  LinkedEarth Wiki > Node > data cleaned up, organized, stored > sent to front end (here)
   */
    var initOntology = function () {
        // Get the ontology data from the node backend
        $http.get("/api/ontology")
            .then(function(response) {
              // Success. Set the data to the scope directly
                $scope.ontology = response.data;
            }, function myError(err) {
                console.log(err);
                // Error, use our hardcoded lists as a fallback.
                $scope.ontology = create.getOntologyBackup();
            });
    };
    // Call the function during page load
    initOntology();

    // NOT CURRENTLY IN USE
    $scope.fields = create.defaultColumnFields();

    // Tooltip library. All tooltips used for the fields on the Playground page are stored here.
    $scope.tooltipLibrary = create.tooltipLibrary();

    // Store for all LiPD file data
    $scope.files = {
      "modal": {},
      "lipdFilename": "",
      "dataSetName": "",
      "fileCt": 1,
      "bagit": {},
      "csv": {},
      "jsonSimple": {"lipdVersion": 1.3},
      "json": {"lipdVersion": 1.3, "pub": [], "funding": [], "dataSetName": "", "geo": {
        "geometry": {"coordinates": []}},
        "paleoData": [{"measurementTable": [{"tableName": "paleo0measurement0", "filename": "paleo0measurement0.csv",
          "columns": []}]}]}
    };
    // Used by : $scope.showModalEditJson, this is a cache of the json metadata in case the user makes changes to the
    // json data and then reverts the changes.
    $scope.jsonCache = null;
    // Metadata about the page view, and manipulations
    $scope.pageMeta = {
      "spreadsheetBeta": true,
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
      "posCt": 0,
      "lipdComplete": 0,
      "lipdCompleteType": "danger",
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

  /**
   * Listen for data merge event to $emit up to us from the MergeCtrl (ngMerge.js) on the Merge page. When this
   * happens, it means that the user triggered a download and we need to bring the data back here to use the
   * $scope.downloadZip() function.
   *
   * @param  {Event}   event   $emit event from MergeCtrl
   * @param  {Object}  data    LiPD Metadata
   * @return none              File download is triggered, nothing returned
   */
    $scope.$on('mergedData', function(event, data){
      // Place new json data into our scope
      $scope.files.json = data;
      // Trigger download, leave empty callback
      $scope.downloadZip(null);
    });

  /**
   * Add an entry to any field that supports multiple entries. Acceptable fields are listed below.
   *
   * Block Types: measurement, summary, ensemble, distribution, funding, pub, author, column, geo, onlineResource
   *
   * @param    {Object}  entry      Any type of metadata block that allows multiple entries.
   * @param    {String}  blockType  Acceptable blockTypes are listed above.
   * @param    {String}  pc         Mode: paleo or chron or null
   * @returns  {Object}  entry      Any type of data block that allows multiple entries.
   */
    $scope.addBlock = function(entry, blockType, pc){

      toaster.pop('success', "Added a new " + blockType + " entry", "", 4000);
      // Need to initialize the first entry of chronData measurement table, when it doesn't yet exist.
      if (pc === "chron" && typeof(entry) === "undefined"){
        $scope.files.json = create.addChronData($scope.files.json, blockType);
      } else {
        // Add a block of data to the JSON. (i.e. funding, paleoData table, publication, etc.)
        entry = create.addBlock(entry, blockType, pc);
      }
      console.log(blockType);
      if(blockType==="measurement" || blockType==="summary"){
          console.log("removing");
          $scope.dropdowns.tabletype="";
      }
    };

  /**
   * Add or remove a property from a given entry. Pass data through to the function in ng_create.js to do the legwork.
   *
   * @param    {Object}  entry      Any type of metadata block that allows multiple entries.
   * @param    {String}  field      The name of the field to add or remove
   * @return   {Object}  entry     Any type of metadata block (with an added OR removed field)
   */
    $scope.addRmProperty = function(entry, field) {
      entry = create.addRmProperty(entry, field);
      return entry;
    };

  /**
   * Add a field to an existing column. This is similar to addRmProperty() because it adds fields to a data block,
   * but it has a lot of special cases so it needed its own function.
   *
   * @param  {Object}   entry   A data table column
   * @return  none
   */
    $scope.addColumnField = function(entry){
      // the 'custom' field stores the name of the field that the user requested to add.
      var _field = entry.tmp.custom;
      // Adding an entry that is a nested array item
      if(["interpretation"].indexOf(_field) !== -1){
        $scope.showModalBlock(entry, true, _field, 0);
      }
      // Adding an entry that is a nested object item
      else if (["calibration", "hasResolution", "physicalSample", "measuredOn"].indexOf(_field) !== -1){
        $scope.showModalBlock(entry, true, _field, null);
      }
      // Adding any regular field
      else if(!entry.hasOwnProperty(_field)){
        if(_field.toLowerCase() === "tsid"){
            $scope.showModalAlert({"title": "Automated field", "message": "You may not add, remove, or edit fields that are automatically generated"});
        } else {
            entry[_field] = "";
        }
      } else if(entry.hasOwnProperty(_field)){
          $scope.showModalAlert({"title": "Duplicate entry", "message": "That field already exists in this column."});
      }
      // Wipe the field input box to be ready for another use.
      entry.tmp.custom = "";
    };

  /**
   *
   * Data and settings to change before and after the intro.js tour is run. In order to give a full tour of features,
   * we need to add in data and turn on switches that show off each section. For example, if the user doesn't have the
   * NOAA or Wiki switches turned on, then turn them on and add some dummy data into those sections. If they don't have
   * a publication entry, add one in so that we can explain the DOI auto-fill feature.
   *
   * Keep track of what changes we make before the tour, so that we can revert those changes when the tour exits. We
   * don't want to leave dummy data and unwanted changes on the page!
   *
   * @param {String}   mode   'before' or 'after', representing which mode of this function to execute
   * @param {Function} cb     Callback function
   */
    $scope.beforeAfterTour = function(mode, cb){
          if(mode === "before"){
              // Keep track of the state of the page BEFORE you start the tour, so you know how to put everything back afterwards
              var beforeSettings = {"noaaReady": false,
                  "pub": {"added": false, "expanded": false},
                  "funding": {"added": false, "expanded": false},
                  "paleo": {"expanded": false, "values": false, "header": false},
                  "column": {"expanded": false, "added": false}
              };
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
              if(!$scope.files.json.pub[0].hasOwnProperty("tmp")){
                  $scope.files.json.pub[0].tmp = {"toggle": true};
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
              if(!pdt.columns[0]){
                  // $scope.$broadcast("tourAdd", pdt);
                  // pdt.columns[0]["tmp"] = {"toggle": true};
                  pdt.columns.push({"number":1, "variableName": "Depth", "units": "cm", "variableType": "measured", "tmp":{"toggle": true}});
                  beforeSettings.column.added = true;
              }
              if(typeof pdt.columns[0].tmp === "undefined"){
                  pdt.columns[0].tmp = {"toggle": true};
                  beforeSettings.column.expanded = false;
              }
              if (!pdt.tmp.toggle){
                  pdt.columns[0].tmp.toggle = true;
                  beforeSettings.column.expanded = false;
              }
              cb(beforeSettings);
          } else if(mode === "after"){
              $scope.pageMeta.noaaReady = $scope.pageMeta.tourMeta.noaaReady;
              $scope.files.json.pub[0].tmp.toggle = $scope.pageMeta.tourMeta.pub.expanded;
              $scope.files.json.funding[0].tmp.toggle = $scope.pageMeta.tourMeta.funding.expanded;
              $scope.files.json.paleoData[0].measurementTable[0].tmp.toggle = $scope.pageMeta.tourMeta.paleo.expanded;
              $scope.pageMeta.header = $scope.pageMeta.tourMeta.paleo.header;
              $scope.files.json.paleoData[0].measurementTable[0].columns[0].tmp.toggle = false;


              if($scope.pageMeta.tourMeta.pub.added){
                  $scope.files.json.pub.splice(0,1);
              }
              if($scope.pageMeta.tourMeta.funding.added){
                  $scope.files.json.funding.splice(0,1);
              }
              if($scope.pageMeta.tourMeta.column.added){
                  $scope.files.json.paleoData[0].measurementTable[0].columns = [];
              }
              cb({});
          }
  };

  /**
   * Check in the browser session storage for a previously saved playground session. If data is found, give the user the
   * option to load it back into memory, clear it, or ignore it.
   *
   * @return  none    The function modifies the controller $scope data.
   */
    $scope.checkSession = function(){
      var _prevSession = sessionStorage.getItem("lipd");
      // Only ask to restore the session on the /playground route, and if a session exists.
      if(_prevSession && window.location.pathname.indexOf("playground") !== -1){
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
    };

  /**
   * Whenever a variableType is added, also add inferredVariableType or proxyObservationType, depending on the value.
   *
   * @param   {Object}  entry  Column Metadata
   */
    $scope.checkVarType = function(entry){
          if(entry.variableType === "measured"){
              if(!entry.hasOwnProperty("proxyObservationType")){
                  entry.tmp.custom = "proxyObservationType";
                  $scope.addColumnField(entry);
                  toaster.pop('note', "proxyObservationType field added", "Field required for " +
                      "measured variables", 4000);
              }
              if(entry.hasOwnProperty("inferredVariableType")){
                  delete entry.inferredVariableType;
              }
          } else if (entry.variableType === "inferred"){
              if(!entry.hasOwnProperty("inferredVariableType")){
                  entry.tmp.custom = "inferredVariableType";
                  $scope.addColumnField(entry);
                  toaster.pop('note', "inferredVariableType field added", "Field required for " +
                      "inferred variables", 4000);
              }
              if(entry.hasOwnProperty("proxyObservationType")){
                  delete entry.proxyObservationType;
              }
          }
      };

  /**
   * Convert coordinates between Decimal Degrees (DD) and Degrees Minutes Seconds (DMS). LiPD standard is DD, but if
   * a user is creating a file from scratch, and their source data is in DMS, then we have a switch that allows them
   * to enter their DMS data. This function will use their DMS data to convert to DD, which will be stored in the LiPD
   * file.  DMS input is only for user convenience.
   *
   * @return none   Data is modified in the controller $scope
   */
    $scope.convertCoordinates = function(){
      // If coordinate data is not yet added, then start with 0,0
      if(typeof($scope.files.json.geo.geometry.coordinates) === "undefined"){
        $scope.files.json.geo.geometry.coordinates = [0,0];
      }
      // Convert the coordinates
      var _vals = misc.convertCoordinates($scope.pageMeta.decimalDegrees, $scope.files.json.geo.geometry.coordinates, $scope.dms);
      // Add the converted data into the geo $scope data
      $scope.files.json.geo.geometry.coordinates = _vals.dd;
      $scope.dms = _vals.dms;
      $scope.dropdowns.current.dms.lat = _vals.dms.lat.dir;
      $scope.dropdowns.current.dms.lon = _vals.dms.lon.dir;
    };

  /**
   * Download data as a NOAA txt file
   * This is the same function as downloadLipd(), with the exception of the closingWorkflowNoaa(). It uses the same
   * idea, but has some extra steps for NOAA data handling. Overall, you clean up the LiPD data, send it to the backend,
   * and then initiate a download once you get a good response.
   *
   * @return   none      A download is started in the browser window when successful
   */
    $scope.downloadNoaa = function(){
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
        var _url_route = "/noaa";
        var _payload = {"name": $scope.files.lipdFilename, "dat": _newScopeFiles};
        $scope.uploadToBackend(_url_route, _payload, function(resp){
            $scope.initiateDownload(resp, "noaa", null);
        });
      });
    };

  /**
   * Download LiPD File
   * Complete steps to cleanup and organize data for download. When data is prepped, send it to the backend to be
   * packaged as a LiPD file, and then come back here to initiate the file download.
   *
   * @param   {Function}  cb    (WIP) Callback function, used to provide Wiki API with a file_id to retrieve file. Used
   *                             to upload file straight to the wiki with the "Upload to Wiki" button.
   */
    $scope.downloadZip = function(cb){
      $scope.files.dataSetName = $scope.files.json.dataSetName;
      $scope.files.lipdFilename = $scope.files.dataSetName + ".lpd";
      // If there are still errors present, notify the user that the file may present issues
      if ($scope.feedback.errCt > 0){
        $scope.showModalAlert({"title": "File contains errors", "message": "You are downloading data that still has errors. Be aware that using a file that isn't fully valid may cause issues."});
      }
      // Correct the filenames, clean out the empty entries, and make $scope.files data ready for the ExportService
      var _newScopeFiles = create.closingWorkflow($scope.files);
      // Go to the export service. Create an array where each object represents one output file. {Filename: Text} data pairs
      $scope._myPromiseExport = ExportService.prepForDownload(_newScopeFiles);
      $scope.pageMeta.busyPromise = $scope._myPromiseExport;
      $scope._myPromiseExport.then(function (filesArray) {
        // Upload zip to node backend, then callback and download it afterward.
        console.log("Let me bring this to the backroom.");
        // Set up where to POST the data to in nodejs, and package the payload.
        var _url_route = "/files";
        var _payload = {"filename": $scope.files.lipdFilename, "file": filesArray};
        $scope.uploadToBackend(_url_route, _payload, function(resp){
            // Initiate the download on the browser window.
            $scope.initiateDownload(resp, "files", cb);
        });
      });
    };

    $scope.duplicateColumn = function(entry, idx){
        var _dup = JSON.parse(JSON.stringify(entry.columns[idx]));
        _dup.tmp.toggle = false;
        _dup.TSid = misc.generateTSid();
        entry.columns.push(_dup);
        toaster.pop('success', "Duplicated column", "", 4000);
    };

  /**
   * Expand the view of a data block on the Playground page. Example, 'x' may be an array of funding objects, and
   * 'entry would be a single funding entry from that 'x' array.
   *
   * @param  {Array}    x      An Array of data objects
   * @param  {Object}   entry  One entry from an array of data objects (x)
   * @return none              Data is modified in place by two-way binding
   */
    $scope.expandEntry = function(x, entry){
      // Turn off ALL toggles in the given chunk of metadata
      x = create.turnOffToggles(x, "toggle");
      // Ise there a toggle field yet?
      if (typeof entry.tmp === "undefined"){
        // No, add the full object with the toggle turned on
        entry["tmp"] = {"toggle": true};
      } else{
        // Turn on the toggle that already exists
        entry.tmp.toggle = true;
      }
    };

  /**
   * Use the DOI from the publication entry to auto-fill the publication fields with as much data as possible. The DOI
   * is used with the doi.org API to get data.
   *
   * @param   {Object}    entry   One publication entry
   * @return  {Object}    entry   One publication entry (w/ new doi.org data filled in)
   */
    $scope.fetchPublication = function(entry){
        var _doi = entry.doi;
      console.log(entry);
      console.log(_doi);
      // Regex for validating a DOI string.
      var _re = /\b(10[.][0-9]{3,}(?:[.][0-9]+)*\/(?:(?![\"&\'<>,])\S)+)\b/;
      // Validate the DOI string given against the DOI regex.
      var _match = _re.exec(_doi);
      console.log(_match);
      // Is the DOI valid?
      if (_match){
        // The DOI is valid. Create the doi.org URL for the API request.
        var _url =  "http://dx.doi.org/" + _doi;
        // Make the HTTP Get request to doi.org and wait for a response.
        $http({
          "method": "GET",
          "url": _url,
          "headers": {"accept": "application/rdf+xml;q=0.5, application/citeproc+json;q=1.0"}
        })
          .then(function (response) {
            // We got a successful API response.
            console.log("DOI Response object");
            console.log(response);
            // Sort the data and use our map to match doi.org keys to our LiPD keys. The data is placed into the
            // publication entry here.
            entry = create.sortDoiResponse(response, entry);
          }, function(response) {
            // Something went wrong. There was an error making a GET request to the API
            console.log("Unable to fetch DOI data: ");
            // console.log(response);
            alert("HTTP 404: No data found for that DOI");
          });
        // Whenever a successful DOI auto-fill is complete, set this warning flag. This flag triggers a banner at the
        // top of the publication entry that tells the user to verify the data check for mistakes. The auto-fill
        // process isn't an exact science and sometimes has incomplete, conflicting data, or data mapped to different
        // keys.
        entry.tmp.doiWarn = true;
      } else {
        // The DOI string given was not valid. Don't continue
        alert("DOI entered does not match the DOI format");
      }
      // Return the entry, with or without new publication data.
      return entry;
    };

  /**
   * 'TakenAtDepth' can point to other columns of the same table. It uses the column variableNames as reference. Gather
   * all the variableNames that are currently in the table, and add them as the options for TakenAtDepth.
   *
   * @param   {Object}   entry  Table metadata
   * @return  none
   */
    $scope.gatherVariableNames = function(entry){
        entry.tmp.varNames = [];
        if(entry.hasOwnProperty("columns")){
            for(var _i = 0; _i < entry.columns.length; _i++){
                if(entry.columns[_i].hasOwnProperty("variableName")){
                    if(entry.columns[_i].variableName){
                        var _tsid = entry.columns[_i].TSid || "";
                        if(!_tsid){
                            _tsid = misc.generateTSid();
                            entry.columns[_i].TSid = _tsid;
                        }
                        var _value = _tsid + " - " + entry.columns[_i].variableName;
                        entry.tmp.varNames.push(_value);
                    }
                }
            }
        }
        console.log(entry.tmp.varNames);
    };

  /**
   * Get the tooltip for a specific field from a specific section. Tooltips are retrieved dynamically so that fields
   * generated in an ngRepeat loop are still able to have tooltips.
   *
   * @param   {String}   section    The section that the field resides in
   * @param   {String}   key        The name of the field to get the tooltip for
   * @return  {String}              A tooltip string
   */
    $scope.getTooltip = function(section, key){
      return create.tooltipLibrary(section, key);
    };

  /**
   * Initiate a file download
   * Once data is prepped and ready in the backend, use the file id that we get in the response to initiate a file
   * download in the browser.
   *
   * @param  {Object}    resp   Backend server response data (status and file id)
   * @param  {String}    mode   'noaa' or 'files' mode. The backend routes are different for each. ('files' is for lipd)
   * @param  {Function}  cb     Callback for 'Upload to Wiki' data
   * @return none
   */
    $scope.initiateDownload = function(resp, mode, cb){
      // mode: "noaa" or "files"
      console.log("Received backend response");
      console.log(resp);
      if (resp.status !== 200){
          window.alert("HTTP " + resp.status + ": Error completing request\n" + resp.statusText);
      } else {
          console.log("We have liftoff. Here ya go!");
          // If there is a callback, that means we're doing a wiki upload and need to send the response data in the
          // callback.
          // Are we on dev or production? Create the url according to the mode.
          var _url = "";
          var _fileID = resp.data;
          if(dev){
              // Dev mode download link
              _url = "http://localhost:3000/" + mode + "/" + _fileID;
          } else {
              // Production mode download link
              _url = "http://www.lipd.net/" + mode + "/" + _fileID;
          }
          // Is there a callback?
          if(cb){
              // We're attempting to upload the file to the Wiki, so send the data through the callback.
              cb(resp.data);
          } else {
              // Normal download. Start the download on this window.
              window.location.href = _url;
          }
      }
    };

  /**
   * Determine if the field is known to be an Array data type.
   *
   * @param    {String}  field   Field name
   * @return   {Boolean}         True for Array, False for other data types
   */
    $scope.isArr = function(field){
        // Data is an Array if the field is in this list.
        return ["interpretation"].includes(field);
    };

  /**
   * Determine if a field is known to be an auto-complete input type.
   *
   * @param    {String}    field   Field name
   * @return   {Boolean}           True for auto-complete, False for other input type
   */
    $scope.isAutocomplete = function(field){
        // These fields use an auto complete input box with suggested data from the linked earth wiki ontology.
        return ["takenAtDepth", "proxyObservationType", "inferredVariableType", "inferredFrom"].includes(field);
    };

  /**
   * Determine if a field is an ontology field that relies on a data array of input options from the scope.
   *
   * @param    {String}    field   Field name
   * @return   {Boolean}           True for auto-complete, False for other input type
   */
    $scope.isOntology = function(field){
      // These fields use an auto complete input box with suggested data from the linked earth wiki ontology.
      return ["proxyObservationType", "inferredVariableType", "variableType"].includes(field);
  };

  /**
   * Determine if a field is known to be an object data type.
   *
   * @param    {String}    field   Field name
   * @return   {Boolean}           True for Object, False for other data types
   */
    $scope.isObject = function(field){
          // Data is a block if the field is in this list.
          return ["physicalSample", "hasResolution", "calibration", "measuredOn"].includes(field);
      };

  /**
   * Determine if a field is one that should be hidden from the "additional fields" section. These are fields that
   * are temporarily stored to help run the page view, or are already shown elsewhere in the column.
   *
   * @param  {String}  field  Field name
   * @return {Boolean}        True for hidden field, False for normal field
   */
    $scope.isHidden = function(field){
        // Do not show any temporary fields or fields that are static for each column
        return ["number", "toggle", "tmp", "values", "checked", "units", "TSid", "variableType", "description",
            "variableName"].includes(field);
    };

  /**
   * Determine if a field is one that should reference another column in the same table.
   *
   * @param  {String}  field  Field name
   * @return {Boolean}        True for hidden field, False for normal field
   */
    $scope.isLinkColumns = function(field){
          // Do not show any temporary fields or fields that are static for each column
          return ["takenAtDepth", "inferredFrom"].includes(field);
      };

  /**
   * Determine if a field is a column property that should be shown in the "additional fields" section.
   * Any field that is not an object, not an array, not a static column field, and not a behind-the-scenes helper field.
   *
   * @param    {String}    field   Field name
   * @return   {Boolean}           True for field to show, False for field to hide
   */
    $scope.showField = function(field){
        return !$scope.isHidden(field) && !$scope.isObject(field) && !$scope.isArr(field);
    };

  /**
   * Make the data NOAA ready
   * For turning switch on:
   * Add all the NOAA required fields to the page and add NOAA validation rules to the validation process.
   *
   * For turning switch off:
   * Remove the validation rules. The NOAA section view gets hidden. All data linked to NOAA related fields remain intact.
   *
   * @param   {String}   alert   Message to show in alert modal box
   * @return  none               All modifications made to the controller scope.
   */
    $scope.makeNoaaReady = function(alert){
        // Alert: True if alerts should be displayed, False if not.
        // Why? Because we don't want the modal alerts to pop up when users take the tour of the page. It prohibits scrolling.

      // The noaaReady boolean is bound to the switch
      if(!$scope.pageMeta.noaaReady){
        // Make Ready
        create.addFieldsToCols($scope.files.json, ["measurementMaterial","error", "NOAAseasonality",  "NOAAdataType", "detail", "measurementMethod", "NOAAdataFormat", "notes"], function(_d2){

            if(alert){
                $scope.showModalAlert({"title": "NOAA Validation", "message": "The fields that NOAA requires have been " +
                    "added where necessary. For a list of these requirements, hover your mouse pointer over the 'NOAA " +
                    "requirements' bar on the left side of the page. Reference the 'NOAA Variable Naming' link under 'Quick Links' on the home page for variable information."});
            }
          $scope.files.json = _d2;
        });
        // We need to add online resource specifically if it is not present. It's because this field allows for multiple entries.
        if(!$scope.files.json.hasOwnProperty("onlineResource")){
            $scope.files.json.onlineResource = [{"onlineResource": "", "description": ""}];
        }
      } else {
          if(alert){
              // Don't remove fields, only remove validation rules
              $scope.showModalAlert({"title": "Fields may be ignored", "message": "Validation is no longer using NOAA rules."});
          }
      }
    };

  /**
   * Make the data Wiki ready
   * For turning switch on:
   * Add all the Wiki required fields to the page and add Wiki validation rules to the validation process.
   *
   * For turning switch off:
   * Remove the validation rules. All data linked to Wiki related fields remain intact.
   *
   * @return  none    All modifications made to the controller scope.
   */
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

  /**
   * Parse csv data from the textarea element in the paleoData and chronData sections. This is the original csv parser,
   * and has since been partially replaced by the
   *
   * @param    {Object}  table      Table metadata
   * @param    {Number}  parentIdx  The index of the parent object. (ie. paleoData[2] or chronData[1])
   * @param    {Number}  idx        The index of the table object.  (i.e. paleoData[1]measurementTable[1])
   * @param    {Object}  options    'pc' (paleo, chron) 'and' tt (table type of 'measurement', 'summary')
   * @return   {Object}  table      Table metadata (with data added or modified)
   */
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
      // console.log("Parse Table---");
      // console.log(table);
      return table;
    };

  /**
   * Use zip.js to read in a LiPD file from a direct url source.
   *
   *
   * @param    {Object}   resp   The full response object from the LiPD source URL. Forwarded from the backend request.
   * @return   none             The LiPD data is pulled from the source and loaded into the controller $scope.
   */
    $scope.remoteFilePull = function(resp){
      try {
          zip.createReader(new zip.DataReader(resp), function(reader) {
              reader.getEntries(function (entries) {
                  // Before we do anything with the LiPD data upload, we need to make sure that the jsonld is valid and usable
                  // If it is not, then either the user needs to manually fix the errors through a dialog box, or we need to
                  // cancel the file upload.
                  $scope.validateJsonld(entries, function(entries){
                      // If the user cancelled fixing the JSON data, then they cannot continue with the upload.
                      if(entries){
                          // Use the Import service to parse data from the ZipJS entries
                          $scope.pageMeta.busyPromise = ImportService.parseFiles(entries);
                          $scope.pageMeta.busyPromise.then(function (res) {
                              // There will be one undefined entry in this array. Placeholder for the original JSON promise.
                              // Remove it. We already have the fixed JSON as a separate entry.
                              res = res.filter(function(n){ return n !== undefined });
                              // Set response to allFiles so we can list all the filenames found in the LiPD archive.
                              $scope.allFiles = res;
                              $scope.pageMeta.fileUploaded = true;
                              $scope.pageMeta.keepColumnMeta = true;
                              // Gather some metadata about the lipd file, and organize it so it's easier to manage.
                              lipdValidator.restructure(res, $scope.files, function(_response_1){
                                  $scope.files = _response_1;
                                  if($scope.files.fileCt > 40){
                                      $scope.showModalAlert({"title": "Wow! That's a lot of files!", "message": "We expanded the page to fit everything, so be sure to scroll down to see your data tables."});
                                  }
                                  if(typeof($scope.files.json) !== "object"){
                                      $scope.showModalAlert({"title": "Metadata.jsonld file is incorrect", "message": "There is something wrong with that file. The metadata.jsonld file is missing or incorrectly formatted. Please check the file manually, or create an issue on our Github repository and provide the problematic file."});
                                      $scope.resetPage();
                                  } else {
                                      $scope.validate();
                                      $scope.files.json = create.initColumnTmp($scope.files.json);
                                      $scope.files.json = create.initMissingArrs($scope.files.json);
                                      $scope.$broadcast('newUpload', $scope.files);
                                  }
                              }); // end sortBeforeValidate
                              //RETURNS OBJECT : {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.status};
                          }, function(reason){
                              $scope.resetPage();
                              alert("Error parsing JSON-LD file. File cannot be validated");
                          }); // end ImportService
                      }
                  });
              });
          }, function(error) {
              // onerror callback
              console.log("remoteFilePull zip.js: Error reading remote file");
              console.log(error);
              $scope.showModalAlert({"title": "LiPD Upload via URL failed", "message": "ERROR: " + error + ". The query in the URL did not work. Unable to load the LiPD file via URL source. Please check that your URL points directly to a LiPD file and the link works."});
              });
      } catch(err){
          console.log("remoteFilePull: tryCatch: ");
          console.log(err);
      }
  };

  /**
   *
   * Users may upload an externally hosted LiPD file to the playground via a direct link url to that LiPD file.
   * Example:  www.lipd.net/playground?source=http://www.website.com/somelipdfile.lpd
   *
   * @return   none     The LiPD file will be downloaded and its data will be placed into the controller $scope.
   */
    $scope.remoteFileUpload = function(){
        try{
            // Remote source URL was found in URL path. Parse out the remote source url from the full path.
            // Get the query data that is after the query '?' question mark.
            var search = location.search.substring(1);
            // Turn the substring into a JSON object for easier use.
            var _url = search.split("source=")[1];
            if(_url){
                console.log("Remote LiPD source found");
                // Send the source url to the backend, and let node go GET the LiPD file.
                // console.log("Let me bring this to the backroom.");
                var _url_route = "/remote";
                var _payload = {"source": _url};
                $scope.uploadToBackend(_url_route, _payload, function(resp){
                    // LiPD data received in JSON object form, now integrate it into the controller scope.
                    // Manually place the data or find a way to hook into the file upload process.
                    console.log("Remote data received from: ", _url);
                    console.log(resp);
                    $scope.remoteFilePull(resp);
                });
            }
        } catch(err){
            // Remote source URL not found in url path. Continue as normal.
            console.log("remoteFileUpload : No remote source url found: ");
            console.log(err);
        }
    };

  /**
   * Remove an entry (object) from an array.
   *
   * @param    {Array}   entry   An array of objects. (ex: funding, publication, etc)
   * @param    {Number}  idx     Object index to remove
   */
    $scope.removeBlock = function(entry, idx){
      create.rmBlock(entry, idx);
    };

  /**
   * Reset the parsed csv data each time after data is parsed. We want to keep the textarea element clear for parsing
   * new data at all times.
   *
   * @param    {Object}   table   Table metadata
   * @return   {Object}   table   Table metadata (w/ temp csv data reset)
   */
    $scope.resetCsv = function(table){
      // To reset a parsed CSV table, you need to undo all of the below
      // table.values, table.filename, entry.columns,
      // $scope.files.csv[_csvname] = _csv;
      table.tmp.values = "";
      table.tmp.parse = false;
      $scope.files.csv[table.filename] = null;
      // entry.filename = null;
      table.columns = null;
      table.tmp.toggle = !table.tmp.toggle;
      return table;
    };

  /**
       * Reset all the data for playground page status and view. Reset LiPD file data that was uploaded or created.
       * This is a complete page reset that is essentially a page refresh without having to refresh the page. Hop right
       * into your next file.
       *
       * @return  none   All data modified in the controller $scope
       */
    $scope.resetPage = function(){
      // All metadata and data about the page is emptied when the Upload button is clicked. Ready for another file upload.
      $scope.allFiles = [];
      $scope.feedback = {
        "lipdVersion": "NA",
        "missingTsidCt": 0,
        "lipdComplete": 0,
        "lipdCompleteType": null,
        "posCt": 0,
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
        "fileCt": 1, // This should always be at least 1, because metadata.jsonld is always present
        "bagit": {},
        "csv": {},
        "jsonSimple": {"lipdVersion": 1.3},
        "json": {"lipdVersion": 1.3, "createdBy": "lipd.net", "pub": [], "funding": [], "dataSetName": "", "geo": {
          "geometry": {"coordinates": []}},
          "paleoData": [{"measurementTable": [{"tableName": "paleo0measurement0", "filename": "paleo0measurement0.csv",
            "columns": []}]}]}
      };
      $scope.pageMeta = {
        "spreadsheetBeta": true,
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

  /**
   *  Remove the FULL paleoData or chronData section. This could potentially be a lot of data, so a modal pops up to
   *  ask you if you're sure you want to complete the operation.
   *
   * @param   {String}  pc    'paleo' or 'chron'. The section to be deleted.
   * @return  none            All data modified in the controller $scope.
   */
    $scope.removePaleoChron = function(pc){
      // Ask the user if they're absolutely sure they want to delete this data.
      $scope.showModalAsk({"title": "Delete ALL data in this section?",
          "message": "Are you sure you want to delete all data from the " + pc + "Data section? I won't be able to bring it back.",
        "button1": "Yes",
        "button2": "No"}, function(truth){
        // Yes, they want to delete the data.
        if(truth === true){
          if(pc === "chron"){
            // Remove the chronData by setting it to an empty array.
            $scope.files.json.chronData = [];
          } else if (pc === "paleo"){
            // Remove the paleoData by setting one table in the array and leaving the data empty.
            $scope.files.json.paleoData = [{"measurementTable": [{"tableName": "", "missingValue": "NaN",
              "filename": "", "columns": []}]}];
          }
        }
      });
    };

  /**
   * Remove a field entry from a data column. All fields can be removed except for TSid, which isn't in view on the
   * page anyways.
   *
   * @param   {Object}  column   Column Metadata
   * @param   {String}  _field   Name of field to remove
   * @return  none               All data modified in controller $scope
   */
    $scope.rmColumnField = function(column, _field){
      if(column.hasOwnProperty(_field)){
        if (["TSid"].indexOf(_field) !== -1){
          $scope.showModalAlert({"title": "Restricted field", "message": "You may not add, remove, or edit fields that are automatically generated"});
        } else {
          delete column[_field];
        }
      }
    };

  /**
   * The LiPD playground can consume a lot of time if you are working on big data sets or trying to fulfill certain
   * agency requirements. In a perfect world, we'd auto-save progress to a database and keep snapshots of your work in
   * case you lost connection, experienced a power outage, or some other unforeseen event. Since that's not feasible
   * right now, we have a button that will save your work progress to the browser session storage for as long as the
   * browser remains open.
   *
   */
    $scope.saveSession = function(){
      try{
        delete $scope.pageMeta.busyPromise;
        // Information to store. It's easier to save and load the data while it's in pieces.
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
        // console.log($scope.roughSizeOfObject(_dat));'
        // Data gets saved to session storage
        sessionStorage.setItem("lipd", _dat);
        // A notification shows the user that the data is saved
        toaster.pop('note', "Saving progress...", "Saving your data to the browser session in case something goes wrong", 4000);
      } catch(err){
        // A notification shows the user that there was a problem saving the data. Sometimes large datasets will not save.
        toaster.pop('error', "Error saving progress", "Unable to save progress. Data may be too large for browser storage", 4000);
      }
    };

  /**
   * Adding country / properties block to the Geo section.
   *
   * @param   {String}  name    Country name
   * @return  none              All data modified in controller scope.
   */
    $scope.setCountry = function(name){
    // If the Geo section does not have 'properties' data, then we need to add it before you can set the country.
    if (!$scope.files.json.geo.properties.country){
        $scope.files.json.geo = create.addBlock($scope.files.json.geo, "geo", null);
    }
      // Set the country name to the country field.
      $scope.files.json.geo.properties.country = name;
    };

  /**
   * Show a modal window for an alert message
   * msg = {"title": "", "msg": ""}
   *
   * @param  {Object}   msg   Message to display to the user
   * @return none
   */
    $scope.showModalAlert = function(msg){
      $scope.modal = msg;
      // Use the uib module to open the modal
      var modalInstance = $uibModal.open({
        templateUrl: 'modal-alert',
        controller: 'ModalCtrlAlert',
        size: "md",
        resolve: {
          data: function () {
            // Pass the message through to the modal controller.
            return $scope.modal;
          }
        }
      });
    };

  /**
   *  Show a modal window with options that the user can click.
   * msg = {"title": "", "message": "", "button1": "", "button2": "", "button3": ""}
   *
   * @param   {Object}   msg   The message to display to the user.
   * @param   {Function} cb    Callback function
   */
    $scope.showModalAsk = function(msg, cb){
      $scope.modal = msg;
        // Use the uib module to open the modal
        var modalInstance = $uibModal.open({
        templateUrl: 'modal-ask',
        controller: 'ModalCtrlAsk',
        size: "md",
        resolve: {
          data: function () {
            // Send the data options through to the modal.
            return $scope.modal;
          }
        }
      });
      modalInstance.result.then(function (selected) {
        // Take the user's answer from the modal and pass it through to the callback
        cb(selected);
      });
    };

  /**
   * Show a modal window to edit block data. For example, the column fields 'hasResolution' and 'interpretation' have
   * nested data, which is an array that cannot be edited through a regular input field. We make each object in the
   * array into a button, and the button activates this modal for editing the contents of the object.
   *
   * options = {"data": [] or {}, "create": bool, "key": "", "idx": null or int}
   *
   * @param   {Object}   entry    Data column
   * @param   {Boolean}  _create  If this field does not yet have data, create the object before opening the modal
   * @param   {String}   _key     Field (key) name
   * @param   {Number}   idx      The index number of
   * @return  {Object}   entry    Data column, with the target field data modified
   */
    $scope.showModalBlock = function(entry, _create, _key, idx){
      // If an index is given, that means the data belongs to an array
      // If an index is not given, that means it's an object, so leave arrType null.
      var arrType = idx !== null;
      // Get the field data from the column.
      var _data = entry[_key];
      // If data not initialized or creating from scratch, and is not an array type, create the object.
      if((typeof _data === 'undefined' || !_data) && !arrType){
        _data = {};
      }
      // If data not initialized or creating from scratch, and is an array type, create the array.
      else if ((typeof _data === 'undefined' || !_data) && arrType){
        _data = [];
      }
      // Create the data object if true and if field is an array data type.
      if(_create && arrType){
        // Set new index to last item in the array
        idx = _data.length;
        // Push empty object onto the array.
        _data.push({});
      }
      // Set options to pass to modal controller
      $scope.modal = {"data": _data, "create": _create, "key": _key, "idx": idx};
      // Use the uib module to open the modal
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
      // Receive the data back from the modal when the modal closes
      modalInstance.result.then(function (new_data) {
        // User chose to delete the data.
        if (new_data === "delete"){
          // Data is an array
          if(arrType){
            // Delete the index from the array
            _data.splice(idx, 1);
            // Set the data back to the field inside the data column
            entry[_key] = _data;
          }
          // Data is an object
          else {
            // Delete the object from the column data
            delete entry[_key];
          }
        }
        // User cancelled the modal window.
        else if(new_data !== "cancel"){
          // Take no action to the data. Return as-is.
          entry[_key] = new_data;
        }
        // Return the data entry, with possible modified data.
        return entry;
      });
      // Return the entry as-is, if the modal window didn't work for some reasonm.
      return entry;
    };

  /**
   * Show a modal window that displays the raw contents of the csv, jsonld, or txt files that are within a LiPD archive.
   * If it's the jsonld file, you can edit the json data in the modal window. For csv and txt files, you may only view.
   * data = {"data": {}, "options": {"title": "", "initialUpload": boolean}}
   *
   * @param   {Object}   data    File data and options for the modal
   * @return  none               Data modified in controller scope
   */
    $scope.showModalFileContent = function(data){

      // If this is the metadata.jsonld file, we want to open the advancedJsonEdit modal window
      if(data.type === "json"){
        $scope.advancedJsonEdit();
      }
      // If csv or txt file data, then show the data in a view-only modal window
      else {
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
      }
    };

  /**
   * Start the introjs page tour. Initializes the introjs object and makes the necessary changes to the web page so
   * that the user can see and interact with all page options. (ie. inserting dummy data, enabling wiki and NOAA
   * data sections, etc)
   */
    $scope.startTour = function(){
      // Init introjs
      var intro = introJs();
      // Give the tour steps and options to the introjs object
      intro.setOptions({
        steps: create.tourSteps()});
      // Add in dummy data and make page changes to show off page features.
      $scope.beforeAfterTour("before", function(tourMeta){
        $scope.pageMeta.tourMeta = tourMeta;
        // Start the tour
        intro.start();
      });
      // Tour was exited
      intro.onexit(function() {
        // Remove all dummy data and change the page back to its original state.
        $scope.beforeAfterTour("after", function(tourMeta){
          $scope.pageMeta.tourMeta = tourMeta;
        });
      });
    };

  /**
   * Toggle the CSV parse box. When table data has been parsed, we no longer need to show the box. If the user wants
   * to re-parse data or modify the table values in some way, they can press a button to toggle the parse box back into
   * view.
   *
   * @param   {Object}  entry   Table metadata
   * @return  none
   */
    $scope.toggleCsvBox = function(entry) {
      entry.tmp.parse=!entry.tmp.parse;
    };

  /**
   * Update the file list that is in the feedback section of the page.
   * We use ng-repeat to create file links in the file list in the feedback section. ng-repeat needs an array, and the
   * CSV data is not stored in an array. Every time we run a validation cycle, update the data for the fileList to be
   * current.
   *
   * @param   {Array}  fileList     List of files in the LiPD archive
   * @param   {Object} csvs         Csv data sorted by filename
   * @return  {Array}  _newFileList List of files in the LiPD archive (updated)
   */
    $scope.updateFilesList = function(fileList, csvs){
        // Output file list
        var _newFileList = [];
        // Loop for each file in the current file list
        // Bagit files are only present if a file was uploaded. NOT if it was created from scratch.
        for(var _p=0; _p<fileList.length; _p++){
          // Copy over the jsonld and txt files
          if(fileList[_p]["type"] !== "csv"){
            // Push files onto the new file list as-is
            _newFileList.push(fileList[_p]);
          }
        }
        // Loop for each csv file in the scope data
        for(var _filename in csvs){
          if(csvs.hasOwnProperty(_filename)){
            // Push the csv file onto the new file list
            _newFileList.push({"filenameShort": _filename, "type": "csv", "data": csvs[_filename].data});
          }
        }
        // Return the new file list.
        return _newFileList;
    };

  /**
   * After a LiPD file is uploaded with the "choose file" button, we need to set the value back to null so that it's
   * ready in case another file is uploaded later.
   */
    $scope.uploadBtnClick = function(){
        this.value = null;
    };

  /**
   * LiPD file upload
   * When there is an event change on the file upload button, go through the process of uploading the LiPD file into
   * the page.
   *
   * Use the zip.js library to upload the file.
   *
   * @param  {Object}     event   Data from button event listener.
   * @param  {Function}   cb      Callback function or null.
   */
    $scope.uploadBtnChange = function(event, cb){
      var fileInput = event.target;
      // console.log(event.target.files);
      // // var fileInput = document.getElementById("file-input");
      // // if the upload button is clicked && a file is chosen, THEN reset the page and data.
      $scope.resetPage();
      $scope.files.lipdFilename = fileInput.files[0].name;
      $scope.files.dataSetName = fileInput.files[0].name.slice(0, -4);
      // Get a list of file entries inside this LiPD upload
      // console.log(fileInput.files[0]);
      $scope.model.getEntries(fileInput.files[0], function (entries) {
          // Before we do anything with the LiPD data upload, we need to make sure that the jsonld is valid and usable
          // If it is not, then either the user needs to manually fix the errors through a dialog box, or we need to
          // cancel the file upload.
          // console.log(entries);
          $scope.validateJsonld(entries, function(entries){
              // If the user cancelled fixing the JSON data, then they cannot continue with the upload.
              if(entries){
                  // Use the Import service to parse data from the ZipJS entries
                  $scope.pageMeta.busyPromise = ImportService.parseFiles(entries);
                  $scope.pageMeta.busyPromise.then(function (res) {
                      // There will be one undefined entry in this array. Placeholder for the original JSON promise.
                      // Remove it. We already have the fixed JSON as a separate entry.
                      res = res.filter(function(n){ return n !== undefined });
                      // Set response to allFiles so we can list all the filenames found in the LiPD archive.
                      $scope.allFiles = res;
                      $scope.pageMeta.fileUploaded = true;
                      $scope.pageMeta.keepColumnMeta = true;
                      // Gather some metadata about the lipd file, and organize it so it's easier to manage.
                      lipdValidator.restructure(res, $scope.files, function(_response_1){
                          $scope.files = _response_1;
                          if($scope.files.fileCt > 40){
                              $scope.showModalAlert({"title": "Wow! That's a lot of files!", "message": "We expanded the page to fit everything, so be sure to scroll down to see your data tables."});
                          }
                          if(typeof($scope.files.json) !== "object"){
                              $scope.showModalAlert({"title": "Metadata.jsonld file is incorrect", "message": "There is something wrong with that file. The metadata.jsonld file is missing or incorrectly formatted. Please check the file manually, or create an issue on our Github repository and provide the problematic file."});
                              $scope.resetPage();
                          } else {
                              $scope.validate();
                              $scope.files.json = create.initColumnTmp($scope.files.json);
                              $scope.files.json = create.initMissingArrs($scope.files.json);
                              $scope.$broadcast('newUpload', $scope.files);
                          }
                      }); // end sortBeforeValidate
                      //RETURNS OBJECT : {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.status};
                  }, function(reason){
                      $scope.resetPage();
                      alert("Error parsing JSON-LD file. File cannot be validated");
                  }); // end ImportService
              }
          });
      });
      // once the change even has triggered, it cannot be triggered again until page refreshes.
      typeof cb === 'function' && cb();
  };

  /**
   * Upload LiPD file to the Lipdverse
   * Go through the normal process of creating a LiPD file from the form data. Send that LiPD file to our dropbox where
   * it will be reviewed for upload on the Lipdverse
   *
   * @return none  Result is a file uploaded to lipdverse dropbox.
   */
    $scope.uploadToLipdverse = function(){
        // Use the uib module to open the modal
        $uibModal.open({
            templateUrl: 'modal-lipdverse',
            controller: 'ModalCtrlLipdverse',
            size: "lg",
            resolve: {
                data: function () {
                    // Pass the message through to the modal controller.
                    return $scope.modal;
                }
            }
        }).result.then(function(info){
            // Information provided by user
            if(info){
                // Start the
                $scope.files.dataSetName = $scope.files.json.dataSetName;
                $scope.files.lipdFilename = $scope.files.dataSetName + ".lpd";
                // If there are still errors present, notify the user that the file may present issues
                if ($scope.feedback.errCt > 0){
                    $scope.showModalAlert({"title": "File contains errors", "message": "You are downloading data that still has errors. Be aware that using a file that isn't fully valid may cause issues."});
                }
                // Correct the filenames, clean out the empty entries, and make $scope.files data ready for the ExportService
                var _newScopeFiles = create.closingWorkflow($scope.files);
                // Go to the export service. Create an array where each object represents one output file. {Filename: Text} data pairs
                $scope._myPromiseExport = ExportService.prepForDownload(_newScopeFiles);
                $scope.pageMeta.busyPromise = $scope._myPromiseExport;
                $scope._myPromiseExport.then(function (filesArray) {
                    // Upload zip to node backend, then callback and download it afterward.
                    console.log("Let me bring this to the backroom.");
                    // Set up where to POST the data to in nodejs, and package the payload.
                    var _url_route = "/files";
                    var _payload = {"filename": $scope.files.lipdFilename, "file": filesArray, "lipdverseText": info};
                    $scope.uploadToBackend(_url_route, _payload, function(resp){
                        console.log("Received backend response");
                        console.log(resp);
                        if (resp.status !== 200){
                            window.alert("HTTP " + resp.status + ": Error completing request\n" + resp.statusText);
                        } else {
                            var _fileID = resp.data;
                            $http.get("/lipdverse/" + _fileID).then(function(res){
                                toaster.pop('success', "File sent to Lipdverse. Pending review.", "", 4000);
                            }, function error(err){
                                toaster.pop('error', "Lipdverse upload failed. Please try again later.", "", 4000);
                                console.log(err);
                            });
                        }
                    });
                });
            }
        });


    };

  /**
   * LiPD file upload button.
   * Function initializes on window load. When the upload button is used, the
   */
    $scope.uploadBtnUpload = function(){
        // Set up zip.js object and its corresponding functions. The ZipJS module includes this code as part of the
        // tutorial on how to get started. This code is minimally modified to fit our code.
        var requestFileSystem = this.webkitRequestFileSystem || this.mozRequestFileSystem || this.requestFileSystem;
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
        $scope.model = function () {
            var zipFileEntry, zipWriter, writer, creationMethod;
            URL = window.webkitURL || this.mozURL || this.URL;

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
            };
        }();
        $scope.model.setCreationMethod("Blob");
    };

  /**
   * Upload playground data directly to the LinkedEarth Wiki via their API. The upload only works if the user is logged
   * into the wiki. I'm not certain what a successful response looks like. A failed upload does not return an error or
   * any other info.
   *
   * WIP: This function is not working yet. Waiting on Varun to give me answers on how to interface the API. No answers
   * yet.
   *
   * @return    none   Return a good or bad response, depending on the result.
   */
    $scope.uploadToWiki = function(){
        // If the data is validated and passes wiki standards..
        if($scope.feedback.validWiki === 'PASS'){
            // Use the uib module to open the modal
            $uibModal.open({
                templateUrl: 'modal-wiki',
                controller: 'ModalCtrlWiki',
                size: "md",
                resolve: {
                    data: function () {
                        // Pass the message through to the modal controller.
                        return $scope.modal;
                    }
                }
            }).result.then(function(success){
                if(success){
                    // Start the steps needed to upload the data with the wiki API.
                    $scope.downloadZip(function(file_id){
                        console.log(file_id);
                        var _payload = {"filename": $scope.files.lipdFilename, "id": file_id};
                        $scope.uploadToBackend("/wiki", _payload, function(resp){
                            console.log("It worked");
                            console.log(resp.data);
                            window.open(resp.data);
                            $scope.showModalAlert({"title": "Confirm upload on Wiki", "message": "Check your Wiki account " +
                                "'Contributions' to confirm that your file uploaded successfully. If you don't see a recent " +
                                "upload from your username, there may have been an error during the upload. Please try again. \n " +
                                "http://wiki.linked.earth/Special:ListFiles/"});
                        });
                    });
                }
            });
        }
        // Not a valid wiki file. Stop process and tell user to correct errors
        else {
            $scope.showModalAlert({"title": "Cannot upload to Wiki", "message": "The data does not meet Wiki " +
                "standards. Make sure that you have the 'Wiki Ready' switch turned on, and there are no Wiki " +
                "errors after validation."});
        }
    };

  /**
   * Upload validated LiPD data to the backend. What you do with the data later is up to the backend based on the
   * url_route provided.
   *
   * @param   {String}    url_route   The route where the data should be sent to.  (ex.  '/noaa' or '/files')
   * @param   {Object}    payload     LiPD data and metadata
   * @param   {Function}  cb          Callback function. Usually to trigger file download or similar.
   */
    $scope.uploadToBackend = function (url_route, payload, cb) {
      // Link the promise to the data upload. A busy spinner will show until the promise is fulfilled.
      $scope.pageMeta.busyPromise = Upload.upload({
        url: url_route,
        data: payload
      });
      $scope.pageMeta.busyPromise.then(function (resp) {
        cb(resp);
      }, function (resp) {
        console.log(resp);
        console.log('Error status: ' + resp.status);
        cb(resp);
      }, function (evt) {
        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
      });
    };

  /**
   * Validate the LiPD data on the page.
   * This involves fixing data mistakes, structure mistakes, and other errors as much as possible.
   * Provide feedback that includes warning and error messages. Rules are dependent on page state which modes are
   * switched on and whether the data was uploaded or created from scratch.
   *
   * @return   none    The validation feedback is stored and updated in the controller scope.
   */
    $scope.validate = function(){
        $scope.$broadcast('refreshSpreadsheets', null);
      // Go through all validations steps, and update scope data.
      // rearrange coordinates from dict to array when necessary, and set the map if coordinates exist
      $scope.files = map.fixCoordinates($scope.files);
      // Convert DMS coordinates to Decimal Degrees when necessary
      $scope.files.json = misc.checkCoordinatesDms($scope.files.json, $scope.dms, $scope.pageMeta.decimalDegrees);
      // Use the coordinates to update the pin location on the map.
      $scope.map = map.updateMap($scope.map, $scope.files);
      // If the LiPD data is not up to the current version, update it.
      versions.update_lipd_version($scope.files, function(_results1){
          // Receive LiPD data back. It is updated to the most recent version.
          console.log("Updated Versions");
          // Store the LiPD version into the page metadata, in case it has changed.
          $scope.pageMeta.oldVersion = _results1.version;
          // Send LiPD data through to the validator.
          lipdValidator.validate(_results1.files, $scope.pageMeta, function(_results){
            try{
              // Store the validation results in the page metadata.
              $scope.files = _results.files;
              $scope.feedback = _results.feedback;
              $scope.status = _results.status;
              // Update the fileList in the feedback section.
              $scope.allFiles = $scope.updateFilesList($scope.allFiles, $scope.files.csv);
            } catch(err){
              console.log("validate: Error trying to prepare results: " + err);
            }
          });
        }
      );
    };

  /**
   * Advanced JSON edit.
   * Edit the JSON data directly through a modal with a large textarea. JSON must be valid to save changes. This is
   * useful for advanced users that want to directly edit the data instead of using the page input fields. Also,
   * rarely there are structural errors that cannot be fixed except through directly editing the JSON.
   *
   * Activated through clicking the 'metadata.jsonld' filename in the feedback section of the page.
   *
   * @return  none   Data is modified in the controller scope.
   */
    $scope.advancedJsonEdit = function(){
      // Push these options through to the modal
      var _opts = {
                // Is this a file upload or an advanced edit?
                "initialUpload": false,
                // Store original json data in cache in case the user makes edits and abandons the edits.
                "cached": $scope.jsonCache,
                // Notification title in the event of a cancelled window
                "errorTitle": "Exit Without Save",
                // Notification message in the event of a cancelled window
                "errorMessage": "No changes saved to metadata",
                // Modal window title
                "title": "Advanced JSON-LD Editor"
      };
      // Open the modal editor with the json data. Pretty print the object so it's easier to view and edit.
      $scope.showModalEditJson(JSON.stringify($scope.files.json, null, 2), _opts, function(_json){
        // If json data is returned, continue to set the data back into the controller scope.
        if(_json){
            // Set the new json back to the scope variable.
            $scope.files.json = _json;
        }
        // If we get a null return, then that means we keep the existing json data and don't save anything.
      });
    };

  /**
   * Show the modal window for editing and fixing JSON metadata. This is used for two different purposes, triggered
   * by two different pathways.
   * 1. Fixing JSON metadata if a decoding error is preventing a 'metadata.jsonld' file from being parsed
   * 2. A manual edit to the JSON metadata for advanced users.
   *
   * @param   {Object}    data      LiPD metadata
   * @param   {Object}    options   initialUpload, cached, errorTitle, errorMessage, and title
   * @param   {Function}  cb        Callback
   */
    $scope.showModalEditJson = function(data, options, cb){
        // Edit the JSON data directly through a modal with a large textarea. JSON must be valid to save.
        // This modal is used for:
        //     1. Fixing invalid JSON during initial LiPD file upload
        //     2. Editing JSON directly at any point AFTER initial LiPD file upload

        //Set options to pass to modal controller
        $scope.modal = {"data": data, "options": options};
        var modalInstance = $uibModal.open({
            templateUrl: 'modal-jsonfix',
            controller: 'ModalCtrlJson',
            size: "lg",
            resolve: {
                data: function () {
                    return $scope.modal;
                }
            }
        });
        // Actions to take after the modal window closes
        modalInstance.result.then(function(result) {
            // If a result is returned
            if(result) {
                // Parse the result
                var _json_parsed = JSON.parse(result);
                // Send the parsed JSON object through the callback
                cb(_json_parsed);
            }
            // A result was not returned
            else {
                // Exited without validating the JSON-LD. Can't cannot continue.
                toaster.pop('error', options.errorTitle, options.errorMessage, 5000);
                // No result. Pass null through the callback.
                cb(null);
            }
        });
    };

  /**
   * Validate jsonld during LiPD file upload
   * In order to upload LiPD jsonld file metadata properly, it has to parse without errors. If it does not parse
   * correctly, then the user must manually fix the errors through this process or abandon the file upload.
   *
   * @param {Array}     entries   Files within the LiPD archive. ZipJS turns these to a data entries array.
   * @param {Function}  cb        LiPD file continues upload and is goes to the ImportService next.
   */
    $scope.validateJsonld = function(entries, cb){
      for(var _p=0; _p<entries.length; _p++){
        var entry = entries[_p];
          // if the object isn't empty
          if(entry) {
              // filter out the system files that being with '._' These slow down processing and we don't want them
              if (entry.filename.split("/").pop().indexOf("._") !== 0) {
                  if (entry.filename.indexOf(".jsonld") >= 0 || entry.filename.indexOf(".json") >= 0) {
                      // push the promise to the master list
                      entry.getData(new zip.TextWriter(), function (text) {
                          // Blindly attempt to parse as jsonld file
                          try{
                              var _json_parsed = JSON.parse(text);
                              entries.push({"filename": "metadata.jsonld", "data": _json_parsed, "type": "json"});
                              cb(entries);
                          } catch(err) {

                              // Oops, JSON was unable to be parsed. Often due to errors in decoding certain unicode
                              // characters. Err here is pretty vague and unhelpful. Showing it to the user would only
                              // cause more confusion.

                              // Set options for JSON modal window
                              var _opts = {"errorTitle": "File Upload Cancelled",
                                  "errorMessage": "JSON-LD must be fixed to upload the file",
                                  "cached": false,
                                  "initialUpload": true,
                                  "title": "Invalid JSON-LD Data"
                              };
                              // Open the JSON modal window and give the user a chance to fix the JSON so they can
                              // continue the upload process.
                              $scope.showModalEditJson(text, _opts, function(_json_parsed){
                                  // If the JSON parsed correctly and valid data is returned, continue with the upload.
                                  if(_json_parsed !== null){
                                      entries.push({"filename": "metadata.jsonld", "data": _json_parsed, "type": "json"});
                                      cb(entries);
                                  }
                              });
                          }
                      });
                  }
              }
          }
      }
    };

    // Execute these functions on page load.
    window.onload = (function(){
      // Check for old, saved session data in the user's browser. Offer to re-load the data if found.
      $scope.checkSession();
      // Initialize the upload button so that the event listener attaches and waits for a file upload.
      $scope.uploadBtnUpload();
      // Search URL path for remote file upload url
      $scope.remoteFileUpload();
    });

  }]); // end Anonymous

