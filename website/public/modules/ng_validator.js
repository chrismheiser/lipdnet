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
     * @param {object} pageMeta Validation pageMeta
     * @param {callback} cb Callback sorts the validation results
     */
    validate: (function(files, pageMeta, cb){
      try{
        var _output = {};
        lipdValidator.populateTSids(files, function(files_1){
          _output.files = files_1.files;
          pageMeta.tsids_generated = files_1.tsids_generated;

          lipdValidator.processData(files_1.files, pageMeta, function(_results){
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
     * @param {object} pageMeta Validation pageMeta {"fileUploaded": true/false}
     * @param {callback} cb Callback sorts the validation results
     */
    validate_w_restructure: (function(files, pageMeta, cb){
      try{
        lipdValidator.restructure(files, function(files_2){
          lipdValidator.validate(files_2, pageMeta, function(_results){
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
    restructure: (function (objs, scopeFiles, cb) {
        // console.log("sortBeforeValidate: Start sorting");
        // Files: User data holds all the user selected or imported data
        // var files = {
        //     "lipdFilename": "",
        //     "dataSetName": "",
        //     "fileCt": 0,
        //     "bagit": {},
        //     "csv": {},
        //     "json": {}
        //   };
        try{
          scopeFiles.fileCt = objs.length;
          console.log("LiPD File Count: " + objs.length);

          // loop over each csv/jsonld object. sort them into the scope by file type
          objs.forEach(function (obj) {
            console.log("restructure: " + obj.filenameShort);
            if (obj.type === "json") {
              console.log(scopeFiles.lipdFilename);
              console.log(scopeFiles.lipdFilename);
              // console.log(obj.filenameFull);
              // console.log(obj.filenameFull.split("/")[0]);
              // files.dataSetName = obj.filenameFull.split("/")[0];
              // files.lipdFilename = obj.filenameFull.split("/")[0] + ".lpd";
              scopeFiles.json = obj.data;
            } else if (obj.type === "csv") {
              scopeFiles.csv[obj.filenameShort] = obj.data;
            } else if (obj.type === "bagit") {
              scopeFiles.bagit[obj.filenameShort] = obj;
            } else {
              console.log("restructure: Unknown File: " + obj.filenameFull);
            }
          });
          cb(scopeFiles);
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
        try{
          // Safe check. Make sure table has "columns"
          if (table.hasOwnProperty("columns")) {
            // Loop over all columns in the table
            for (var _i2 = 0; _i2 < table["columns"].length; _i2++) {
              var col = table["columns"][_i2];
              // Check for TSid key in column
              if(!col.hasOwnProperty("TSid")){
                // populate if doesn't exist.
                table["columns"][_i2]["TSid"] =  lipdValidator.generateTSid();
                _generated_count++;
              }
            }
          }

        } catch(err){
          console.log("populateTSids3: " + err);
        }
        return table;
      };

      // PopulateTSid: Tables
      // Loop for each data table
      var populateTSids2 = function(d, pc){
        var pcData = pc + "Data";
        try{
          // Check for entry
          if (d.hasOwnProperty(pcData)) {
            // Loop for each paleoData/chronData table
            for (var _k2 = 0; _k2 < d[pcData].length; _k2++) {
              // Is there a measurement table?
              if (d[pcData][_k2].hasOwnProperty("measurementTable")) {
                var _table1 = d[pcData][_k2]["measurementTable"];
                // Loop for all meas tables
                for (var _j = 0; _j < _table1.length; _j++) {
                  // Process table entry
                  d[pcData][_k2]["measurementTable"][_j] = populateTSids3(_table1[_j]);
                }
              }
              // Is there a model table?
              if (d[pcData][_k2].hasOwnProperty("model")) {
                var table = d[pcData][_k2]["model"];
                // Loop for each paleoModel table
                for (var _j2 = 0; _j2 < table.length; _j2++) {
                  // Is there a summaryTable?
                  if (d[pcData][_k2]["model"][_j2].hasOwnProperty("summaryTable")) {
                    // Process table
                    d[pcData][_k2]["model"][_j2]["summaryTable"] = populateTSids3(table[_j2]["summaryTable"]);
                  } // end summary
                  // Is there a ensembleTable?
                  if (table[_j2].hasOwnProperty("ensembleTable")) {
                    // Process table
                    d[pcData][_k2]["model"][_j2]["ensembleTable"] = populateTSids3(table[_j2]["ensembleTable"]);
                  } // end ensemble
                  // Is there a distributionTable?
                  if (table[_j2].hasOwnProperty("distributionTable")) {
                    var _table2 = table[_j2]["distributionTable"];
                    // Loop for all dist tables
                    for (var p = 0; p < _table2[_j2]["distributionTable"].length; p++) {
                      // Process table
                      d[pcData][_k2]["model"][_j2]["distributionTable"][p] = populateTSids3(_table2[p]);
                    }
                  } // end dist
                } // end model loop
              } // end model
            } // end paleoData loop
          } // end if hasOwnProperty
        } catch(err){
          console.log("populateTSids2: " + err);
        }

        return d;
      };

      // PopulateTSid: Paleo/Chron
      // Loop for each paleo/chron entry
      var populateTSids1 = function(files){
        // using files.json
        // run once for paleoData and chronData
        try{
          var pc = ["paleo", "chron"];
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
        } catch(err) {
          console.log("populateTSids1: " + err);
        }

        return {"files": files, "tsids_generated": _generated_count};
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
     * @param {object} pageMeta Validation pageMeta {"fileUploaded": true/false}
     * @param {callback} cb
     * @return {object} {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.status}
     */
    processData: (function(files, pageMeta, cb){

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
        "validWiki": "NA",
        "validNoaa": "NA",
        "validLipd": "NA",
        "lipdVersion": "NA",
        "missingTsidCt": 0,
        "missingUnitCt": 0,
        "missingMvCt": 0,
        "wrnCt": 0,
        "errCt": 0,
        "errCtWiki": 0,
        "errCtNoaa": 0,
        "tsidMsgs": [],
        "posMsgs": [],
        "errMsgs": [],
        "wrnMsgs": []
      };

      /** v1.0  - constant keys */
      var keys_base = {
        "advKeys": ["@context", "tsid", "number", "google", "md5", "lipdVersion", "investigators"],
        "miscKeys": ["studyName", "proxy", "metadataMD5", "googleSpreadSheetKey", "googleMetadataWorksheet",
          "@context", "tagMD5", "dataSetName", "description", "maxYear",
          "minYear", "originalDataUrl", "originalDataURL", "dataContributor", "collectionName", "googleDataUrl",
          "googleDataURL", "paleoData", "chronData", "notes"],
        "reqRootKeys": ["archiveType", "dataSetName", "paleoData", "geo"],
        "reqPubKeys": ["author", "title", "year", "journal"],
        "reqPubDcKeys": ["author", "title"],
        "reqColumnKeys": ["number", "variableName", "TSid", "units"],
        "reqTableKeys": ["filename", "columns", "missingValue"],
        "reqTableNameKeys": ["chronTableName", "paleoTableName", "paleoDataTableName", "chronDataTableName",
          "chronMeasurementTableName", "paleoMeasurementTableName", "name", "tableName"],
        "reqGeoKeys": ["coordinates"]
      };

      /** v1.3  && base keys */
      var keys_1_3 = {
        "miscKeys": ["WDCPaleoUrl","hasMinValue", "hasMaxValue", "hasMedianValue", "hasMeanValue", "hasResolution",
          "lipdVersion", "createdBy", "investigators", "maxYear", "minYear", "timeUnit", "onlineResource",
          "onlineResourceDescription", "modifiedDate", "originalSourceUrl", "datasetDOI"],
        "reqRootKeys": ["lipdVersion", "createdBy"],
        "reqTableNameKeys": ["tableName", "name"]
      };

      var _wiki_validate = {
        "required": {
          "root": ["dataSetName", "archiveType"],
          "pub": [],
          "funding": [],
          "geo": [],
          "columns": ["takenAtDepth", "variableName"],
          // "specialColumns": ["inferredVariableType", "proxyObservationType"]
        },
        "preferred": {
          "root": [],
          "pub": [],
          "funding": [],
          "geo": [],
          "columns": []
        }
      };

      var _noaa_validate = {
        "required": {
          "root": ["investigators", "mostRecentYear", "earliestYear", "timeUnit", "onlineResource", "onlineResourceDescription", "modifiedDate"],
          "pub": [],
          "funding": [],
          "geo": ["location", "siteName"],
          "columns": ["description", "dataFormat", "dataType"]
        },
        "preferred": {
          "root": ["originalSourceUrl", "datasetDOI", "funding"],
          "pub": ["author", "title", "year", "journal", "volume", "edition", "issue", "pages", "report", "doi",
                  "onlineResource", "citation", "abstract"],
          "funding": ["agency", "grant"],
          "geo": [],
          "columns": []
        }
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
          if(lipdVersion === "1.3"){
            console.log("validate_1_3: LiPD Structure");
            structureBase(files.json, keys_base.miscKeys.concat(keys_1_3.miscKeys));
            structure_1_3(files.json);
            console.log("validate_1_3: LiPD Required Fields");
            requiredBase(files.json);
            required_1_3(files.json);
          }
          console.log("validate: Bagit");
          logSpecialFeedback();
          verifyBagit(files.bagit);
          verifyWiki(files.json);
          verifyNoaa(files.json);
          checkPassFail(feedback.errCt, function(passFail){
            feedback.validLipd = passFail;
            if(passFail==="PASS"){
              valid = true;
            }
          });
          console.log("Validator Report: ");
          console.log("LiPD filename: " + files.lipdFilename);
          console.log("TSids created: " + pageMeta.tsids_generated);
          console.log("Wiki", feedback.validWiki, "NOAA", feedback.validNoaa, "LiPD", feedback.validLipd);

          // var jsonCopy = JSON.parse(JSON.stringify(files.json));
        } catch (err){
          console.log(err);
        }
        return {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.validLipd};
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
                  logFeedback("warn", "Oops, we don't recognize this key: '" + k + "'");
                  console.log("verifyBase: No rules for key: " + k);
                }
              }
            }
          } catch (err) {
            console.log("verifyBase: Caught error parsing: " + k + ": " + err);
          }
        }
      };

      /**
       * Structure v1.3
       * Top-level that calls down to individual sections
       *
       * @param D
       */
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
        try{
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
        } catch(err){
         console.log("structureSection_1_3: " + err);
        }
      };

        // REQUIRED DATA

      /**
       * Required data that is consistent across all versions
       *
       * @param {object} D Metadata
       */
      var requiredBase = function(D){
        requiredPubs(D);
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
       *  Required data for v1.3 - section
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
              logFeedback("err", "Missing: " + pdData + "0measurement0");
            }
          }
          // paleoData
          else {

            // paleoData empty. Require _AT LEAST_ one paleo measurement table
            if (pc === "paleo" && !D[pdData]) {
              logFeedback("err", "Missing: " + pdData + "0measurement0");
            } else {
              // paleoData entries
              for (var i = 0; i < D[pdData].length; i++) {

                var section = D[pdData][i];

                // measurement missing. Require _AT LEAST_ one paleo measurement table
                if (!section.hasOwnProperty("measurementTable") && pc === "paleo") {
                  logFeedback("err", "Missing: " + pc + "0measurement0");
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
              // Geo - make sure the whole section exists
              if (D.hasOwnProperty(key)) {
                // section exists, check that the required geo keys are present
                requiredGeo(D);
              }
              // Geo section missing. Required _AT LEAST_ coordinates
              else {
                logFeedback("err", "Missing: " + "geo.geometry.coordinates");
              }
            } else if (!D.hasOwnProperty(key) || !D[key]) {
              // Required key is missing
              logFeedback("err", "Missing: " + key);
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
          if (tables.length === 0){
            logFeedback("err", "Missing: " + crumbs + "0");
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
        var filename = table.filename || crumbs + ".csv";
        console.log(filename);
        table.filename = filename;
        try {
          // required table root keys
          for (var _w = 0; _w < keys_base.reqTableKeys.length; _w++) {
            // current key
            currKey = keys_base.reqTableKeys[_w];
            // current key exists in table?
            if (!table.hasOwnProperty(currKey) || !table[currKey]) {
              if (currKey === "missingValue"){
                table["missingValue"] = "nan";
                feedback.missingMvCt++;
              } else {
                logFeedback("err", "Missing: " + crumbs + "." + currKey);
              }
            }
          } // end columns loop

          // tableName
          for(var _tk = 0; _tk < tnks.length; _tk++){
            var _tnk = tnks[_tk];
            if(!table[_tnk]){
              table["tableName"] = crumbs;
            }
          }

          // column count match CSV count
          if(!table.hasOwnProperty("columns") || table.columns.length === 0){
            logFeedback("err", "Missing: " + crumbs + ".columns");
          } else if (table.hasOwnProperty("columns")) {
            // Required: CSV filename where column values are stored
            if (!filename) {
              logFeedback("err", "Missing: " + crumbs + ".filename")
            } else {
              requiredColumnsCtMatch(filename, table.columns);
            }

            // Required column keys
            for (var i = 0; i < table.columns.length; i++) {

              // Special Fields: variableType and proxyObservationType / inferredVariableType
              if(table.columns[i].hasOwnProperty("variableType")){
                var _varType = table.columns[i].variableType;
                if(_varType === "measured" || _varType === "measuredVariable"){
                  if(!table.columns[i].hasOwnProperty("proxyObservationType")){
                    logFeedback("err", "Missing: " + crumbs + ".column" + i + ".proxyObservationType", "proxyObservationType");
                  }
                } else if(_varType === "inferred"){
                  if(!table.columns[i].hasOwnProperty("inferredVariableType")){
                    logFeedback("err", "Missing: " + crumbs + ".column" + i + ".inferredVariableType", "inferredVariableType");
                  }
                } else {
                  logFeedback("err", "Missing: " + crumbs + ".column" + i + ".variableType", "variableType");
                }

              } else {
                logFeedback("err", "Missing: " + crumbs + ".column" + i + ".variableType", "variableType");
                logFeedback("err", "Missing: " + crumbs + ".column" + i + ".proxyObservationType OR inferredVariableType", "proxyObservationType|inferredVariableType");
              }

              // Required column keys
              for (var k in keys_base.reqColumnKeys) {
                if(keys_base.reqColumnKeys.hasOwnProperty(k)){
                  // current key
                  var currKey = keys_base.reqColumnKeys[k];
                  // current key exists in this column?
                  if (!table.columns[i].hasOwnProperty(currKey) || !table.columns[i][currKey]) {
                    if(currKey === "units"){
                      table.columns[i]["units"] = "unitless";
                      feedback.missingUnitCt++;
                    } else {
                      logFeedback("err", "Missing: " + crumbs + ".column" + i + "." + currKey, currKey);
                    }
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
      var logSpecialFeedback = function(){
        try{
          if (feedback.missingTsidCt > 0){
            logFeedback("warn", "Missing: TSid (" + feedback.missingTsidCt + " columns)\nTSids has been generated and added automatically", "TSid");
          }
          if(feedback.missingUnitCt > 0){
            logFeedback("warn", "Missing: units (" + feedback.missingUnitCt + " columns)\nThese columns have been assumed unitless and given a 'unitless' value")
          }
          if(feedback.missingMvCt > 0){
            logFeedback("warn",  "Missing: missingValue (" + feedback.missingMvCt + " columns)\nThese columns have been given the standard 'NaN' missing value")
          }
        } catch(err){
          console.log("logSpecialFeedback: " + err);
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
          var _crumbs = "";
          // in case author is formatted wrong, convert it to BibJson format
          pub = fixAuthor(pub);
          for (var _p = 0; _p < pub.length; _p++){
            var _pub = pub[_p];
            for(var _key in _pub){
              var _up1 = _p + 1;
              _crumbs = "pub" + _up1 + "." + _key;
              if(_pub.hasOwnProperty(_key)){
                if (_arrs.includes(_key)){
                  if (_key === "identifier"){
                    _crumbs = "pub" + _up1 + ".DOI";
                  }
                  // these keys must be an array
                  verifyArrObjs(_crumbs, _pub[_key], true);
                } else if (_key === "journal"){
                  // this key must be an object
                  verifyDataType("object", _crumbs, _pub[_key], false);
                } else {
                  // this key must be a string
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
                logFeedback("warn", "Missing: " + k);
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
        try{
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
        } catch(err){
          console.log("verifyArrObjs: " + err);
          return false;
        }
      };

      // Column counts fluctuate throughout the playground workflow. Check for paired metadata-values during each
      // validation cycle
      var correctColumnCounts = function(csvs){
        for(var _filename in csvs){
          if(csvs.hasOwnProperty(_filename)){
              // Our column count should be whatever the length of the data arrays are. Use the first array.
              csvs[_filename]["cols"] = csvs[_filename]["data"][0].length;
          }
        }
        return csvs;
      };

      // check that column count in a table match the column count in the CSV data
      var requiredColumnsCtMatch = function (filename, columns) {
        // Fix the column counts.
        files.csv = correctColumnCounts(files.csv);
        var csvCt = 0;
        try{
          // Get the column count for this csv file.
          csvCt = files.csv[filename].cols;
        } catch(err){
          logFeedback("err", "CSV filename(s) do not match filenames CSV filenames listed in the metadata", "filename");
          return;
        }
        try {
          var metaCt = columns.length;
          // edge case: ensemble table that has "two" columns, but actual column 2 is a list of columns.
          if (csvCt !== metaCt) {
            // column counts don't match. Do we have two columns? Might be an ensemble table
            if (columns.length === 1){
              if (Array.isArray(columns[0].number)){
                metaCt = columns[0].number.length - 1 + metaCt;
                if (csvCt !== metaCt) {
                  // Okay, there is actually an error now. Log it.
                  logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", jsonld has " + metaCt, filename);
                }
              }
            }
            else if (columns.length === 2) {
              // Is column 2 an array of columns? (most likely)
              if (Array.isArray(columns[1].number)) {
                // calculate how many columns this array REALLY represents.
                metaCt = columns[1].number.length - 1 + metaCt;
                // Do the column counts match now?
                if (csvCt !== metaCt) {
                  // Okay, there is actually an error now. Log it.
                  logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", jsonld has " + metaCt, filename);
                }
              }
              // is column 1 an array of column numbers? (less likely)
              else if (Array.isArray(columns[0].number)) {
                // calculate how many columns this array REALLY represents.
                metaCt = columns[0].number.length - 1 + metaCt;
                // Do the column counts match now?
                if (csvCt !== metaCt) {
                  // Okay, there is actually an error now. Log it.
                  logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", jsonld has " + metaCt, filename);
                }
              }
              // We have 2 columns, but neither one represents an array of columns. It's just a coincidence. Normal error.
              else {
                logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", jsonld has " + metaCt, filename);
              }
            }
            // column counts don't match, and this is not an ensemble table. Error
            else {
              logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", jsonld has " + metaCt, filename);
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
              // switch to 1-index for reporting errors
              var _up1 = i + 1;
              // special case: year and journal not required if this publication is a dataCitation
              if(D.pub[i].hasOwnProperty("type")){
                // special case: dataCitation

                if (D.pub[i].type === "dataCitation") {
                  requiredPub(D.pub[i], "pub" + _up1, keys_base.reqPubDcKeys);
                } else {
                  // normal publication
                  requiredPub(D.pub[i], "pub" + _up1, keys_base.reqPubKeys);
                }
              }
              // 'type' missing. Assume normal publication
              else{
                requiredPub(D.pub[i], "pub" + _up1, keys_base.reqPubKeys);
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
            if (key === "identifier"){
              key = "DOI";
            }
            if (!pub.hasOwnProperty(key)) {
              // this pub is missing a required key!
              logFeedback("err", "Missing: " + crumbs + "." + key);
            } else if (!pub[key]){
              logFeedback("err", "Missing: " + crumbs + "." + key);
            }
          }
        } catch(err) {
          console.log("requiredPubLoop: " + err);
        }
      };

      // checks if there is coordinate information needed to plot a map of the location
      var requiredGeo = function (m) {
        try {
          // COORDINATE CHECKS
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


            if(lon===0){
              logFeedback("warn", "Longitude set to 0. Is this intended?", "coordinates");
            }
            if (!lon && lon !== 0){
              logFeedback("err", "Missing: longitude", "coordinates");
            } else if (!lonValid) {
              // check if longitude is range
              logFeedback("err", "Longitude out of range: Enter value from -180 to 180", "longitude");
            }

            if (lat === 0){
              logFeedback("warn", "Latitude set to 0. Is this intended?", "coordinates");
            }
            else if (!lat && lat !== 0){
              logFeedback("err", "Missing: latitude", "coordinates");
            } else if (!latValid) {
              // check if latitude is in range
              logFeedback("err", "Latitude out of range: Enter value from -90 to 90", "latitude");
            }
          } else {
            if (!m.geo.geometry.coordinates){
              // there aren't any coordinate values to make the map
              logFeedback("err", "Missing: " + "coordinates", "coordinates");
            }
          }
        } catch (err) {
          logFeedback("warn", "Unable to map location", "geo");
          console.log("validator: requiredPub: " + err);
        }
      };

      // Error log: Tally the error counts, and log messages to user
      var logFeedback = function (errType, msg, key) {
        try{
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
        } catch(err){
          console.log("logFeedback: " + err);
        }
      };

      // verify the 4 bagit files are present, indicating a properly bagged LiPD file.
      var verifyBagit = function (files) {
        try{
          // Bagit filenames are static. Check that each is present.
          var validBagitFiles = ["tagmanifest-md5.txt", "manifest-md5.txt", "bagit.txt", "bag-info.txt"];

          // Only run Verify Bagit when this is an uploaded file. NOT when it's being created from scratch
          // If create from scratch, it's not possible to have bagit files yet.
          if(pageMeta.fileUploaded){
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
        } catch(err){
          console.log("verifyBagit: " + err);
        }
      };

      /**
       *
       * Verify that the Wiki required fields are present when the user wishes to meet Wiki standards.
       * Data is split into "required" and "preferred" fields, and logged as errors and warnings respectively.
       *
       * @param D Metadata
       *
       */
      var verifyWiki = function (D){
        var _opts = {"mode": "Wiki", "ready": pageMeta.wikiReady, "keys": _wiki_validate, "count": feedback.errCtWiki};
        verifyNoaaWiki(D, _opts, function(){
          checkPassFail(feedback.errCtWiki, function(passFail){
            feedback.validWiki = passFail;
          });
        });
      };

      /**
       * Verify that the NOAA required fields are present when the user wishes to meet NOAA standards.
       * Data is split into "required" and "preferred" fields, and logged as errors and warnings respectively.
       *
       * @param D Metadata
       */
      var verifyNoaa = function(D){
        var _opts = {"mode": "NOAA", "ready": pageMeta.noaaReady, "keys": _noaa_validate, "count": feedback.errCtNoaa};
        verifyNoaaWiki(D, _opts, function(){
          checkPassFail(feedback.errCtNoaa, function(passFail){
            feedback.validNoaa = passFail;
          });
        });
      };

      // NOAA
      /**
       * Verify that the NOAA required fields are present when the user wishes to meet NOAA standards.
       * Data is split into "required" and "preferred" fields, and logged as errors and warnings respectively.
       *
       * @param D Metadata
       * @param opts Parameters that are needed depending on the mode being run (noaa v. wiki)
       * @param cb Callback
       */
      var verifyNoaaWiki = function(D, opts, cb){
        if(opts.ready){
          var _pcs = ["paleoData", "chronData"];

          try{

            // Required Root Keys
            for(var _r = 0; _r < opts["keys"]["required"]["root"].length; _r++){
              if(!D.hasOwnProperty(opts["keys"]["required"]["root"][_r])){
                logFeedback("err", "(" + opts.mode + ") Missing: " + opts["keys"]["required"]["root"][_r]);
                if(opts.mode === "NOAA"){
                  feedback.errCtNoaa++;
                } else if (opts.mode === "Wiki"){
                  feedback.errCtWiki++;
                }
              }
            }

            // Preferred Root Keys
            for(var _p = 0; _p < opts["keys"]["preferred"]["root"].length; _p++){
              if(!D.hasOwnProperty(opts["keys"]["preferred"]["root"][_p])){
                logFeedback("warn", "(" + opts.mode + ") Missing: " + opts["keys"]["preferred"]["root"][_p]);
              }
            }



            // Special Case: NOAA GEO
            if(opts.mode==="NOAA"){
              for(var _g=0; _g < opts["keys"]["required"]["geo"].length; _g++){
                try{
                  var _key1 = opts["keys"]["required"]["geo"][_g];
                  if(!D.geo.properties[_key1]){
                    logFeedback("err", "(NOAA) Missing: " + _key1);
                  }
                } catch(err){
                  logFeedback("err", "(NOAA) Missing: " + _key1);

                }
              }
            }

            // Look got the COLUMN keys required by the WIKI
            for (var _y=0; _y<_pcs.length; _y++) {
              var _pc = _pcs[_y];
              if(D.hasOwnProperty(_pc)){
                for (var i = 0; i < D[_pc].length; i++) {
                  var section = D[_pc][i];

                  // measurement
                  if (section.hasOwnProperty("measurementTable")) {
                    requiredTablesNoaaWiki(section["measurementTable"], _pc + i + "measurement", opts.keys, opts.mode)
                  }

                  // model
                  if (section.hasOwnProperty("model")) {
                    for (var _k = 0; _k < section["model"].length; _k++) {
                      var modTables = section["model"][_k];
                      // summary
                      if (modTables.hasOwnProperty("summaryTable")) {
                        requiredTablesNoaaWiki(modTables.summaryTable, _pc + i + "model" + _k + "summary", opts.keys, opts.mode)
                      }
                      // ensemble
                      if (modTables.hasOwnProperty("ensembleTable")) {
                        requiredTablesNoaaWiki(modTables.ensembleTable, _pc + i + "model" + _k + "ensemble", opts.keys, opts.mode)
                      }
                      // distribution
                      // if (modTables.hasOwnProperty("distributionTable")) {
                      //   requiredTablesNoaa(modTables.distributionTable, pc + _i + "model" + _k + "distribution", _noaa_validate["required"]["columns"])
                      // }
                    }
                  } // end model
                } // end pcData loop
              }

            } // end else

            cb();
          } catch(err){
            console.log("verifyNoaaWiki: " + opts.mode + ": "   + err);
          }
        }
      };

      /**
       * Check _multiple_ tables for required keys
       *
       * @param {object} tables Metadata
       * @param {string} crumbs Crumbs for path so far
       * @param {object} keys Keys to look for
       * @param {string} mode NOAA or Wiki mode
       */
      var requiredTablesNoaaWiki = function(tables, crumbs, keys, mode){
        try{
          for (var _w = 0; _w < tables.length; _w++) {
            requiredTableNoaaWiki(tables[_w], crumbs + _w, keys, mode);
          }
        } catch(err){
          console.log("requiredTablesNoaaWiki: " + mode + ": " + crumbs + ": " + err);
        }
      };

      /**
       * Check _one_ table for required keys
       *
       * @param {object} table Metadata
       * @param {string} crumbs Crumbs for path so far
       * @param {object} keys Keys to look for
       * @param {string} mode NOAA or Wiki mode
       */
      var requiredTableNoaaWiki = function (table, crumbs, keys, mode) {
        try {
          if (table.hasOwnProperty("columns")) {
            // Required column keys
            for (var i = 0; i < table.columns.length; i++) {
              requiredColumnNoaaWiki(table.columns[i], crumbs + ".column" + i + ".", mode, "err", keys["required"]);
              requiredColumnNoaaWiki(table.columns[i], crumbs + ".column" + i + ".", mode, "warn", keys["preferred"]);
            } // end columns loop
          }
        } catch(err){
          console.log("requiredTableNoaaWiki: " + mode + ": " + err);
        }

      }; // end requiredTable fn

      /**
       * Check _one_ table for required keys
       *
       * @param {object} column Metadata
       * @param {string} crumbs Crumbs for path so far
       * @param {string} mode NOAA or Wiki mode
       * @param {string} lvl err or warn log level
       * @param {object} keys Keys to look for
       */
      var requiredColumnNoaaWiki = function (column, crumbs, mode, lvl, keys){
        try{
          for (var _p in keys["columns"]) {
            if(keys["columns"].hasOwnProperty(_p)){
              // current key
              var _currKey = keys["columns"][_p];
              // current key exists in this column?
              if (!column.hasOwnProperty(_currKey) || !column[_currKey]) {
                logFeedback(lvl, "(" + mode + ") Missing: " + crumbs + _currKey, _currKey);
                if(lvl === "err" && mode === "NOAA"){
                  feedback.errCtNoaa++;
                } else if (lvl === "err" && mode === "Wiki"){
                  feedback.errCtWiki++;
                }
              }
            }
          } // end preferred key check
        } catch(err){
          console.log("requiredColumnNoaaWiki: " + mode + ": " + err);
        }
      };

      var checkPassFail = function(count, cb){
        if(count === 0){
          cb("PASS");
        } else {
          cb("FAIL");
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

    }) // end processData


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
