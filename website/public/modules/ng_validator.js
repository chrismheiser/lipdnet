/**
 * ng_validator.js
 *
 * Provides validation for LiPD data on the lipd.net client-side. This process covers a lot of ground.
 * It is responsible for fixing LiPD structures, updating old LiPD versions into new LiPD versions, and checking
 * if the data conforms to our LiPD standards. Validate and validate_w_restructure are two entry points. processData is
 * the main validation function. The others are helpers.
 *
 */

var lipdValidator = (function(){

  // 'use strict';
  return {

    /**
     * Validate: Entry point for the validation process.
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
     * Validate & Restructure - Includes restructuring raw data when it is not yet validator-ready.
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
     * Generate a TSid. This is a Time Series Identifier. It allows us to index all columns with a unique ID.
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
     * processData: the main validation process
     *
     * Validate based on lipdVersion found, or default to v1.1 if not found
     * Check data for required fields, standard structure, and standard data types.
     * Attempt to fix invalid data. For all else, return data with and feedback for the user to fix (errors and
     * warnings)
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
        "lipdCompleteType": null,
        "lipdComplete": 0,
        "posCt": 0,
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
          "minYear", "originalDataUrl", "dataContributor", "collectionName", "googleDataUrl",
          "googleDataURL", "paleoData", "chronData", "notes", "earliestYear", "mostRecentYear", "NOAAdataType",
          "NOAAseasonality", "NOAAstudyName", "originalSourceUrl", "originalSourceUrlDescription", "onlineResource",
          "gcmdLocation", "location", "timeUnit", "modifiedDate", "datasetDOI", "NOAAdataFormat"],
        "reqRootKeys": ["archiveType", "dataSetName", "paleoData", "geo"],
        "reqPubKeys": ["author", "title", "year", "journal"],
        "reqPubDcKeys": ["author", "title"],
        "reqColumnKeys": ["number", "variableName", "TSid", "units"],
        "reqTableKeys": ["filename", "missingValue"],
        "reqTableNameKeys": ["chronTableName", "paleoTableName", "paleoDataTableName", "chronDataTableName",
          "chronMeasurementTableName", "paleoMeasurementTableName", "name", "tableName"],
        "reqGeoKeys": ["coordinates"]
      };

      /** v1.3  && base keys */
      var keys_1_3 = {
        "miscKeys": ["WDCPaleoUrl","hasMinValue", "hasMaxValue", "hasMedianValue", "hasMeanValue", "hasResolution",
          "lipdVersion", "createdBy", "investigators", "maxYear", "minYear", "timeUnit", "onlineResource",
          "onlineResource", "modifiedDate", "originalSourceUrl", "datasetDOI"],
        "reqRootKeys": ["lipdVersion", "createdBy"],
        "reqTableNameKeys": ["tableName", "name"]
      };

      // Wiki Mode - All keys that are required and preferred for the LinkedEarth Wiki
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

      // NOAA Mode - All keys that are required and preferred for NOAA Paleo
      var _noaa_validate = {
        "required": {
          "root": ["collectionName", "investigators", "mostRecentYear", "earliestYear", "timeUnit",
                    "onlineResource", "modifiedDate"],
          "pub": [],
          "funding": [],
          "geo": ["location", "siteName", "gcmdLocation"],
          "columns": ["description", "NOAAdataFormat", "NOAAdataType"]
        },
        "preferred": {
          "root": ["originalSourceUrl", "datasetDOI", "funding"],
          "pub": ["author", "title", "year", "journal", "volume", "edition", "issue", "pages", "report", "doi",
                  "citation", "abstract"],
          "funding": ["agency", "grant"],
          "geo": [],
          // NOAAseasonality, detail, measurementMethod, measurementMaterial, notes, error
          "columns": []
        }
      };

      /**
       *  Validate
       *  Main validation function that calls all subroutines
       *
       * @return {object}    Metadata and validation feedback results
       */
      var validate = function () {
        try{
          // Get the lipd version to determine which validation to use
          var lipdVersion = getLipdVersion(files.json);
          files.json["lipdVersion"]  = lipdVersion;
          feedback.lipdVersion = lipdVersion;
          console.log("Validating version: " + lipdVersion);
          // Preliminary legwork. Fix some things before validating
          files.csv = removeEmptyValueRows(files.csv);
          files.json = fixOnlineResource(files.json);

          if(lipdVersion === "1.3"){
            console.log("validate_1_3: LiPD Structure");
            structureBase(files.json, keys_base.miscKeys.concat(keys_1_3.miscKeys));
            structure_1_3(files.json);
            console.log("validate_1_3: LiPD Required Fields");
            requiredBase(files.json);
            requiredPaleoTable(files);
            required_1_3(files.json);
          }
          console.log("validate: Bagit");
          logSpecialFeedback();
          files.json = calculateInferredValues(files.json, files.csv);
          verifyBagit(files.bagit);
          verifyWiki(files.json);
          verifyNoaa(files.json);
          checkPassFail(feedback.errCt, function(passFail){
            feedback.validLipd = passFail;
            if(passFail==="PASS"){
              valid = true;
            }
          });
          calculatePercentComplete();
          files.json["lipdComplete"] = feedback.lipdComplete + "%";
          console.log(feedback);
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
       *
       *
       *  @param {Object} D     Metadata
       *  @param {Object} keys  Valid keys for this specific LiPD version ontology.
       *  @return None          Data updated in global scope
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
                  v = fixFunding(v);
                  D[k] = v;
                  var _fundPassed = verifyArrObjs(k, v, true);
              } else if (k === "geo") {
                // geo must follow GeoJSON standards
                verifyDataType("object", k, v, true);
              } else {
                // No rules for these keys. Log warning, but allow data.
                if (keys.indexOf(k) === -1) {
                  // logFeedback("warn", "Oops, we don't recognize this key: '" + k + "'");
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
       * Top level that calls on the paleoData and chronData sections
       *
       * @param {Object} D   Metadata
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
       *
       * measurement: multiple objects
       * summary: multiple objects
       * method: single object
       * ensemble: multiple objects
       * distribution: multiple objects
       *
       * @param {String} pc   paleo or chron mode
       * @param {Array}  d    Metadata
       * @return None         Data updated in global scope
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
       * Required data that is consistent across all versions.
       *
       * @param {Object} D    Metadata
       * @return None         Data updated in global scope
       */
      var requiredBase = function(D){
        requiredPubs(D);
      };

      /**
       * Required data for v1.3
       * Top level, check root metadata, and then dive into chron and paleo sections.
       *
       * @param {Object} D     Metadata
       * @return None          Data is updated in global scope
       */
      var required_1_3 = function(D){
        requiredRoot(D, keys_base.reqRootKeys.concat(keys_1_3.reqRootKeys));
        requiredSection_1_3("paleo", D);
        requiredSection_1_3("chron", D);
      };

      /**
       *  Required data for v1.3 - section
       *  Required data for the paleoData and chronData sections
       *  Loop for each object in paleoData and chronData
       *
       * @param {String} pc    paleo or chron
       * @param {Object} D     Metadata
       * @return None          Data is updated in global scope
       */
      var requiredSection_1_3 = function(pc, D){
        var pdData = pc + "Data";

        try{
          // paleoData missing. Require _AT LEAST_ one paleo measurement table
          if (!D.hasOwnProperty(pdData)) {
            if (pc === "paleo") {
              logFeedback("err", "Missing: " + pdData + "0measurement0", "");
            } else {
              logFeedback("pos", "", "paleoData");

            }
          }
          // paleoData
          else {
            // paleoData empty. Require _AT LEAST_ one paleo measurement table
            if (pc === "paleo" && !D[pdData]) {
              logFeedback("err", "Missing: " + pdData + "0measurement0", "");
            } else {
              // paleoData entries
              for (var i = 0; i < D[pdData].length; i++) {

                var section = D[pdData][i];

                // measurement missing. Require _AT LEAST_ one paleo measurement table
                if (!section.hasOwnProperty("measurementTable") && pc === "paleo") {
                  logFeedback("err", "Missing: " + pc + "0measurement0", "");
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
       * @param {Object}  D      Metadata
       * @param {Object}  keys   Keys Required keys for this LiPD Version
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
            } else {
                logFeedback("pos", "", "");
            }
          } // end for
        } catch(err){
          console.log("validator: requiredRoot: " + err);
        }

      };

      /**
       * Check _multiple_ tables for required keys
       *
       * @param {Object} tables    Metadata
       * @param {String} crumbs    Crumbs for structure path so far (i.e. paleo1.measurement1.tableName)
       * @param {Object} tnks      tableName keys for this LiPD version
       */
      var requiredTables = function(tables, crumbs, tnks){
        try{
          if (tables.length === 0){
            logFeedback("err", "Missing: " + crumbs + "0", "");
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
       * @param {Object} table     Metadata
       * @param {String} crumbs    Crumbs for structure path so far (i.e. paleo1.measurement1.tableName)
       * @param {Object} tnks      tableName keys for this LiPD Version
       */
      var requiredTable = function (table, crumbs, tnks) {

        var filename = null;

        // Table has an existing filename. We need to fix it by removing the DSN prefix, and reconcile it to files.csv
        if(table.hasOwnProperty("filename")){
          // Chosen filename is returned. files.csv contains chosen filename as well.
          filename = reconcileCsvFilenames(table.filename, crumbs + ".csv");
          table.filename = filename;
        }
        // Table does not have a filename. Create one from the crumbs path.
        else {
            filename = crumbs + ".csv";
            table['filename'] = filename;
            if(!files.csv.hasOwnProperty(filename)){
              files.csv[filename] = {};
            }
        }

        try {
          // required table root keys
          for (var _w = 0; _w < keys_base.reqTableKeys.length; _w++) {
            // current key
            var currKey = keys_base.reqTableKeys[_w];
            // current key exists in table?
            if (!table.hasOwnProperty(currKey) || !table[currKey]) {
              if (currKey === "missingValue"){
                table["missingValue"] = "nan";
                feedback.missingMvCt++;
              } else {
                logFeedback("err", "Missing: " + crumbs + "." + currKey, currKey);
              }
            } else {
              logFeedback("pos", "Required data found: " + currKey, currKey);
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
            logFeedback("err", "Missing: " + crumbs + ".columns", "");
          } else if (table.hasOwnProperty("columns")) {
            // Required: CSV filename where column values are stored
            if (!filename) {
              logFeedback("err", "Missing: " + crumbs + ".filename", "")
            } else {
              logFeedback("pos", "Required data found: filename", "filename");
              requiredColumnsCtMatch(filename, table.columns);
            }

            requiredColumns(crumbs, table.columns);

          } // end 'if columns exist'

        } catch(err){
          console.log("validator: requiredTable: " + err);
        }

      }; // end requiredTable fn

      /**
       * Check for the required keys at the column level. Loop over an array of columns, and check each one.
       *
       * @param  {String} crumbs   Crumbs for structure path so far (i.e. paleo1.measurement1.tableName)
       * @param  {Array}  columns  Metadata columns from one table
       */
      var requiredColumns = function(crumbs, columns){
          // Required column keys
          for (var i = 0; i < columns.length; i++) {

              // Special Fields: variableType and proxyObservationType / inferredVariableType
              if(columns[i].hasOwnProperty("variableType")){
                  logFeedback("pos", "Required data found: variableType", "");
                  var _varType = columns[i].variableType;
                if(_varType === "measured" || _varType === "measuredVariable"){
                  if(!columns[i].hasOwnProperty("proxyObservationType")){
                    logFeedback("err", "Missing: " + crumbs + ".column" + i + ".proxyObservationType", "proxyObservationType");
                  } else {
                    logFeedback("pos", "Required data found: proxyObservationType", "");
                  }
                } else if(_varType === "inferred"){
                  if(!columns[i].hasOwnProperty("inferredVariableType")){
                    logFeedback("err", "Missing: " + crumbs + ".column" + i + ".inferredVariableType", "inferredVariableType");
                  } else {
                      logFeedback("pos", "Required data found: inferredVariableType", "");
                  }
                } else {
                  logFeedback("err", "Missing: " + crumbs + ".column" + i + ".variableType", "variableType");
                }

              } else {
                logFeedback("err", "Missing: " + crumbs + ".column" + i + ".variableType", "variableType");
                // logFeedback("err", "Missing: " + crumbs + ".column" + i + ".proxyObservationType OR inferredVariableType", "proxyObservationType|inferredVariableType");
              }

              // Loop required column keys
              for (var k in keys_base.reqColumnKeys) {
                  // Safety check
                  if(keys_base.reqColumnKeys.hasOwnProperty(k)){
                      // Current key
                      var currKey = keys_base.reqColumnKeys[k];
                      // Is the current key in this column?
                      if (!columns[i].hasOwnProperty(currKey) || !columns[i][currKey]) {
                          // Is the column missing units?
                          if(currKey === "units"){
                              // Add the units field and insert "unitless" for now.
                              columns[i]["units"] = "unitless";
                              feedback.missingUnitCt++;
                          } else {
                              // Log that we're missing required data.
                              logFeedback("err", "Missing: " + crumbs + ".column" + i + "." + currKey, currKey);
                          }
                      } else {
                          logFeedback("pos", "Required data found: " + currKey, currKey);
                      }
                  }
              }
          }
      };

      var requiredPaleoTable = function(files){
        // Required data
        // table, table values, variableName
          var _table = null;
          try{
            _table = files.json["paleoData"][0]["measurementTable"][0];
            logFeedback("pos", "paleo0measurement0 provided", "paleo0measurement0");
          }catch(err){
            logFeedback("err", "Missing: paleo0measurement0" , "paleo0measurement0");
          }
          if(_table){
              // columns
              // if(!_table.hasOwnProperty("columns") || _table.columns.length === 0){
              //   logFeedback("err", "Missing: paleo0measurement0 column metadata", "paleo0measurement0.columns");
              // } else {
              //   logFeedback("pos", "Provided paleo0measurement0 column metadata", "paleo0measurement0.columns");
              // }
              // table name link to csv values
              try{
                console.log(files.csv[_table.filename]);
                  if(!(_table.filename in files.csv)){
                      logFeedback("err", "Missing: paleo0measurement0 values", "paleo0measurement0.values");
                  } else {
                      logFeedback("pos", "Provided paleo0measurement0 values data", "paleo0measurement0.values");
                  }
              } catch(err){
                  logFeedback("err", "Missing: paleo0measurement0 values", "paleo0measurement0.values");
              }


          }

      };

      /**
       *
       * Special feedback log
       *
       * Notify the user if there were any tsids that were auto-generated. TsIDs only persist if the file is downloaded
       * (web) or saved (API).
       *
       * @return none : data sent to another function.
       *
       */
      var logSpecialFeedback = function(){
        try{
          if (feedback.missingTsidCt > 0){
            logFeedback("warn", "Missing: TSid (" + feedback.missingTsidCt + " columns)\nTSids has been generated and added automatically", "TSid");
          }
          if(feedback.missingUnitCt > 0){
            logFeedback("warn", "Missing: units (" + feedback.missingUnitCt + " columns)\nThese columns have been assumed unitless and given a 'unitless' value", null)
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
       * @param {Object} pub   Publication data (all)
       * @return None          Data updated in global scope
       */
      var verifyBibJson = function(pub){
        try {
          // these keys must be an array of objects
          var _arrs = ["author", "identifier", "editor", "license", "link"];
          var _crumbs = "";
          // in case author is formatted wrong, convert it to BibJson format
          pub = fixAuthor(pub);
          pub = fixDoi(pub);
          // Loop over each publication entry
          for (var _p = 0; _p < pub.length; _p++){
            // One publication entry
            var _pub = pub[_p];
            for(var _key in _pub){
              // Increase a 0-indexing to 1-indexing
              var _up1 = _p + 1;
              // Create the crumbs path string
              _crumbs = "pub" + _up1 + "." + _key;
              if(_pub.hasOwnProperty(_key)){
                if (_arrs.includes(_key)){
                  if (_key === "identifier"){
                    _crumbs = "pub" + _up1 + ".DOI";
                  }
                  // These keys must be an array
                  verifyArrObjs(_crumbs, _pub[_key], true);
                } else if (_key === "journal"){
                  // This key must be an object
                  verifyDataType("object", _crumbs, _pub[_key], false);
                } else {
                  // this key must be a string
                  verifyDataType("string", _crumbs, _pub[_key], false);
                }
              }
            }
          }
        } catch (err) {
          // Something unknown went wrong.
          console.log("validate: verifyBibJson: " + err);
        }
      };

      var verifyGeoJson = function(v){
        // TODO This isn't an imminent need, but we do use the GeoJSON format, so we may want to check for compliance
        // TODO at some point.
      };

      /**
       * Verify that the data for a given field matches the data type that should belong to that field.
       *
       * @param {String} dt        Data type - string, array, or object
       * @param {String} k         The key name / field name that this data belongs to.
       * @param {*}      v         The object to be tested for the given data type
       * @param {Boolean} addToLog Whether or not this feedback ought to be logged
       * @return {Boolean} : Data type is or isn't the correct type
       */
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

      /**
       * Check the given data (v) is an Array with objects in it.
       *
       * @param {String}  k         The key name / field name that this data belongs to.
       * @param {*}       v         The object to be tested for the given data type
       * @param {Boolean} addToLog  Whether or not this feedback ought to be logged
       * @return {Boolean}          Data type is or isn't the correct type
       */
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

      /**
       * Column counts fluctuate throughout the playground workflow. Check for paired metadata-values during each
       * validation cycle.
       *
       * @param  {Object} csvs   Table data values that are sorted by filename. Accompanied by metadata about the values
       *                         (delimiter, column count, row count, etc)
       * @return {Object}        The same csv data object, but with updated column counts
       */
      var correctColumnCounts = function(csvs){
        for(var _filename in csvs){
          if(csvs.hasOwnProperty(_filename)){
              var _max = 0;
              // Our column count should be whatever the length of the data arrays are. Use the first array.
              // csvs[_filename]["cols"] = csvs[_filename]["data"][0].length;
              for(var _c = 0; _c < csvs[_filename]["data"].length; _c++){
                if(csvs[_filename]["data"][_c].length > _max){
                    _max = csvs[_filename]["data"][_c].length;
                }
              }
              csvs[_filename]["cols"] = _max;
          }
        }
        return csvs;
      };

      /**
       * Compare the column count of the table values with the column count stored in metadata. Log an error if these
       * do not match
       *
       * Column count metadata is accessed from the global scope
       *
       * @param {String} filename   The csv filename of the current table data
       * @param {Object} columns    Column values (full table) stored as nested arrays.
       * @return None               Feedback is logged to global scope
       */
      var requiredColumnsCtMatch = function (filename, columns) {
        // Fix the column counts.
        files.csv = correctColumnCounts(files.csv);
        var csvCt = 0;
        try{
          // Get the column count for this csv file.
          csvCt = files.csv[filename].cols;
          logFeedback("pos", "CSV column count for: " + filename, filename);
        } catch(err){
          logFeedback("err", "Missing CSV column count for: " + filename, filename);
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
                } else {
                  logFeedback("pos", "Column counts match", "");
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
                } else {
                  logFeedback("pos", "Column counts match", "");
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
                } else {
                  logFeedback("pos", "Column counts match", "");
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
       * Loop over each publication entry and check for required keys.
       * Publication data is not required, but if an entry is present, certain data is required.
       *
       * @param {object} D LiPD Metadata
       * @return None      Feedback is logged to global scope
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
          logFeedback("warn", "Encountered problem validating: Publication", null);
        }
      };

      /**
       * Check one publication entry for required keys
       *
       * @param {object} pub       Metadata for this one publication entry
       * @param {string} crumbs    Path crumbs leading to this location
       * @param {Array}  pubKeys   Required publication keys
       */
      var requiredPub = function(pub, crumbs, pubKeys){
        try{
          // TODO this doesn't work case-sensitively. EX: "Journal" causes an error for the 'journal' key requirement
          for (var k = 0; k < pubKeys.length; k++) {
            var key = pubKeys[k];
            if (key === "identifier"){
              key = "DOI";
            }
            if (!pub.hasOwnProperty(key) || !pub[key]) {
              // this pub is missing a required key!
              logFeedback("err", "Missing: " + crumbs + "." + key, key);
            } else {
              // Key exists. Increment positive counter.
              logFeedback("pos", "Required data found: " + key, key);
            }
          }
        } catch(err) {
          console.log("requiredPubLoop: " + err);
        }
      };

      /**
       * Does coordinate information exist to plot a map? Are the coordinates within the correct range for
       * longitude and latitude values?
       *
       * @param {object} m   Metadata (all)
       * @return None        Feedback is logged to the global scope
       */
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
              logFeedback("warn", "Longitude set to 0. Is this intentional?", "coordinates");
            }
            if (!lon && lon !== 0){
              logFeedback("err", "Missing: longitude", "longitude");
            } else if (!lonValid) {
              // check if longitude is range
              logFeedback("err", "Longitude out of range: Enter value from -180 to 180", "longitude");
            } else {
                logFeedback("pos", "", "longitude");
            }
            if (lat === 0){
              logFeedback("warn", "Latitude set to 0. Is this intentional?", "latitude");
            }
            else if (!lat && lat !== 0){
              logFeedback("err", "Missing: latitude", "latitude");
            } else if (!latValid) {
              // check if latitude is in range
              logFeedback("err", "Latitude out of range: Enter value from -90 to 90", "latitude");
            } else {
                logFeedback("pos", "", "latitude");
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

      /**
       * Error log: Tally the error counts, and log feedback to be relayed to the user.
       *
       * @param   {String} errType  Type of error: warn, pos, err
       * @param   {String} msg      Error or warning message that is displayed
       * @param   {String} key      The key that caused the error
       * @return  None              Feedback is logged to the global scope
       */
      var logFeedback = function (errType, msg, key) {
        try{
          key = key || "";
          if (errType === "warn") {
            feedback.wrnCt++;
            feedback.wrnMsgs.push(msg);
          } else if (key === "TSid") {
            // TSid errors are tallied into a counter, because we want to consolidate into one error message.
            feedback.missingTsidCt++;
            feedback.tsidMsgs.push(msg);
          } else if (errType === "err") {
            feedback.errCt++;
            feedback.errMsgs.push(msg);
          } else if (errType === "pos") {
            feedback.posMsgs.push(msg);
            feedback.posCt++;
          }
        } catch(err){
          console.log("logFeedback: " + err);
        }
      };

      /**
       * Verify the 4 bagit files are present, indicating a properly bagged LiPD file.
       *
       * @param {Object} files   List of files found in the LiPD archive.
       * @return None            Feedback is logged to the global scope
       */
      var verifyBagit = function (files) {
        try{
          // Bagit filenames are static. Check that each is present.
          var validBagitFiles = ["tagmanifest-md5.txt", "manifest-md5.txt", "bagit.txt", "bag-info.txt"];

          // Only run Verify Bagit when this is an uploaded file. NOT when it's being created from scratch
          // If create from scratch, it's not possible to have bagit files yet.
          if(pageMeta.fileUploaded){
            var count = 0;
            var errors = 0;
            // Loop for each required filename
            validBagitFiles.forEach(function (filename) {
              // Check if the required filename is in the uploaded files.
              if (files.hasOwnProperty(filename)) {
                // Yes, file present.
                count++;
              } else {
                // No, file is missing.
                errors++;
                logFeedback("warn", "Missing bagit file: " + filename, null);
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
       * @param {Object} D      Metadata
       * @return None
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
       * @param {Object} D  Metadata
       * @return None
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
       * @param {Object} D       Metadata
       * @param {Object} opts    Parameters that are needed depending on the mode being run (noaa v. wiki)
       * @param {Function} cb    Callback
       * @return None
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
       * Check multiple tables for required keys
       *
       * @param {Object} tables   Metadata
       * @param {String} crumbs   Crumbs for path so far
       * @param {Object} keys     Keys to look for
       * @param {String} mode     NOAA or Wiki mode
       * @return None
       */
      var requiredTablesNoaaWiki = function(tables, crumbs, keys, mode){
        try{
          // Loop over all the tables
          for (var _w = 0; _w < tables.length; _w++) {
            requiredTableNoaaWiki(tables[_w], crumbs + _w, keys, mode);
          }
        } catch(err){
          console.log("requiredTablesNoaaWiki: " + mode + ": " + crumbs + ": " + err);
        }
      };

      /**
       * Check one table for required NOAA or Wiki keys
       *
       * @param {Object} table     Metadata
       * @param {String} crumbs    Crumbs for path so far
       * @param {Object} keys      Keys to look for
       * @param {String} mode      NOAA or Wiki mode
       * @return None
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
       * Check one table for required keys
       *
       * @param  {Object} column   Metadata
       * @param  {String} crumbs   Crumbs for structure path so far (i.e. paleo1.measurement1.tableName)
       * @param  {String} mode     NOAA or Wiki mode
       * @param  {String} lvl      err or warn log level
       * @param  {Object} keys     Keys to look for
       * @return None
       */
      var requiredColumnNoaaWiki = function (column, crumbs, mode, lvl, keys){
        try{
          // Special handling for "inferredVariableType" and "proxyObservationType" fields. Only in Wiki mode.
          // This if statement is a bit of a band-aid because this is the best spot to put it, but it needed
          // qualifiers so it would only run once per column.
          if(mode === "Wiki" && lvl === "err"){

              // Special Fields: variableType and proxyObservationType / inferredVariableType
              if(column.hasOwnProperty("variableType")){
                  var _varType = column.variableType;

                  if(column.hasOwnProperty("inferredVariableType") && column.hasOwnProperty("proxyObservationType")){
                    if(!column.inferredVariableType && !column.proxyObservationType){
                        logFeedback("err", "(Wiki) Missing: " + crumbs + "proxyObservationType OR inferredVariableType", "proxyObservationType|inferredVariableType");
                    }
                  } else {
                      if(_varType === "measured" || _varType === "measuredVariable"){
                          if(!column.hasOwnProperty("proxyObservationType")){
                              logFeedback("err", "(Wiki) Missing: " + crumbs + "proxyObservationType", "proxyObservationType");
                          } else if (!column.proxyObservationType) {
                              logFeedback("err", "(Wiki) Missing: " + crumbs + "proxyObservationType", "proxyObservationType");
                          }
                      } else if(_varType === "inferred"){
                          if(!column.hasOwnProperty("inferredVariableType")){
                              logFeedback("err", "(Wiki) Missing: " + crumbs + "inferredVariableType", "inferredVariableType");
                          } else if(!column.inferredVariableType) {
                              logFeedback("err", "(Wiki) Missing: " + crumbs + "inferredVariableType", "inferredVariableType");
                          }
                      } else {
                          logFeedback("err", crumbs + ".variableType must be measured or inferred", "variableType");
                      }
                  }


              } else {
                  logFeedback("err", "Missing: " + crumbs + ".variableType", "variableType");
                  logFeedback("err", "Missing: " + crumbs + ".proxyObservationType OR inferredVariableType", "proxyObservationType|inferredVariableType");
              }
          }

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

      /**
       *
       * Use the error counts to determine if this data passes or fails the validation process
       *
       * @param  {Number}   count  Error count
       * @param  {Function} cb     Callback
       * @return            none
       * */
      var checkPassFail = function(count, cb){
        if(count === 0){
          cb("PASS");
        } else {
          cb("FAIL");
        }
      };

      // HELPERS

      /**
       * Calculate the completeness of the data in this LiPD dataset. The completeness is determined by
       * how much of the required data is provided
       *
       */
      var calculatePercentComplete = function(){
        // Total number of required items, both errors and positive counts
        var _totalitems = feedback.posCt + feedback.errCt + feedback.errCtWiki + feedback.errCtNoaa;
        feedback.lipdCompleteCt = _totalitems;
        // Total number of positive counts
        var _positiveitems = feedback.posCt;
        // Get the percentage of required items that are completed
        feedback.lipdComplete = Math.floor((_positiveitems / _totalitems)* 100);
        // Depending on the level of completion, set the success level and color of the completion bar.
        if (feedback.lipdComplete < 25) {
            feedback.lipdCompleteType = 'danger';
        } else if (feedback.lipdComplete < 75) {
            feedback.lipdCompleteType = 'warning';
        } else {
            feedback.lipdCompleteType = 'success';
        }
      };

      /**
       * Simplify the CSV filenames. Remove the dataset name, or other prefixes, from the filename.
       * i.e. Smith.paleo0measurement0.csv  becomes  paleo0measurement0.csv
       *
       * This helps prevent bad filenames when there are small dataset name differences.
       * i.e. "Smith_Lake" and "Smith.Lake" would end up as "Smith_LakeSmith.Lake.paleo0measurement0.csv"
       *
       * @param   {String} old_filename   Original filename found in the LiPD upload
       * @param   {String} new_filename   Standardized filename created with crumbs
       * @return  {String} new_filename   Standardized filename that is now being used
       */
      var reconcileCsvFilenames = function(old_filename, new_filename){
        if(files.csv.hasOwnProperty(old_filename)){
          if(new_filename !== old_filename){
              files.csv[new_filename] = files.csv[old_filename];
              delete files.csv[old_filename];
          }
        }
        return new_filename;
      };

      /**
       * Create a csv filename for a data table
       *
       * @param   {String}  crumbs   The path crumbs leading up to this table. This creates the filename we want.
       * @returns {string}           The filename built from crumbs. Returned so other functions know what filename we used.
       */
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

      /**
       * Check that geo coordinates are within the proper latitude and longitude ranges.
       *
       * @param   {Number}  start  The start of the coordinate range
       * @param   {Number}  end    The end of the coordinate range
       * @param   {Number}  val    Coordinate value to check
       * @returns {Boolean}        True if number in range, false if not.
       */
      var numberInRange = function (start, end, val) {
        return val >= start && val <= end
      };

      var fixDoi = function(pub){
        // doi keys to look for
        var _dois = ["DOI", "Doi"];
        // Loop over publication entries
        for(var _l = 0; _l <pub.length; _l++){
          // Does this publication have a DOI stored under 'identifier'?
          try{
            // Is there a DOI entry under identifier?
            if(pub[_l]["identifier"][0]["id"]){
                // Yes, reassign it to "doi"
                pub[_l]["doi"] = pub[_l]["identifier"][0]["id"];
            }
          }catch(err){
              //pass
          }
            // Does this publication have DOI in the right structure?
            for(var _u=0; _u<_dois.length; _u++){
                // Is the doi stored under the wrong key? Reassign it.
                if(pub[_l].hasOwnProperty(_dois[_u])){
                    if(pub[_l][_dois[_u]]){
                        pub[_l]["doi"] = pub[_l][_dois[_u]];
                    }
                    delete pub[_l][_dois[_u]];
                }
            }
          if(pub[_l].hasOwnProperty("identifier")){
              delete pub[_l]["identifier"];
          }
        }
        return pub;
      };

      /**
       * Online Resource structure changed in v1.3 to allow multiple entries to be added.
       * Formerly, onlineResource and onlineResourceDescription had single entry string values.
       * Now, onlineResourceDescription is removed, and onlineResource is an array with the possbility of multiple
       * entries. Each array entry will have the 'onlineResource', and 'description' to accompany it.
       *
       * @param   {Object}  j   LiPD Metadata
       * @returns {Object}  j   LiPD Metadata (with corrected onlineResource structure)
       */
      var fixOnlineResource = function(j){
        // Use the metadata to determine if onlineResource and onlineResourceDescription are strings. (old format)
        // If so, change them to an entry within an array (new format)
        if(j.hasOwnProperty("onlineResource")){
          if(!Array.isArray(j.onlineResource)){
            console.log("fixing onlineResource");
            // This onlineResource is not an array, so it must be a string. Make it an object within an array.
            j.onlineResource = [{"onlineResource": j.onlineResource}]

          }
        }
        if(j.hasOwnProperty("onlineResourceDescription")){
          if(j.onlineResource.length > 0){
              if(!j.onlineResource[0].hasOwnProperty("description")){
                console.log("fixing description");
                j.onlineResource[0]["description"] = j.onlineResourceDescription;
                delete j.onlineResourceDescription;
              }
          }
        }
        return j;
      };

      /**
       * The 'author' field in publication is often structured incorrectly. Either the field is stored as "authors"
       * (plural), the values are stored as a single string of many author names, or the values are stored as an array.
       *
       * Wrong: "Smith, K; Jones, D; Long, W;"
       * Wrong: ["Smith, K", "Jones, D", "Long, W"]
       * Correct: [{"name": "Smith, K"}, {"name": "Jones, D"}, {"name": "Long, W"}]
       *
       *
       * @param p
       * @returns {*}
       */
      var fixAuthor = function(p){
        try {
          // The output array. This will hold the correctly formatted author data
          var _d = [];

          // Loop through each publication entry
          for (var _u = 0; _u < p.length; _u++){
            // Does the 'authors' field exist? If so, correct it.
            if(p[_u].hasOwnProperty("authors")){
              // Create a new field called 'author' and give it the data that is found under 'authors'
              p[_u]['author'] = p[_u]['authors'];
              // Now delete 'authors'. It's the wrong field name.
              delete p[_u]['authors'];
            }
          } // end for loop authors key

          // Loop through each publication entry
          for (var _e = 0; _e < p.length; _e++){
            // Does the author field exist?
            if(p[_e].hasOwnProperty("author")){
              // If the data type is a string
              if (typeof(p[_e].author) === "string"){
                var _split = [];
                // If each author name is separated by "and", split the string.
                if (p[_e].author.indexOf("and") !== -1){
                  _split = p[_e].author.split(" and ");
                } // If each author name is separated by semicolon ;
                else if (p[_e].author.indexOf(";") !== -1){
                  _split = p[_e].author.split(";");
                }
                // For each author name that we parsed from the string, push it onto output array as an entry.
                for (var _a = 0; _a < _split.length; _a++){
                  _d.push({"name": _split[_a]});
                }
                // Set the new, correct array as the entry to the author field.
                p[_e].author = _d;
              } // end if author value is string

              // Author is an array of strings (one author name per entry)
              else if (Array.isArray(p[_e]['author'])){
                try{
                  // Loop over each author name, and check if the entry is a string.
                  if (p[_e]['author'][0] && typeof(p[_e]['author'][0])=== "string"){
                    for (var _c = 0; _c < p[_e].author.length; _c++){
                      _d.push({"name": p[_e].author[_c]});
                    }
                    p[_e].author = _d;
                  }
                } catch (err) {
                  console.log("validate: fixAuthor: " + err);
                }
              }
            } else {
              p[_e]["author"] = [{"name": ""}];
            } // end if pub had author entry
          } // end for loop author data type
        } catch(err){
          console.log("validate: fixAuthor: " + err);
        }
        return p;
      };

      /**
       *  Fix funding data that is formatted incorrectly. If it's formatted incorrectly, the user can access or edit
       *  the data on the page.
       *
       * @param  {*}      f     Funding data. Could be a string, an array of strings, array of objects, etc.
       * @return {Array}  _arr  Funding data correctly formatted as an array of objects.
       */
      var fixFunding = function(f){
          var _arr = [];
          // It's a string, put string into "grant" field
          if(typeof f === "string"){
            // Push the string onto our new array as the "grant" field of a new object
            _arr.push({"grant": f});
          }
          // It's an array of strings, put strings into "grant" field
          else if (Array.isArray(f)){
            // Loop for each item in array
              for(var _b = 0; _b < f.length; _b++){
                // Is this entry a string?
                  if(typeof f[_b] === "string"){
                    // Push the string onto our new array as the "grant" field of a new object
                    _arr.push({"grant": f[_b]});
                  } else {
                    _arr.push(f[_b]);
                  }
              }
          } else {
            // Don't need to do anything. This data appears to be correctly formatted.
              console.log("do nothing");
            _arr = f;
          }
          return _arr;
      };

      /**
       * Get the LiPD verson from the LiPD metadata. Why is the extra footwork necessary? Well, because there are
       * multiple ways that the "lipdVersion" string exists for some reason.
       *
       * @param   {Object}   D             LiPD Metadata
       * @returns {String}   _lipdVersion  The string representing the LiPD version number. Currently 1.0 to 1.3
       */
      var getLipdVersion = function(D){
        try{
          // Bool to determine if field is found or not.
          var _found = false;
          // Possible Keys. lipdVersion is the correct casing for this field.
          var _keys = ["lipdVersion", "LiPDVersion", "liPDVersion"];
          // Default version in case we don't find one.
          var _lipdVersion = "1.3";

          // Loop for each possbile casing of the lipdVersion key.
          for(var _i=0; _i<_keys.length; _i++){
            if(D.hasOwnProperty(_keys[_i])) {
              // Cast to float
              _lipdVersion = D[_keys[_i]].toString();
              // Remove the key in case it's one that's not the standard 'lipdVersion'
              delete D[_keys[_i]];
              // Note that we found the lipdVersion
              _found = true;
            }
          }
          // No LiPD version found. We'll assume it's version 1.3, but if that's wrong, the file may not load properly.
          if(!_found){
            logFeedback("warn", "LiPD Version unknown. Defaulting to v1.3. Results may be inaccurate", null);
          }
          // The given lipdVersion is not one of the allowed values. Neither in string or float form.
          if (["1.0", "1.1", "1.2", "1.3", 1.0, 1.1, 1.2, 1.3].indexOf(_lipdVersion) === -1){
            logFeedback("err", "Invalid LiPD Version: " + _lipdVersion, null);
          }
          return _lipdVersion;
        } catch(err){
          console.log("processData: getLipdVersion: " + err);
          return _lipdVersion;
        }
      };

      // HELPERS  - INFERRED DATA CALCULATIONS

      /**
       * Top level
       * Calculate inferred data for all the values in this dataset.
       *
       *  WORKFLOW
       *   1. Get Table data.  (IGNORE ENSEMBLES)
       *   2. Calculate Resolution (when applicable)
       *   2a. look for "age", "year", "yrbp" in column variable names. case - insensitive
       *   2b. if no age year or yrbp exact matches found, try to find a variable name match loosely. with word in it.
       *   2c. if you find some sort of age, calculate resolution
       *   3. Calculate inferred data
       *
       *
       *  RULES
       *   Remove all NaNs before calculating
       *   Do not make resolution calculations on age or year columns
       *   Do not make calculations on columns that have string values
       *   Resolution values are always positive. Absolute values.
       *   We want Mean, Median, Max, Min
       *
       * @param    {Object}  jsons  LiPD Metadata
       * @param    {Object}  csvs   Csv data, sorted by filename
       * @returns  {Object}  jsons  LiPD Metadata (with inferred data in each data table column)
       */
      var calculateInferredValues = function(jsons, csvs){

          // Work your way down the metadata levels and loop over all data tables.
          var _keys = ["paleoData", "chronData"];
          for(var _keyidx = 0; _keyidx <_keys.length; _keyidx++){
              // Get a paleo or chron key
              var _pc = _keys[_keyidx];
              if(jsons.hasOwnProperty(_pc)){
                  // Loop for each entry in paleoData/chronData
                  for(var _a = 0; _a < jsons[_pc].length; _a++){
                      if(jsons[_pc][_a].hasOwnProperty("measurementTable")){
                          // Loop for each measurement table
                          for(var _met = 0; _met < jsons[_pc][_a]["measurementTable"].length; _met++){
                              var _currTable = jsons[_pc][_a]["measurementTable"][_met];
                              // Down to a single table. Send that table forward to processing
                              jsons[_pc][_a].measurementTable[_met] = getInferredDataTable(_currTable, csvs, _pc);
                          }
                      }
                  }
              }
          }
          return jsons;
      };

      /**
       * Calculate the mean of a numeric array
       *
       * @param   {Array}   numbers  An array of numbers
       * @returns {Number}           The mean of the array of numbers
       */
      function mean(numbers) {
        // Find the mean of the given numeric array.
          var total = 0, i;
          for (i = 0; i < numbers.length; i += 1) {
              total += numbers[i];
          }
          return total / numbers.length;
      }

      /**
       * Calculate the median of a numeric array
       *
       * @param   {Array}   numbers  An array of numbers
       * @returns {Number}           The median of the array of numbers
       */
      function median(numbers) {
          // Find the median of the given numeric array.
          // median of [3, 5, 4, 4, 1, 1, 2, 3] = 3
          var median = 0, numsLen = numbers.length;
          numbers.sort();

          if (
              numsLen % 2 === 0 // is even
          ) {
              // average of two middle numbers
              median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
          } else { // is odd
              // middle number only
              median = numbers[(numsLen - 1) / 2];
          }

          return median;
      }

      /**
       * Parse all values from an array as floats. Often these numbers are strings, and we want them to be floats
       * for calculations later.
       *
       * @param    {Array}   numbers    An array of numbers
       * @returns  {Array}   _numbers2  An array of numbers (as floats)
       */
      var parseArrFloats = function(numbers){
        // Parse all the values in the given array as floats. If they're not numbers, they'll result as NaNs.
        var _numbers2 = [];
        try {
            for(var _u=0; _u<numbers.length; _u++){

                _numbers2.push(parseFloat(numbers[_u]));
            }
            return _numbers2;
        } catch(err){
          return _numbers2;
        }
      };

      /**
       * Remove old inferred data that may still be in the columns. We want to recalculate during each validation
       * in case any data changes or if the provided inferred data is incorrect.
       *
       * @param   {Object}  column  Column Metadata
       * @returns {Object}  column  Column Metadata (possibly without former inferred data)
       */
      var removeOldInferredData = function(column){
        // Remove inferred data from this column that might be using the old keys.
        var _rm_keys = ["mean", "median", "max", "min"];
        for(var _b=0; _b<_rm_keys.length;_b++){
          var _rm_key = _rm_keys[_b];
          if(column.hasOwnProperty(_rm_key)){
            delete column[_rm_key];
          }
        }
        return column;
      };

      /**
       * Check if this one row of data is only null or empty values. Sometimes this happens when value data is entered
       * and there are extra rows or columns of empty cells that never got used or removed.
       *
       * @param   {Array}    row   One row of numeric values from the data table values
       * @returns {Boolean}        True if row is all empty values, false if real values exist.
       */
      var rowOfNulls = function(row){
        var _count = 0;
        var _cur = "";
        // Loop for each value
        for(var _p=0; _p<row.length; _p++){
          _cur = row[_p];
          // Is it a null or empty value?
          if(_cur === null || _cur === "" || _cur === undefined){
            _count++;
          } else {
            // Value is good, that means that at least one entry is a real value and we can quit.
            return false;
          }
        }
        return true;
      };

      /**
       * Loop through each data table and each row of values to find and remove any empty rows. Sometimes this happens
       * when value data is entered and there are extra rows or columns of empty cells that never got used or removed.
       *
       * @param    {Object}   csv   All value data, sorted by filename
       * @returns  {Object}   csv   All value data, sorted by filename (without empty data rows)
       */
      var removeEmptyValueRows = function(csv){
        // Loop over all our value data rows and remove any rows that are empty data placeholders.
        for(var _filename in csv){
          if(csv.hasOwnProperty(_filename)){
            if(csv[_filename].hasOwnProperty("data")){
              // Start at the end of the values arrays and work backwards. Null rows are at the bottom.
              for(var _i=csv[_filename].data.length-1; _i>0; _i--){
                // Is this a null row?
                if(rowOfNulls(csv[_filename].data[_i])){
                  csv[_filename].data.pop();
                }
              }
            }
            // Transpose each data table because we need this data current for NOAA file conversions.
            csv[_filename].transposed = misc.transpose(csv[_filename].data);
          }
        }
        // Return the corrected value data
        return csv;
      };

      /**
       *  Inferred data main
       *
       *  Use the data table values to calculate inferred data for each column. Where necessary, calculate resolution
       *  as well.
       *
       * @param   {Object}   table  Table metadata
       * @param   {Object}   csvs   All value data, sorted by filename
       * @param   {String}   pc     paleo or chron string to indicate how to process this table
       * @returns {Object}   table  Table metadata (with inferred data)
       */
      var getInferredDataTable = function(table, csvs, pc) {
          // Placeholder for age data.
          var _age = {"variableName": null, "values": null};
          // Get the values for the table columns from the csv data.

          if(typeof csvs[table.filename] !== "undefined"){
              var _values = csvs[table.filename].transposed.slice();

              // We need columns and a filename to continue working. If they don't exist, we can't continue.
              if (table.hasOwnProperty("columns") && table.hasOwnProperty("filename")) {

                  // DO NOT calculate inferred data on ensemble tables. It'll wreak havoc and probably crash the site.
                  if(table.filename.indexOf("ensemble") === -1){
                      // Only calculate resolution for paleoData tables.
                      if (pc === "paleoData") {
                          // Get the age values data first, since it's needed to calculate the other column data.
                          _age = getAgeColumn(table, _values);
                      }
                      // Calculate resolution & inferred data. Only paleoData is possible here.
                      if (_age.values) {
                          table = calculateResolution(table, _values, _age);
                      }
                      // Calculate inferred data without resolution. No age data present, or this is chronData.
                      table = calculateInferredColumn(table, _values);
                  }
              }
              // Table does not have columns and/or a filename
              else {
                  console.log("Table missing columns or filename:" + table.tableName);
              }
          }
          return table;
      };

      /**
       * Inferred data at table / column level
       *
       * Use the specific table and table values given to loop over each column and calculate the inferred data.
       *
       * @param   {Object}   table    Table metadata
       * @param   {Object}   _values  The table values that go with this table metadata.
       * @returns {Object}   table    Table metadata (with inferred data)
       */
      var calculateInferredColumn = function(table, _values){
          // Loop over all columns in the table.
          for(var _i=0; _i<table.columns.length; _i++){

                  // Grab the values for this column.
                  var _current_values = parseArrFloats(_values[_i]);
                  try{
                      // Return an array that shows where all the non-NaN values are in the _values array.
                      var _cleanValues = _current_values.filter(function(number) {
                          if (!isNaN(number) && number !== null)
                              return parseFloat(number);
                      });
                      // Only continue if the array has numeric values.
                      if(_cleanValues.length > 0){
                          // Place all calculations directly in the column.
                          table.columns[_i]["hasMean"] = mean(_cleanValues);
                          table.columns[_i]["hasMedian"] = median(_cleanValues);
                          table.columns[_i]["hasMax"] = Math.max(..._cleanValues);
                          table.columns[_i]["hasMin"] = Math.min(..._cleanValues);
                          // Remove the old inferred data keys if they exist.
                          table.columns[_i] = removeOldInferredData(table.columns[_i]);

                      } else {
                          // console.log("Error calculateInferredColumn: No array values. No inferred data.");
                      }
                  } catch(err){
                      console.log("Error calculateInferredColumn: main: ", err);
                  }
          }
          // Return the table with inferred data
          return table;

      };

      /**
       * Calculate the resolution when:
       *
       * 1. There is age data
       * 2. It's a paleoData table
       *
       * Loop over each column that is NOT the age column, and calculate the resolution.
       *
       * @param    {Object}  table     Table metadata
       * @param    {Object}  _values   The table values that go with this table metadata.
       * @param    {Object}  age       Contains age variableName and age values data
       * @returns  {Object}  table     Table metadata (with resolution)
       */
      var calculateResolution = function(table, _values, age){
        // Loop over all columns in the table.
        for(var _i=0; _i<table.columns.length; _i++){
          // Get the variableName for this column.
          var _name = table.columns[_i].variableName;
          // Is this the age column? Skip. Is this not the age column? Keep going.
          if(_name !== age['variableName']){
            // Grab the values for this column.
            var _current_values = _values[_i];
            try{
                var _isNotNaN = 0;
                // Return an array that shows where all the non-NaN values are in the _values array.
                if(typeof _current_values !== "undefined"){
                    _isNotNaN = _current_values.reduce(function(a, e, i) {
                        if (!isNaN(e))
                            a.push(i);
                        return a;
                    }, []);
                }
                // Only continue if the array has numeric values.
                if(_isNotNaN.length > 0){
                    // Create an array where we'll store the
                    var _age2 = [];
                    // Loop over the good non-NaN indicies that we found.
                    for(var _p=0; _p<_isNotNaN.length; _p++){
                        try{
                            // Use the non-NaN indicies from the _values array, to grab indices from the age array.
                            var _idx = _isNotNaN[_p];
                            // Push the age value from N index onto our _age2 array, which is what we'll use to calculate resolution.
                            _age2.push(age['values'][_idx]);
                        } catch(err){
                            // In a perfect world, both the age and values array should be the same length.
                            // But catch the error just in case. Who knows.
                            console.log("Error calculateResolution: creating age2: ", err);
                        }
                    }
                    // Calculate the resolution. This is the diff of the _age2 array.
                    var _resolution = [];
                    // Loop until n-1, since our resulting array will be 1 length less than the original.
                    for(var _n=0;_n<_age2.length-1;_n++){
                        var _upper = parseFloat(_age2[_n+1]);
                        var _lower = parseFloat(_age2[_n]);
                        var _val = Math.abs(_upper-_lower);
                        if(_val !== null && _val !== "undefined" && !isNaN(_val)){
                          _resolution.push(Math.abs(_upper-_lower));
                        }
                    }
                    // Now that we have an array of resolution values, calculate the mean-median-max-min.
                    var _mmmm = {
                      "hasMean": mean(_resolution),
                      "hasMedian": median(_resolution),
                      "hasMax": Math.max(..._resolution),
                      "hasMin": Math.min(..._resolution)
                    };
                    // Place the mmmm data into the column
                    table.columns[_i]["hasResolution"] = _mmmm;
                } else {
                  // console.log("calculateResolution: No array values. No resolution.");
                }
            } catch(err){
              console.log("Error: calculateResolution: main: ", err);
            }
          }
        }
        // Return the table data with resolution data added
        return table;
      };

      /**
       * Attempt to find an age column. There is not currently a controlled vocabulary, so check different key names and
       * different casings. If you find one, return the variableName and values.
       *
       * @param    {Object}   table   Table metadata
       * @param    {Object}   values  The table values that go with this table metadata.
       * @returns  {Object}   _age    Values and variableName of the age column, if found. Null if not.
       */
      var getAgeColumn = function(table, values){
        var _age = {"variableName": null, "values": null};
        var _target_keys = ["year", "yrbp", "bp", "age"];

        // Look for an exact key match (key === variableName)
        for(var _m=0; _m<table.columns.length; _m++){
          for(var _k=0; _k<_target_keys.length; _k++){
              var _key = _target_keys[_k];
              if(table.columns[_m].hasOwnProperty("variableName")){
                  if(table.columns[_m].variableName === _key){
                      _age.variableName = table.columns[_m].variableName;
                      _age.values = values[_m];
                      break
                  }
              }
          }
        }

        // No exact matches found. Look for a loose match (key %in% variableName)
        if(!_age.values){
            for(var _m2=0; _m2<table.columns.length; _m2++){
                for(var _k2=0; _k2<_target_keys.length; _k2++){
                    var _key2 = _target_keys[_k2];
                    if(table.columns[_m2].hasOwnProperty("variableName")){
                        if(table.columns[_m2].variableName.indexOf(_key2) !== -1){
                            _age.variableName = table.columns[_m2].variableName;
                            _age.values = values[_m2];
                            break
                        }
                    }
                }
            }
        }
        return _age;
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
