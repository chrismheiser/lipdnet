/**
 * ng_validator.js
 *
 * Provides validation for LiPD data on the lipd.net client-side
 *
 */

var lipdValidator = (function(){
  // 'use strict';
  return {

    /**
     * Validator: Entry point for the validation process.
     *
     * @param {array} files LiPD data sorted by type.
     *   files = { "modal": {}, "lipdFilename": "", "dataSetName": "", "fileCt": 0, "bagit": {}, "csv": {},
                  "jsonSimple": {}, "json": {} };
     * @param {object} options Validation options {"fileUploaded": true/false}
     * @param {callback} cb Callback sorts the validation results
     */
    validate: (function(files, options, cb){

      try{
        var _output = {};
        lipdValidator.populateTSids(files, function(files_1){
          _output.files = files_1.files;
          options.tsids_generated = files_1.tsids_generated;

          lipdValidator.processData(files_1.files, options, function(_results){
            try{
              _output.feedback = _results.feedback;
              _output.status = _results.status;
              cb(_output);
            } catch(err){
              console.log("validate: processData: cb: " + err);
            }
          });

        });
      } catch(err){
        console.log("validate: " + err);
      }
    }),

    /**
     * Entry point for the validation process - INCLUDING restructuring the raw data
     *
     * @param {array} files LiPD data sorted by type.
     *   files = { "modal": {}, "lipdFilename": "", "dataSetName": "", "fileCt": 0, "bagit": {}, "csv": {},
                  "jsonSimple": {}, "json": {} };
     * @param {object} options Validation options {"fileUploaded": true/false}
     * @param {callback} cb Callback sorts the validation results
     */
    validate_w_restructure: (function(files, options, cb){
      try{
        lipdValidator.restructure(files, function(files_2){
          lipdValidator.validate(files_2, options, function(_results){
            cb(_results);
          });
        });
      } catch(err){
        console.log("validate_w_restructure: " + err);
      }
    }),

    /**
     * Generate a TSid. An alphanumeric unique ID.
     * 'VAL' prefix for validator + 8 generated characters (TsID standard)
     *
     * @return {string} _tsid TsID
     */
    generateTSid: (function(){
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      // Create TSID.
      //console.log("misc: Generated TSid: " + _tsid);
      return "WEB" + s4() + s4();
    }),

    /**
     *  Restructure data by file type, filename, and gather other metadata
     *
     *  @param {Array} objs File data. Shown at bottom of this file under "DATA AFTER IMPORT SERVICE"
     *  @param {callback} cb
     */
    restructure: (function (objs, cb) {
        // console.log("sortBeforeValidate: Start sorting");
        // Files: User data holds all the user selected or imported data
        var files = {
            "lipdFilename": "",
            "dataSetName": "",
            "fileCt": 0,
            "bagit": {},
            "csv": {},
            "json": {}
          };
        files.fileCt = objs.length;
        console.log("LiPD File Count: " + objs.length);
        try{
          // loop over each csv/jsonld object. sort them into the scope by file type
          objs.forEach(function (obj) {
            console.log("restructure: " + obj.filenameShort);
            if (obj.type === "json") {
              console.log(obj.filenameFull);
              console.log(obj.filenameFull.split("/")[0]);
              files.dataSetName = obj.filenameFull.split("/")[0];
              files.lipdFilename = obj.filenameFull.split("/")[0] + ".lpd";
              files.json = obj.data;
            } else if (obj.type === "csv") {
              files.csv[obj.filenameShort] = obj.data;
            } else if (obj.type === "bagit") {
              files.bagit[obj.filenameShort] = obj;
            } else {
              console.log("restructure: Unknown File: " + obj.filenameFull);
            }
          });
          cb(files);
        }catch(err){
          console.log("restructure: " + err);
          // console.log(cb);
        }
    }),

    /**
     *  Populate TsIDs in columns that do not have one.
     *
     * @param {array} files LiPD data sorted by type.
     *   files = { "modal": {}, "lipdFilename": "", "dataSetName": "", "fileCt": 0, "bagit": {}, "csv": {},
                  "jsonSimple": {}, "json": {} };
     *  @param {callback} cb
     */
    populateTSids: (function(_files, cb){

      var _generated_count = 0; 

      // PopulateTSid: Columns
      // Check all columns in a table with TSid's where necessary
      var populateTSids3 = function(table){
        // Safe check. Make sure table has "columns"
        if (table.hasOwnProperty("columns")) {
          // Loop over all columns in the table
          for (var _i2 = 0; _i2 < table["columns"].length; _i2++) {
            var col = table["columns"][_i2];
            // Check for TSid key in column
            if(!col.hasOwnProperty("TSid")){
              // populate if doesn't exist.
              var _tsid = lipdValidator.generateTSid();
              table["columns"][_i2]["TSid"] =  _tsid;
              _generated_count++;
            }
          }
        }
        // console.log("MODIFIED TABLE");
        // console.log(table);
        return table;
      };

      // PopulateTSid: Tables
      // Loop for each data table
      var populateTSids2 = function(d, pc){
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
                d[pcData][_k2][meas][_j] = populateTSids3(table[_j]);
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
                  d[pcData][_k2][mod][_j2]["summaryTable"] = populateTSids3(table[_j2]["summaryTable"]);
                } // end summary
                // Is there a ensembleTable?
                if (table[_j2].hasOwnProperty("ensembleTable")) {
                  // Process table
                  d[pcData][_k2][mod][_j2]["ensembleTable"] = populateTSids3(table[_j2]["ensembleTable"]);
                } // end ensemble
                // Is there a distributionTable?
                if (table[_j2].hasOwnProperty("distributionTable")) {
                  table2 = table[_j2]["distributionTable"];
                  // Loop for all dist tables
                  for (var p = 0; p < table[_j2]["distributionTable"].length; p++) {
                    // Process table
                    d[pcData][_k2][mod][_j2]["distributionTable"][p] = populateTSids3(table2[p]);
                  }
                } // end dist
              } // end model loop
            } // end model
          } // end paleoData loop
        } // end if hasOwnProperty
        // console.log("TSIDS 2: MODIFIED" + pcData);
        // console.log(d);
        return d;
      };

      // PopulateTSid: Paleo/Chron
      // Loop for each paleo/chron entry
      var populateTSids1 = function(files, cb){
        // using files.json
        // run once for paleoData and chronData
        pc = ["paleo", "chron"];
        // console.log("Starting populateTSID loop");
        for (var _i4 = 0; _i4 < pc.length; _i4++) {
          var _pc1 = pc[_i4];
          var _pc2 = pc[_i4] + "Data";
          // If paleoData found, continue.
          // console.log(_pc2 + " exists?");
          if(files["json"].hasOwnProperty(_pc2)){
            // console.log("yes, " + _pc2 + " exists");
            // Process the paleoData, and replace the data in the json
            files["json"] = populateTSids2(files["json"], _pc1);
          } else {
            // console.log("no, " + _pc2 + " doesnt exist");
          }
        }
        var output = {"files": files, "tsids_generated": _generated_count};
        return output;
      };

      // Revalidate to remove TSid errors
      // console.log(_files);
      cb(populateTSids1(_files));
    }),

    /**
     * Validator: main validation process
     *
     * Validate based on lipdVersion found, or default to v1.1 if not found
     * Check data for required fields, proper structure, and proper data types.
     * Attempt to fix invalid data, and return data with and feedback (errors and warnings)
     *
     * @param {array} files LiPD data sorted.
     *   files = { "modal": {}, "lipdFilename": "", "dataSetName": "", "fileCt": 0, "bagit": {}, "csv": {},
                  "jsonSimple": {}, "json": {} };
     * @param {object} options Validation options {"fileUploaded": true/false}
     * @param {callback} cb
     * @return {object} {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.status}
     */
    processData: (function(files, options, cb){

      // console.log("validate: Begin Validation");
      // console.log(files);

      var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
      var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
        return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
      };

      // GLOBALS

      // Valid: Data pass or fail?
      var valid = false;

      // Feedback: Store all output messages; Errors, warnings, and other.
      var feedback = {
        "validBagit": false,
        "missingTsidCt": 0,
        "wrnCt": 0,
        "errCt": 0,
        "tsidMsgs": [],
        "posMsgs": [],
        "errMsgs": [],
        "wrnMsgs": [],
        "status": "NA",
        "lipdVersion": "NA"
      };

      /** v1.0  - constant keys */
      var keys_base = {
        "advKeys": ["@context", "tsid", "number", "google", "md5", "lipdVersion", "investigators"],
        "miscKeys": ["studyname", "proxy", "metadataMD5", "googleSpreadSheetKey", "googleMetadataWorksheet",
          "@context", "tagMD5", "dataSetName", "description", "maxyear",
          "minyear", "originaldataurl", "datacontributor", "collectionName", "googleDataUrl",
          "paleoData", "chronData"],
        "reqRootKeys": ["archiveType", "dataSetName", "paleoData", "geo"],
        "reqPubKeys": ["author", "title", "year", "journal"],
        "reqPubDcKeys": ["author", "title"],
        "reqColumnKeys": ["number", "variableName", "TSid", "units"],
        "reqTableKeys": ["filename", "columns", "missingValue"],
        "reqTableNameKeys": ["chronTableName", "paleoTableName", "paleoDataTableName", "chronDataTableName",
          "chronMeasurementTableName", "paleoMeasurementTableName", "name", "tableName"],
        "reqGeoKeys": ["coordinates"]
      };

      /** v1.1  && base keys */
      var keys_1_1 = {
        "miscKeys": ["lipdVersion"],
        "reqRootKeys": ["lipdVersion"],
        "reqTableNameKeys": []
      };

      /** v1.2  && base keys */
      var keys_1_2 = {
        "miscKeys": ["WDCPaleoUrl","hasMinValue", "hasMaxValue", "hasMedianValue", "hasMeanValue", "hasResolution", "lipdVersion"],
        "reqRootKeys": ["lipdVersion"],
        "reqTableNameKeys": []
      };

      /** v1.3  && base keys */
      var keys_1_3 = {
        "miscKeys": ["WDCPaleoUrl","hasMinValue", "hasMaxValue", "hasMedianValue", "hasMeanValue", "hasResolution", "lipdVersion", "createdBy"],
        "reqRootKeys": ["lipdVersion", "createdBy"],
        "reqTableNameKeys": ["tableName", "name"]
      };


      /**
       *  Validate
       *  Main validation function that calls all subroutines
       *
       * @return {object} validation results
       */
        var validate = function () {

          try{
            // Get the lipd version to determine which validation to use
            var lipdVersion = getLipdVersion(files.json);
            files.json["lipdVersion"]  = lipdVersion;
            feedback.lipdVersion = lipdVersion;
            console.log("Validating version: " + lipdVersion);

            if(lipdVersion === "1.0"){
              console.log("validate_1_0: LiPD Structure");
              structureBase(files.json, keys_base.miscKeys.concat(keys_1_1.miscKeys));
              structure_1_0(files.json);
              console.log("validate_1_0: LiPD Required Fields");
              requiredBase(files.json);
              required_1_0(files.json);
            }

            else if(lipdVersion === "1.1"){
              console.log("validate_1_1: LiPD Structure");
              structureBase(files.json, keys_base.miscKeys);
              structure_1_1(files.json);
              console.log("validate_1_1: LiPD Required Fields");
              requiredBase(files.json);
              required_1_1(files.json);
            }

            else if (lipdVersion === "1.2"){
              console.log("validate_1_2: LiPD Structure");
              structureBase(files.json, keys_base.miscKeys.concat(keys_1_2.miscKeys));
              structure_1_2(files.json);
              console.log("validate_1_2: LiPD Required Fields");
              requiredBase(files.json);
              required_1_2(files.json);
            }
            else if (lipdVersion === "1.3"){
              console.log("validate_1_3: LiPD Structure");
              structureBase(files.json, keys_base.miscKeys.concat(keys_1_3.miscKeys));
              structure_1_3(files.json);
              console.log("validate_1_3: LiPD Required Fields");
              requiredBase(files.json);
              required_1_3(files.json);
            }
            console.log("validate: Bagit");
            verifyBagit(files.bagit);
            verifyValid(feedback);

            console.log("validate: LiPD Filename: " + files.lipdFilename);
            console.log("validate: TSids Generated: " + options.tsids_generated);
            console.log("validate: Validation Status: " + feedback.status);
            // var jsonCopy = JSON.parse(JSON.stringify(files.json));
          } catch (err){
            console.log(err);
          }
          return {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.status};
        };


        /**
         * Version-independent
         *
         * Since all of the base structure has remained the same from v1.0 to v1.3, we can use all of these
         * rules the same way
         */
        var structureBase = function(D, keys){
          // check that data fields are holding the correct value data types
          for (var k in D) {
            try {
              if (D.hasOwnProperty(k)){
                var v = D[k];
                if (k === "archiveType") {
                  verifyDataType("string", k, v, true);
                } else if (k === "pub") {
                  // pub must follow BibJSON standards
                  var _pubPassed = verifyArrObjs(k, v, true);
                  if (_pubPassed){
                    verifyBibJson(v);
                  }
                } else if (k === "investigators" || k === "investigator") {
                  verifyDataType("any", k, v, true);
                } else if (k=== "funding") {
                  verifyArrObjs(k, v, true);
                } else if (k === "geo") {
                  // geo must follow GeoJSON standards
                  verifyDataType("object", k, v, true);
                } else {
                  // No rules for these keys. Log warning, but allow data.
                  if (keys.indexOf(k) === -1) {
                    logFeedback("warn", "No rules found for key: " + k);
                    console.log("verifyBase: No rules for key: " + k);
                  }
                }
              }
            } catch (err) {
              console.log("verifyBase: Caught error parsing: " + k + ": " + err);
            }
          }
        };

      var structure_1_0 = function(D){
        try {
          if (D.hasOwnProperty("chronData")) {
            structureSection_1_0("chron", D.chronData);
          }
          if (D.hasOwnProperty("paleoData")) {
            structureSection_1_0("paleo", D.paleoData);
          }
        } catch (err) {
          console.log("structure_1_0: Caught error parsing: " + err);
        }
      };

      var structure_1_1 = function(D){
        try {
          if (D.hasOwnProperty("chronData")) {
            structureSection_1_1("chron", D.chronData);
          }
          if (D.hasOwnProperty("paleoData")) {
            structureSection_1_1("paleo", D.paleoData);
          }
        } catch (err) {
          console.log("structure_1_1: Caught error parsing: " + err);
        }
      };


      var structure_1_2 = function (D) {
        try {
            if (D.hasOwnProperty("chronData")) {
              structureSection_1_2("chron", D.chronData);
            }
            if (D.hasOwnProperty("paleoData")) {
              structureSection_1_2("paleo", D.paleoData);
            }
        } catch (err) {
          console.log("structure_1_2: Caught error parsing: " + err);
        }
      };


        var structure_1_3 = function (D) {
          try {
            if (D.hasOwnProperty("chronData")) {
              structureSection_1_3("chron", D.chronData);
            }
            if (D.hasOwnProperty("paleoData")) {
              structureSection_1_3("paleo", D.paleoData);
            }
          } catch (err) {
            console.log("structure_1_3: Caught error parsing: " + err);
          }
        };


      /**
       * Structure v1.0
       *
       * paleo: array of objects
       * chron: array of objects
       *
       * @param {string} pc paleo or chron
       * @param {Array} d Metadata
       */
        var structureSection_1_0 = function(pc, d){

          var _k = pc+"Data";

          // paleoData || chronData NOT an array
          if (!Array.isArray(d)) {
            logFeedback("err", "Invalid data type: " + _k + ". Expected: Array, Given: " + (typeof d === 'undefined' ? 'undefined' : _typeof(d)));
          }

          // paleoData || chronData are an array
          else if (Array.isArray(d) && d.length > 0) {

            // paleoData || chronData are an array of objects
            verifyArrObjs(_k, d, true);

          }
        };

      /**
       * Structure v1.1
       *
       * paleo: array of objects, no nested tables
       * chron: array of objects, with nested tables
       * measurement: single
       * modelTable: single
       * method: single
       * ensemble: single
       * calibratedAges: multiple
       *
       * @param {string} pc paleo or chron
       * @param {Array} d Metadata
       */
        var structureSection_1_1 = function(pc, d){
          var _k = pc+"Data";

          // paleoData || chronData NOT an array
          if (!Array.isArray(d)) {
            logFeedback("err", "Invalid data type: " + _k + ". Expected: Array, Given: " + (typeof d === 'undefined' ? 'undefined' : _typeof(d)));
          }

          // paleoData || chronData are an array
          else if (Array.isArray(d) && d.length > 0) {

            // paleoData || chronData are an array of objects
            var valid_section = verifyArrObjs(_k, d, true);

            // In v1.1, only chron has nested tables.
            if (valid_section && pc === "chron") {
              // create table names based on what "mode" we're in. chron or paleo
              var meas = pc + "MeasurementTable";
              var mod = pc + "Model";
              // check if measurement table exists
              if (d[0].hasOwnProperty(meas)) {
                // check if measurement table is an object
                verifyDataType("object", meas, d[0][meas], true);
              } // end measurement table
              // check if model table exists
              if (d[0].hasOwnProperty(mod)) {
                // check if model table is array with objects
                var valid_model = verifyArrObjs(mod, d[0][mod]);
                var _table_names = [ pc + "ModelTable", "calibratedAges", "method", "ensembleTable"];
                if (valid_model) {
                  // correct so far, so check if items in model table [0] are correct types
                  for (var _i = 0; _i < _table_names.length; _i++) {
                    var _table_name = _table_names[_i];
                    if (d[0][mod][0].hasOwnProperty(_table_name)) {
                      if (_table_name === "calibratedAges") {
                        verifyArrObjs(_table_name, d[0][mod][0][_table_name], true);
                      } else {
                        verifyDataType("object", _table_name, d[0][mod][0][_table_name], true);
                      }
                    }
                  }
                }
              } // end model
            } // end valid_section
          }
        };

      /**
       * Structure v1.2
       *
       * paleo: array of objects, with nested tables
       * chron: array of objects, with nested tables
       * measurement: multiple
       * summary: single
       * method: single
       * ensemble: single
       * distribution: multiple
       *
       * @param {string} pc paleo or chron
       * @param {Array} d Metadata
       */
        var structureSection_1_2 = function (pc, d) {
          var _k = pc+"Data";

          // paleoData || chronData NOT an array
          if (!Array.isArray(d)) {
            logFeedback("err", "Invalid data type: " + _k + ". Expected: Array, Given: " + (typeof d === 'undefined' ? 'undefined' : _typeof(d)));
          }

          // paleoData || chronData are an array
          else if (Array.isArray(d) && d.length > 0) {

            // paleoData || chronData are an array of objects
            var valid_section = verifyArrObjs(_k, d, true);

            if (valid_section) {
              // create table names based on what "mode" we're in. chron or paleo
              var meas = pc + "MeasurementTable";
              var mod = pc + "Model";
              // check if measurement table exists
              if (d[0].hasOwnProperty(meas)) {
                // check if measurement table is array with objects
                verifyArrObjs(meas, d[0][meas], true);
              } // end measurement table
              // check if model table exists
              if (d[0].hasOwnProperty(mod)) {
                // check if model table is array with objects
                var valid_model = verifyArrObjs(mod, d[0][mod]);
                var _table_names = ["summaryTable", "distributionTable", "method", "ensembleTable"];
                if (valid_model) {
                  // correct so far, so check if items in model table [0] are correct types
                  for (var _i = 0; _i < _table_names.length; _i++) {
                    var table = _table_names[_i];
                    if (d[0][mod][0].hasOwnProperty(table)) {
                      if (table === "distributionTable") {
                        verifyArrObjs(table, d[0][mod][0][table], true);
                      } else {
                        verifyDataType("object", table, d[0][mod][0][table], true);
                      }
                    }
                  }
                }
              } // end model
            } // end valid_section
          }
        };

      /**
       * Structure v1.3
       *
       * paleo: array of objects, with nested tables
       * chron: array of objects, with nested tables
       * measurement: multiple
       * summary: multiple
       * method: single
       * ensemble: multiple
       * distribution: multiple
       *
       * @param {string} pc paleo or chron
       * @param {Array} d Metadata
       */
        var structureSection_1_3 = function(pc, d){
          var _k = pc+"Data";
          // value is an array
          if (!Array.isArray(d)) {
            logFeedback("err", "Invalid data type: " + _k + ". Expected: Array, Given: " + (typeof d === 'undefined' ? 'undefined' : _typeof(d)));
          } else if (Array.isArray(d) && d.length > 0) {
            // check if the root paleoData or chronData is an array with objects.
            var _valid_section = verifyArrObjs(_k, d, true);
            if (_valid_section) {
              // create table names based on what "mode" we're in. chron or paleo
              // check if measurement table exists
              if (d[0].hasOwnProperty("measurementTable")) {
                // check if measurement table is array with objects
                verifyArrObjs(pc + ".measurementTable", d[0]["measurementTable"], true);
              } // end measurement table
              // check if model table exists
              if (d[0].hasOwnProperty("model")) {
                // check if model table is array with objects
                var _valid_model = verifyArrObjs("model", d[0]["model"]);
                var _table_names = ["summaryTable", "distributionTable", "method", "ensembleTable"];
                if (_valid_model) {
                  // correct so far, so check if items in model table [0] are correct types
                  for (var _i = 0; _i < _table_names.length; _i++) {
                    var table = _table_names[_i];
                    if (d[0]["model"][0].hasOwnProperty(table)) {
                      if (table === "method") {
                        verifyDataType("object", table, d[0]["model"][0][table], true);
                      } else {
                        verifyArrObjs(table, d[0]["model"][0][table], true);
                      }
                    }
                  }
                }
              } // end model
            } // end valid_section
          }
        };


        // REQUIRED DATA

      /**
       * Required data that is consistent across all versions
       *
       * @param {object} D Metadata
       */
        var requiredBase = function(D){
          requiredTsids();
          requiredPubs(D);
        };

        /**
         * Required data for v1.0
         *
         * @param {object} D Metadata
         */
        var required_1_0 = function(D){
          requiredRoot(D, keys_base.reqRootKeys);
          requiredSection_1_0("paleo", D);
          requiredSection_1_0("chron", D);
        };

        /**
         * Required data for v1.1
         *
         * @param {object} D Metadata
         */
        var required_1_1 = function(D){
          requiredRoot(D, keys_base.reqRootKeys.concat(keys_1_1.reqRootKeys));
          requiredSection_1_1("paleo", D);
          requiredSection_1_1("chron", D);
        };

        /**
         * Required data for v1.2
         *
         * @param {object} D Metadata
         */
        var required_1_2 = function (D) {
          requiredRoot(D, keys_base.reqRootKeys.concat(keys_1_2.reqRootKeys));
          requiredSection_1_2("paleo", D);
          requiredSection_1_2("chron", D);
        };

        /**
         * Required data for v1.3
         *
         * @param {object} D Metadata
         */
        var required_1_3 = function(D){
          requiredRoot(D, keys_base.reqRootKeys.concat(keys_1_3.reqRootKeys));
          requiredSection_1_3("paleo", D);
          requiredSection_1_3("chron", D);
        };


      /**
       *  v1.0
       *  Required data for the paleoData || chronData section
       *
       * @param {string} pc paleo or chron
       * @param {object} D Metadata
       */
        var requiredSection_1_0 = function(pc, D){
          var pcData = pc + "Data";

          try{
            // paleoData not found. Require _AT LEAST_ one paleo measurement table
            if (!D.hasOwnProperty(pcData)) {
              if (pc === "paleo") {
                logFeedback("err", "Missing data: " + pcData + "0");
              }
            }
            // paleoData
            else {
              // paleoData found, but empty. Require _AT LEAST_ one paleo measurement table
              if (pc === "paleo" && !D[pcData]) {
                logFeedback("err", "Missing data: " + pcData + "0");
              } else {
                // paleo || chron - no nested tables
                  requiredTables(D[pcData], pc, keys_base.reqTableNameKeys);
              } // end else
            } // end else
          } catch(err){
            console.log("validator: requiredSection_1_0: " + err);
          }
        }; // end required 1.0


      /**
       *  v1.1
       *  Required data for the paleoData || chronData section
       *
       * @param {string} pc paleo or chron
       * @param {object} D Metadata
       */
        var requiredSection_1_1 = function(pc, D){

          var pcData = pc + "Data";
          var meas = pc + "MeasurementTable";
          var mod = pc + "Model";

          try{
            // paleoData not found. Require _AT LEAST_ one paleo measurement table
            if (!D.hasOwnProperty(pcData)) {
              if (pc === "paleo") {
                logFeedback("err", "Missing data: " + pcData + "0measurement0");
              }
            }
            // paleoData
            else {
              // paleoData found, but empty. Require _AT LEAST_ one paleo measurement table
              if (pc === "paleo" && !D[pcData]) {
                logFeedback("err", "Missing data: " + pcData + "0measurement0");
              } else {

                // paleo does not have nested tables
                if (pc === "paleo"){
                  requiredTables(D[pcData], pc, keys_base.reqTableNameKeys);
                }

                // chron has nested tables
                else if (pc === "chron"){
                  // paleoData entries
                  for (var i = 0; i < D[pcData].length; i++) {

                    var _table = D[pcData][i];

                    // measurement missing. Require _AT LEAST_ one paleo measurement table
                    if (!_table.hasOwnProperty(meas)) {
                      logFeedback("err", "Missing data: " + pc + "0measurement0");
                    }

                    // measurement
                    else if (_table.hasOwnProperty(meas)) {
                      requiredTable(_table[meas], pc + i + "measurement", keys_base.reqTableNameKeys)
                    } // end meas

                    // model
                    if (_table.hasOwnProperty(mod)) {
                      for (var k = 0; k < _table[mod].length; k++) {
                        var modTables = _table[mod][k];
                        // summary
                        if (modTables.hasOwnProperty("chronModelTable")) {
                          requiredTable(modTables.summaryTable, pc + i + "model" + k + "chronModelTable", keys_base.reqTableNameKeys);
                        }
                        // ensemble
                        if (modTables.hasOwnProperty("ensembleTable")) {
                          requiredTable(modTables.ensembleTable, pc + i + "model" + k + "ensemble", keys_base.reqTableNameKeys);
                        }
                        // distribution
                        if (modTables.hasOwnProperty("calibratedAges")) {
                          requiredTables(modTables.calibratedAges, pc + i + "model" + k + "calibratedAges", keys_base.reqTableNameKeys)
                        }
                      }
                    } // end model
                  } // end paleoData loop
                }
              } // end else
            } // end else
          } catch(err){
            console.log("validator: requiredSection_1_1: " + err);
          }
        }; // end required 1.1


      /**
       *  v1.2
       *  Required data for the paleoData || chronData section
       *
       * @param {string} pc paleo or chron
       * @param {object} D Metadata
       */
        var requiredSection_1_2 = function (pc, D) {

          var pdData = pc + "Data";
          var meas = pc + "MeasurementTable";
          var mod = pc + "Model";

          try{
            // paleoData not found. Require _AT LEAST_ one paleo measurement table
            if (!D.hasOwnProperty(pdData)) {
              if (pc === "paleo") {
                logFeedback("err", "Missing data: " + pdData + "0measurement0");
              }
            }
            // paleoData
            else {
                // paleoData empty. Require _AT LEAST_ one paleo measurement table
                if (pc === "paleo" && !D[pdData]) {
                  logFeedback("err", "Missing data: " + pdData + "0measurement0");
                } else {

                  // paleoData entries
                  for (var i = 0; i < D[pdData].length; i++) {

                    var table = D[pdData][i];

                    // measurement missing. Require _AT LEAST_ one paleo measurement table
                    if (!table.hasOwnProperty(meas) && pc === "paleo") {
                      logFeedback("err", "Missing data: " + pc + "0measurement0");
                    }

                    // measurement
                    else if (table.hasOwnProperty(meas)) {
                      requiredTables(table[meas], pc + i + "measurement", keys_base.reqTableNameKeys)
                    } // end meas

                    // model
                    if (table.hasOwnProperty(mod)) {
                      for (var k = 0; k < table[mod].length; k++) {
                        var modTables = table[mod][k];
                        // summary
                        if (modTables.hasOwnProperty("summaryTable")) {
                          requiredTable(modTables.summaryTable, pc + i + "model" + k + "summary", keys_base.reqTableNameKeys);
                        }
                        // ensemble
                        if (modTables.hasOwnProperty("ensembleTable")) {
                          requiredTable(modTables.ensembleTable, pc + i + "model" + k + "ensemble", keys_base.reqTableNameKeys);
                        }
                        // distribution
                        if (modTables.hasOwnProperty("distributionTable")) {
                          requiredTables(modTables.distributionTable, pc + i + "model" + k + "distribution", keys_base.reqTableNameKeys)
                        }
                      }
                    } // end model
                  } // end paleoData loop
                } // end else
              } // end else
          } catch(err){
            console.log("validator: requiredSection_1_2: " + err);
          }

        }; // end required 1.2

      /**
       *  v1.3
       *  Required data for the paleoData || chronData section
       *
       * @param {string} pc paleo or chron
       * @param {object} D Metadata
       */
        var requiredSection_1_3 = function(pc, D){
          var pdData = pc + "Data";

          try{
            // paleoData missing. Require _AT LEAST_ one paleo measurement table
            if (!D.hasOwnProperty(pdData)) {
              if (pc === "paleo") {
                logFeedback("err", "Missing data: " + pdData + "0measurement0");
              }
            }
            // paleoData
            else {

              // paleoData empty. Require _AT LEAST_ one paleo measurement table
              if (pc === "paleo" && !D[pdData]) {
                logFeedback("err", "Missing data: " + pdData + "0measurement0");
              } else {
                // paleoData entries
                for (var i = 0; i < D[pdData].length; i++) {

                  var section = D[pdData][i];

                  // measurement missing. Require _AT LEAST_ one paleo measurement table
                  if (!section.hasOwnProperty("measurementTable") && pc === "paleo") {
                    logFeedback("err", "Missing data: " + pc + "0measurement0");
                  }

                  // measurement
                  else if (section.hasOwnProperty("measurementTable")) {
                    requiredTables(section["measurementTable"], pc + i + "measurement", keys_1_3.reqTableNameKeys)
                  }

                  // model
                  if (section.hasOwnProperty("model")) {
                    for (var _k = 0; _k < section["model"].length; _k++) {
                      var modTables = section["model"][_k];
                      // summary
                      if (modTables.hasOwnProperty("summaryTable")) {
                        requiredTables(modTables.summaryTable, pc + i + "model" + _k + "summary", keys_1_3.reqTableNameKeys)
                      }
                      // ensemble
                      if (modTables.hasOwnProperty("ensembleTable")) {
                        requiredTables(modTables.ensembleTable, pc + i + "model" + _k + "ensemble", keys_1_3.reqTableNameKeys)
                      }
                      // distribution
                      if (modTables.hasOwnProperty("distributionTable")) {
                        requiredTables(modTables.distributionTable, pc + i + "model" + _k + "distribution", keys_1_3.reqTableNameKeys)
                      }
                    }
                  } // end model
                } // end pcData loop
              } // end else
            } // end else
          } catch(err){
            console.log("validator: requiredSection_1_3: " + err);
          }

        }; // end required 1.3



      // VERSION INDEPENDENT FUNCTIONS

      /**
       * Check dataset root for required keys
       *
       * @param {object} D Metadata
       * @param {object} keys Required keys for this LiPD Version
       */
      var requiredRoot = function (D, keys) {
        try {
          // loop through required keys for this version
          for (var i = 0; i < keys.length; i++) {
            // current key
            var key = keys[i];
            // Geo
            if (key === "geo") {
              // Geo
              if (D.hasOwnProperty(key)) {
                requiredGeo(D);
              }
              // Geo missing. Required _AT LEAST_ coordinates
              else {
                logFeedback("err", "Missing data: " + "geo.geometry.coordinates");
              }
            } else if (!D.hasOwnProperty(key) || !D[key]) {
              // Required key is missing
              logFeedback("err", "Missing data: " + key);
            }
          } // end for
        } catch(err){
          console.log("validator: requiredRoot: " + err);
        }

      };

      /**
       * Check _multiple_ tables for required keys
       *
       * @param {object} tables Metadata
       * @param {string} crumbs
       * @param {object} tnks tableName keys for this version
       */
      var requiredTables = function(tables, crumbs, tnks){
        try{
          console.log
          if (tables.length === 0){
            logFeedback("err", "Missing data: " + crumbs + "0");
          } else {
            for (var _w = 0; _w < tables.length; _w++) {
              requiredTable(tables[_w], crumbs + _w, tnks);
            }
          }
        } catch(err){
          console.log("requiredTables: " + crumbs + ": " + err);
        }

      };


      /**
       * Check _one_ table for required keys
       *
       * @param {object} table Metadata
       * @param {string} crumbs
       * @param {object} tnks Required keys for this LiPD Version
       */
      var requiredTable = function (table, crumbs, tnks) {
        // look for table filename
        var filename = table.filename || null;
        // var missingValue = table.missingValue;
        var _tnk_bool = false;

        try {
          // required table root keys
          for (var _w = 0; _w < keys_base.reqTableKeys.length; _w++) {
            // current key
            currKey = keys_base.reqTableKeys[_w];
            // current key exists in table?
            if (!table.hasOwnProperty(currKey) || !table[currKey]) {
              logFeedback("err", "Missing data: " + crumbs + "." + currKey);
            }
          } // end columns loop

          // tableName
          for(var _tk = 0; _tk < tnks.length; _tk++){
            var _tnk = tnks[_tk];
            if(table.hasOwnProperty(_tnk)){
              _tnk_bool = true;
              break;
            }
          }
          if (!_tnk_bool){
            logFeedback("err", "Missing data: " + crumbs + "." + "tableName");
          }


          // column count match CSV count
          if(!table.hasOwnProperty("columns") || table.columns.length === 0){
            logFeedback("err", "Missing data: " + crumbs + ".columns");
          } else if (table.hasOwnProperty("columns")) {
            // Required: CSV filename where column values are stored
            if (!filename) {
              logFeedback("err", "Missing data: " + crumbs + ".filename")
            } else {
              requiredColumnsCtMatch(filename, table.columns);
            }

            // Required column keys
            for (var i = 0; i < table.columns.length; i++) {
              // required column keys
              for (var k in keys_base.reqColumnKeys) {
                if(keys_base.reqColumnKeys.hasOwnProperty(k)){
                  // current key
                  var currKey = keys_base.reqColumnKeys[k];
                  // current key exists in this column?
                  if (!table.columns[i].hasOwnProperty(currKey) || !table.columns[i][currKey]) {
                    logFeedback("err", "Missing data: " + crumbs + ".column" + i + "." + currKey, currKey);
                  }
                }
              } // end table keys
            } // end columns loop
          } // end 'if columns exist'




        } catch(err){
          console.log("validator: requiredTable: " + err);
        }

      }; // end requiredTable fn


      /**
       * Notify the user: If there were any tsids that were auto-generated,
       * they only persist if the file is downloaded (web) or saved (API)
       */
      var requiredTsids = function(){
        if (options.tsids_generated > 0){
          logFeedback("warn", options.tsids_generated + " TSid(s) were created. You must download the file to keep these changes.", "TSid");
        }
      };


      /**
       * Check that publication data follows the BibJson standard
       *
       * @param {object} pub Publication data
       */
      var verifyBibJson = function(pub){
        try {
          // these keys must be an array of objects
          var _arrs = ["author", "identifier", "editor", "license", "link"];
          // this key must be an object
          var _objs = ["journal"];
          var _crumbs = "";
          var _idx = 0;
          // in case author is formatted wrong, convert it to BibJson format
          pub = fixAuthor(pub);
          for (var _p = 0; _p < pub.length; _p++){
            var _pub = pub[_p];
            for(var _key in _pub){
              _idx = _p + 1;
              _crumbs = "pub" + _idx + "." + _key;
              if(_pub.hasOwnProperty(_key)){
                if (_arrs.includes(_key)){
                  var _isArrObj = verifyArrObjs(_crumbs, _pub[_key], true);
                } else if (_key === "journal"){
                  verifyDataType("object", _crumbs, _pub[_key], false);
                } else {
                  verifyDataType("string", _crumbs, _pub[_key], false);
                }
              }
            }
          }
        } catch (err) {
          console.log("validate: verifyBibJson: " + err);
        }
      };

      var verifyGeoJson = function(v){
        // TODO might need to do this at some point
      };

      // check if the data type for a given key matches what we expect for that key
      var verifyDataType = function (dt, k, v, addToLog) {
        try {
          // special case: check for object array.
          if (dt === "array") {
            if (!Array.isArray(v)) {
              if(addToLog){
                logFeedback("err", "Invalid data type: " + k + "\n  Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
              }
              return false;
            }
          } else if (dt === "any"){
            return true;
          } else {
            // expecting specified data type, but didn't get it.
            if (v === undefined)  {
              if(addToLog){
                logFeedback("warn", "Missing data: " + k);
              }
            } // end if
            else if (_typeof(v) !== dt) {
              if(addToLog){
                logFeedback("err", "Invalid data type: " + k + "\n  Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
              }
              return false;
            }
          } // end else
        } catch (err) {
          // caught some other unknown error
          console.log("verifyDataType: Caught error parsing. Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)));
        } // end catch
        return true;
      };

      // Check for an Array with objects in it.
      var verifyArrObjs = function (k, v, addToLog) {
        var isArr = verifyDataType("array", k, v, addToLog);
        if (isArr) {
          var isObjs = verifyDataType("object", k, v[0], addToLog);
          // this array is only valid if it contains objects or if it's an empty array.
          if (isObjs || !v[0]) {
            return true;
          }
        }
        console.log("verifyArrObjs: Invalid data type: expected: obj, given: " + _typeof(v[0]) + ": " + k);
        return false;
      };

      // check that column count in a table match the column count in the CSV data
      var requiredColumnsCtMatch = function (filename, columns) {
        var csvCt = 0;
        // console.log("columns");
        // console.log(columns);
        try{
          // Get the column count for this csv file.
          csvCt = files.csv[filename].cols;
        } catch(err){
          logFeedback("err", "CSV filename(s) do not match filenames CSV filenames listed in JSONLD metadata", "filename");
          return;
        }
        var metaCt = columns.length;
        try {
          // edge case: ensemble table that has "two" columns, but actual column 2 is a list of columns.
          if (csvCt !== metaCt) {
            // console.log("one column");
            // column counts don't match. Do we have two columns? Might be an ensemble table
            if (columns.length === 1){
              if (Array.isArray(columns[0].number)){
                metaCt = columns[0].number.length - 1 + metaCt;
                if (csvCt !== metaCt) {
                  // Okay, there is actually an error now. Log it.
                  logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
                }
              }
            }
            if (columns.length === 2) {
              // console.log("two columns");
              // Is column 2 an array of columns? (most likely)
              if (Array.isArray(columns[1].number)) {
                // calculate how many columns this array REALLY represents.
                metaCt = columns[1].number.length - 1 + metaCt;
                // Do the column counts match now?
                if (csvCt !== metaCt) {
                  // Okay, there is actually an error now. Log it.
                  logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
                }
              }
              // is column 1 an array of column numbers? (less likely)
              else if (Array.isArray(columns[0].number)) {
                // calculate how many columns this array REALLY represents.
                metaCt = columns[0].number.length - 1 + metaCt;
                // Do the column counts match now?
                if (csvCt !== metaCt) {
                  // Okay, there is actually an error now. Log it.
                  logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
                }
              }
              // We have 2 columns, but neither one represents an array of columns. It's just a coincidence. Normal error.
              else {
                logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
              }
            }
            // column counts don't match, and this is not an ensemble table. Error
            else {
              logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
            }
          } // end if colCt dont match
        } catch(err){
          console.log("validator: requiredColumnsCtMatch: " + err);
        }

      }; // end requiredColumnsCtMatch fn

      /**
       * Check _multiple_ publications for required keys
       * Publication data is not mandatory, but if present, it must have the required keys
       *
       * @param {object} D Metadata
       */
      var requiredPubs = function (D) {
        try {
          // pub missing
          if (!D.hasOwnProperty("pub") || !D.pub) {
            logFeedback("warn", "No publication data");
          }
          // pub
          else {
            // pub entry loop
            for (var i = 0; i < D.pub.length; i++) {
              // special case: year and journal not required if this publication is a dataCitation
              if(D.pub[i].hasOwnProperty("type")){
                // special case: dataCitation
                if (D.pub[i].type === "dataCitation") {
                  requiredPub(D.pub[i], "pub" + i, keys_base.reqPubDcKeys);
                } else {
                  // normal publication
                  requiredPub(D.pub[i], "pub" + i, keys_base.reqPubKeys);
                }
              }
              // 'type' missing. Assume normal publication
              else{
                requiredPub(D.pub[i], "pub" + i, keys_base.reqPubKeys);
              }
            }
          }
        } catch (err) {
          console.log("validator: requiredPub: " + err);
          logFeedback("warn", "Encountered problem validating: pub");
        }
      };

      /**
       * Check _one_ publication for required keys
       *
       * @param {object} pub Metadata
       * @param {string} crumbs
       * @param {Array} pubKeys Required pub keys
       */
      var requiredPub = function(pub, crumbs, pubKeys){
        try{
          // TODO this doesn't work case-sensitively. EX: "Journal" causes an error for the 'journal' key requirement
          for (var k = 0; k < pubKeys.length; k++) {
            var key = pubKeys[k];
            if (!pub.hasOwnProperty(key)) {
              // this pub is missing a required key!
              logFeedback("err", "Missing data: " + crumbs + "." + key);
            } else if (!pub[key]){
              logFeedback("err", "Missing data: " + crumbs + "." + key);
            }
          }
        } catch(err) {
          console.log("requiredPubLoop: " + err);
        }
      };

      // checks if there is coordinate information needed to plot a map of the location
      var requiredGeo = function (m) {
        try {
          var coords = m.geo.geometry.coordinates.length;
          // start building map marker(s)
          if (coords === 2 || coords === 3) {
            // get coordinate values
            // GeoJson specifies [ LONGITUDE , LATITUDE, ELEVATION (optional)]
            var lon = m.geo.geometry.coordinates[0];
            var lat = m.geo.geometry.coordinates[1];
            // check if values are in range
            var lonValid = numberInRange(-180, 180, lon);
            var latValid = numberInRange(-90, 90, lat);

            if (!m.geo.geometry.coordinates[0]){
              logFeedback("err", "Missing data: longitude", "coordinates");
            } else if (!lonValid) {
              // check if longitude is range
              logFeedback("err", "Longitude out of range: Enter value from -180 to 180", "longitude");
            }


            if (!m.geo.geometry.coordinates[1]){
              logFeedback("err", "Missing data: latitude", "coordinates");
            } else if (!latValid) {
              // check if latitude is in range
              logFeedback("err", "Latitude out of range: Enter value from -90 to 90", "latitude");
            }
          } else {
            if (!m.geo.geometry.coordinates){
              // there aren't any coordinate values to make the map
              logFeedback("err", "Missing data: " + "geo - coordinates", "coordinates");
            }
          }
        } catch (err) {
          logFeedback("warn", "Unable to map location", "geo");
          console.log("validator: requiredPub: " + err);
        }
      };

      // Error log: Tally the error counts, and log messages to user
      var logFeedback = function (errType, msg, key) {
        key = key || "";
        if (errType === "warn") {
          feedback.wrnCt++;
          feedback.wrnMsgs.push(msg);
        } else if (key === "TSid") {
          feedback.missingTsidCt++;
          feedback.tsidMsgs.push(msg);
        } else if (errType === "err") {
          feedback.errCt++;
          feedback.errMsgs.push(msg);
        } else if (errType === "pos") {
          feedback.posMsgs.push(msg);
        }
      };

      // verify the 4 bagit files are present, indicating a properly bagged LiPD file.
      var verifyBagit = function (files) {
        // Bagit filenames are static. Check that each is present.
        var validBagitFiles = ["tagmanifest-md5.txt", "manifest-md5.txt", "bagit.txt", "bag-info.txt"];

        // Only run Verify Bagit when this is an uploaded file. NOT when it's being created from scratch
        // If create from scratch, it's not possible to have bagit files yet.
        if(options.fileUploaded){
          var count = 0;
          var errors = 0;
          validBagitFiles.forEach(function (filename) {
            if (files.hasOwnProperty(filename)) {
              count++;
            } else {
              errors++;
              logFeedback("warn", "Missing bagit file: " + filename);
            }
          });
          // Requires 4 bagit files to be valid bagit
          if (count === 4) {
            logFeedback("pos", "Valid Bagit File", "bagit");
            feedback.validBagit = true;
          }
        }
      };

      // Check for Valid LiPD data. If no errors, then it's valid.
      var verifyValid = function () {
        if (feedback.missingTsidCt > 1) {
          // Count all TSid errors as one cumulative error
          // $scope.feedback.errCt++;
          // Count all TSid errors as a single error
          feedback.errCt++;
          feedback.errMsgs.push("Missing data: TSid from " + feedback.missingTsidCt + " columns");
          feedback.status = "FAIL";
        }
        if (!valid) {
          if (feedback.errCt === 0) {
            valid = true;
            feedback.status = "PASS";
          } else {
            feedback.status = "FAIL";
          }
        }
      };


      // HELPERS

      // create a csv filename for a data table
      var createCsvFilename = function(crumbs){
        var _filename = crumbs + ".csv";
        try{
          if(files.json.dataSetName !== undefined){
            _filename = files.json.dataSetName + "." + _filename;
          } else if(files.json.dataSetName.length !== 0){
            _filename = files.json.dataSetName + "." + _filename;
          }
        } catch(err){
          console.log(err);
        }
        return _filename;
      };

      // Check that geo coordinates are within the proper latitude and longitude ranges.
      var numberInRange = function (start, end, val) {
        return val >= start && val <= end
      };

      var fixAuthor = function(p){
        try {
          var _d = [];
          for (var _u = 0; _u < p.length; _u++){
            if(p[_u].hasOwnProperty("authors")){
              p[_u].author = p[_u].authors;
              delete p[_u].authors;
            }
          } // end for loop authors key

          // for loop each pub
          for (var _e = 0; _e < p.length; _e++){
            if(p[_e].hasOwnProperty("author")){
              if (typeof(p[_e].author) === "string"){
                var _split = [];
                if (p[_e].author.indexOf("and") !== -1){
                  _split = p[_e].author.split(" and ");
                } // if author string sep by "and"
                else if (p[_e].author.indexOf(";") !== -1){
                  _split = p[_e].author.split(";");
                } // if author string sep by ";"
                for (var _a = 0; _a < _split.length; _a++){
                  _d.push({"name": _split[_a]});
                }
                // set the new object in place of the old string.
                p[_e].author = _d;
              } // end if author value is string

              // author is an array of strings (one name per entry)
              else if (Array.isArray(p[_e].author)){
                try{
                  if (p[_e].author[0] && typeof(p[_e].author[0])=== "string"){
                    for (var _c = 0; _c < p[_e].author.length; _c++){
                      _d.push({"name": p[_e].author[_c]});
                    }
                    p[_e].author = _d;
                  }
                } catch (err) {
                  console.log("validate: fixAuthor: " + err);
                }
              }
            } // if pub had author entry
          } // for loop author data type
        } catch(err){
          console.log("validate: fixAuthor: " + err);
        }
        return p;
      };

      var getLipdVersion = function(D){
        try{
          var _found = false;
          var _keys = ["lipdVersion", "LiPDVersion", "liPDVersion"];
          var _lipdVersion = "1.0";

          for(var _i=0; _i<_keys.length; _i++){
            if(D.hasOwnProperty(_keys[_i])) {
              // Cast to float
              _lipdVersion = D[_keys[_i]].toString();
              // Remove the key in case it's one that's not the standard 'lipdVersion'
              delete D[_keys[_i]];
              _found = true;
            }
          }
          if(!_found){
            logFeedback("warn", "LiPD Version unknown. Defaulting to v1.3. Results may be inaccurate");
          }
          // The given lipdVersion is not one of the allowed values
          if (["1.0", "1.1", "1.2", "1.3", 1.0, 1.1, 1.2, 1.3].indexOf(_lipdVersion) === -1){
            logFeedback("err", "Invalid LiPD Version: " + _lipdVersion);
          }
          return _lipdVersion;
        } catch(err){
          console.log("processData: getLipdVersion: " + err);
        }
      };

        // Call the local validate function, inside of processData
        cb(validate());

    }), // end processData


  }; // end return

}());


  // DATA AFTER IMPORT SERVICE
  // {
  //   "type": "bagit",
  //   "filenameFull": "MD98-2170.Stott.2004/tagmanifest-md5.txt",
  //   "filenameShort": "tagmanifest-md5.txt",
  //   "data": "d41d8cd98f00b204e9800998ecf8427e bag-info.txt\nace0ef9419c8edbe164a888d4e4ab7ee bagit.txt\n6754ca6beb4812de50cec58d8b4b2ef9 manifest-md5.txt\n",
  //   "pretty": "\"d41d8cd98f00b204e9800998ecf8427e bag-info.txt\\nace0ef9419c8edbe164a888d4e4ab7ee bagit.txt\\n6754ca6beb4812de50cec58d8b4b2ef9 manifest-md5.txt\\n\""
  // },
  // {
  //   "type": "csv",
  //   "filenameFull": "MD98-2170.Stott.2004/data/MD98-2170.Stott.2004.chron1measurement1.csv",
  //   "filenameShort": "MD98-2170.Stott.2004.chron1measurement1.csv",
  //   "data": {
  //     "data": [ [one col data], [one col data],...]
  //   }
  // },
  // {
  //   "type": "json",
  //   "filenameFull": "MD98-2170.Stott.2004/data/MD98-2170.Stott.2004.jsonld",
  //   "filenameShort": "MD98-2170.Stott.2004.jsonld",
  //   "data": {
  //     "archiveType": "marine sediment",
  //   }
  // }


  // DATA AFTER splitValidate()
  // {
  //   "lipdFilename": "MD98-2170.Stott.2004.lpd",
  //   "dataSetName": "MD98-2170.Stott.2004",
  //   "fileCt": 7,
  //   "bagit": {
  //     "bag-info.txt": {
  //       "type": "bagit",
  //       "filenameFull": "MD98-2170.Stott.2004/bag-info.txt",
  //       "filenameShort": "bag-info.txt",
  //       "data": "",
  //       "pretty": "\"\""
  //     },
  //   },
  //   "csv": {
  //     "MD98-2170.Stott.2004.chron1measurement1.csv": {
  //       "data": [ [one col of data], [one col of data], ...]
  //     }
  //   },
  //   "json": {
  //     "archiveType": "marine sediment",
  //     "geo": {},
  //   },
  //   "jsonSimple": {JUST IGNORE THIS}
  // }
