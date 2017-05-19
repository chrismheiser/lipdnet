// Validator - Client-side angular

var lipdValidator = (function(){
  // 'use strict';
  return {

    // Generate a TSid. An alphanumeric unique ID. Prefix + 8 chars.
    generateTSid: (function(){
      var _tsid = "";
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }

      // Create TSID.
      // VAL prefix for tracability back to validator
      // 8 alphanumeric characters to match TSid standard format.
      _tsid = "WEB" + s4() + s4();
      console.log("misc: Generated TSid: " + _tsid);
      return _tsid;
    }),

    // Sort data by file type, filename, and gather other metdata
    sortBeforeValidate: (function (objs, cb) {
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
            console.log("processing: " + obj.filenameShort);
            if (obj.type === "json") {
              files.dataSetName = obj.filenameFull.split("/")[0];
              files.lipdFilename = obj.filenameFull.split("/")[0] + ".lpd";
              files.json = obj.data;
            } else if (obj.type === "csv") {
              files.csv[obj.filenameShort] = obj.data;
            } else if (obj.type === "bagit") {
              files.bagit[obj.filenameShort] = obj;
            } else {
              console.log("sortBeforeValidate: Unknown file: " + obj.filenameFull);
            }
          });
          cb(files);
        }catch(e){
          console.log("Error: sortBeforeValidate: " + e);
          // console.log(cb);
        }
        return;
    }),
    // end sortBeforeValidate


    populateTSids: (function(_files, cb){
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
        return files;
      };

      // Revalidate to remove TSid errors
      // console.log(_files);
      cb(populateTSids1(_files));
    }),

    // LiPD Validation: Check data for required fields, proper structure, and proper data types.
    // Attempt to fix invalid data, and return data with and feedback (errors and warnings)
    // validate_main: (function(files){
    validate: (function(files, options, cb){

        // console.log("validate: Begin Validation");
        // console.log(files);
        // VALIDATOR EVENTS
        // receive json data (sorted or not sorted? use splitValidate if necessary)
        // run through validate function
        // return back the JSON, feedback data, and boolean for PASS/FAIL

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
          "status": "NA"
        };

        // Keys: keys that are required for different sections
        var keys = {
          "advKeys": ["@context", "tsid", "number", "google", "md5", "lipdversion", "investigators"],
          "lowKeys": [],
          "miscKeys": ["studyname", "proxy", "metadatamd5", "googlespreadsheetkey", "googlemetadataworksheet",
                  "@context", "tagmd5", "datasetname", "description","wdcpaleourl", "maxyear",
                  "minyear", "originaldataurl", "hasminvalue", "hasmaxvalue", "hasmedianvalue", "hasmeanvalue",
                  "hasresolution", "datacontributor", "collectionname", "googledataurl"],
          "reqRootKeys": ["archiveType", "dataSetName", "paleoData", "geo"],
          "reqPubKeys": ["author", "title", "year", "journal"],
          "reqPubDcKeys": ["author", "title"],
          "reqColumnKeys": ["number", "variableName", "TSid", "units"],
          "reqTableKeys": ["filename", "columns", "missingValue"],
          "reqGeoKeys": ["coordinates"]
        };


        // VALIDATE
        var validate = function () {
          // console.log("validate");
          console.log("validate: Structure");
          verifyStructure(files.json);
          console.log("validate: Required Fields");
          verifyRequiredFields(files.json);
          console.log("validate: Bagit");
          verifyBagit(files.bagit);
          verifyValid(feedback);
          console.log("validate: Status: " + feedback.status);
          // var jsonCopy = JSON.parse(JSON.stringify(files.json));
          // console.log("validate: Complete");
          console.log(files.json);
          return {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.status};
        };

        // VERIFY STRUCTURE
        // master fucntion. call all subroutines to determine if this is a valid lipd structure
        var verifyStructure = function (m) {
          // check that data fields are holding the correct value data types
          for (var k in m) {
            try {
              var correctType = null;
              lowKey = k.toLowerCase();
              v = m[k];
              keys.lowKeys.push(lowKey);
              if (lowKey === "archivetype") {
                correctType = verifyDataType("string", k, v, true);
              } else if (lowKey === "lipdversion") {
                // Valid LiPD versions: 1.0, 1.1, 1.2
                // check that the value is a number
                v = parseInt(v);
                correctType = verifyDataType("number", k, v, true);
                if (correctType) {
                  if ([1.0, 1.1, 1.2].indexOf(v) == -1) {
                    // LiPD version wasn't valid. Log errors to scope.
                    logFeedback("err", "Invalid LiPD Version: Valid versions are 1.0, 1.1, and 1.2", "lipdVersion");
                  } // end if in
                } // end data type check
              } else if (lowKey === "pub") {
                // pub must follow BibJSON standards
                var _pubPassed = verifyArrObjs(k, v, true);
                if (_pubPassed){
                  verifyBibJson(v);
                }
              } else if (lowKey === "investigators" || lowKey === "investigator") {
                verifyDataType("any", k, v, true);
              } else if (lowKey === "funding") {
                verifyArrObjs(k, v, true);
              } else if (lowKey === "geo") {
                // geo must follow GeoJSON standards
                verifyDataType("object", k, v, true);
              } else if (lowKey == "chrondata") {
                verifyPaleoChron("chron", k, v);
              } else if (lowKey === "paleodata") {
                verifyPaleoChron("paleo", k, v);
              } else {
                // TODO: No rules for these keys. Log warning, but allow data.
                if (keys.miscKeys.indexOf(lowKey) === -1) {
                  logFeedback("warn", "No rules found for key: " + k, k);
                  console.log("verifyStructure: No rules for key: " + k);
                }
              }
            } catch (err) {
              console.log("verifyStructure: Caught error parsing: " + k);
            }
          }
        };

        var verifyBibJson = function(v){
          try {
            // these keys muust be an array of objects
            var _arrs = ["author", "identifier", "editor", "license", "link"];
            // this key must be an object
            var _objs = ["journal"];
            var _crumbs = "";
            var _idx = 0;
            // in case author is formatted wrong, convert it to BibJson format
            v = fixAuthor(v);
            for (var _p = 0; _p < v.length; _p++){
              var _pub = v[_p];
              // loop for each item in this pub
              for(var _key in _pub){
                _idx = _p + 1;
                _crumbs = "publication" + _idx + "." + _key;
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
                  logFeedback("warn", "Valid structure, empty data: " + k);
                }
              } // end if
              else if (_typeof(v) != dt) {
                if(addToLog){
                  logFeedback("err", "Invalid data type: " + k + "\n  Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
                }
                return false;
              }
            } // end else
          } catch (err) {
            // caught some other unknown error
            console.log("verifyDataType: Caught error parsing. Expected: " + cdt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)));
          } // end catch
          return true;
        };

        // Check for an Array with objects in it.
        var verifyArrObjs = function (k, v, addToLog) {
          isArr = verifyDataType("array", k, v, addToLog);
          if (isArr) {
            isObjs = verifyDataType("object", k, v[0], addToLog);
            // this array is only valid if it contains objects or if it's an empty array.
            if (isObjs || !v[0]) {
              return true;
            }
          }
          console.log("verifyArrObjs: Invalid data type: expected: obj, given: " + _typeof(v[0]) + ": " + k);
          return false;
        };

        // Verify Data types in Paleo/Chron data.
        var verifyPaleoChron = function (pdData, k, v) {

          // value is an array
          if (!Array.isArray(v)) {
            logFeedback("err", "Invalid data type: " + k + ". Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
          } else if (Array.isArray(v) && v.length > 0) {
            // check if the root paleoData or chronData is an array with objects.
            var correctTop = verifyArrObjs(k, v, true);

            if (correctTop) {
              // create table names based on what "mode" we're in. chron or paleo
              var meas = pdData + "MeasurementTable";
              var mod = pdData + "Model";
              // check if measurement table exists
              if (v[0].hasOwnProperty(meas)) {
                // check if measurement table is array with objects
                // console.log("meas: ", v);
                verifyArrObjs(meas, v[0][meas], true);
              } // end measurement table
              // check if model table exists
              if (v[0].hasOwnProperty(mod)) {
                // check if model table is array with objects
                var correctBottom = verifyArrObjs(mod, v[0][mod]);
                var modTables = ["summaryTable", "distributionTable", "method", "ensembleTable"];
                if (correctBottom) {
                  // correct so far, so check if items in model table [0] are correct types
                  for (i = 0; i < modTables.length; i++) {
                    table = modTables[i];
                    if (v[0][mod][0].hasOwnProperty(table)) {
                      if (table === "distributionTable") {
                        verifyArrObjs(table, v[0][mod][0][table], true);
                      } else {
                        verifyDataType("object", table, v[0][mod][0][table], true);
                      }
                    } // if has property
                  } // end model table inner
                } // end correctBottom
              } // end has model table
            } // end correctTop
          } // end else
        }; // end verify


        // REQUIRED DATA
        // master for checking for required fields. call sub-routines.
        var verifyRequiredFields = function (m) {
          // call sub-routine checks
          requiredRoot(m);
          requiredPub(m);
          requiredPaleoChron("paleo", m);
          requiredPaleoChron("chron", m);
        };

        // verify required fields at all levels of paleoData & chronData
        var requiredPaleoChron = function (pc, m) {

          // I'll use "paleoData" in comments, but this function applies to paleoData and chronData
          var pdData = pc + "Data";
          var meas = pc + "MeasurementTable";
          var mod = pc + "Model";
          var crumbs = "";
          try{
            // paleoData not found
            if (!m.hasOwnProperty(pdData)) {
              if (pc === "paleo") {
                logFeedback("err", "Missing data: " + pdData + "0measurement0", pdData);
              }
            }
            // paleoData found
            else {
                // paleo data is empty
                if (pc === "paleo" && !m[pdData]) {
                  logFeedback("err", "Missing data: " + meas, meas);
                } else {
                  // for each object in the paleoData list
                  for (var i = 0; i < m[pdData].length; i++) {
                    // hold table in variable.
                    var table = m[pdData][i];

                    // measurementTable found
                    if (table.hasOwnProperty(meas)) {
                      if (table[meas].length === 0){
                        logFeedback("err", "Missing data: " + meas, meas);
                      } else {
                        for (var _w = 0; _w < table[meas].length; _w++) {
                          // hold current meas table object in a variable
                          var measObj = table[meas][_w];
                          crumbs = pc + i + "measurement" + _w;
                          requiredTable(measObj, crumbs);
                        }
                      }
                    } // end meas

                    // paleoMeasurementTable not found, and it's required
                    else if (!table.hasOwnProperty(meas) && pc == "paleo") {
                        // log error for missing required table
                        crumbs = pc + "0measurement0";
                        logFeedback("err", "Missing data: " + crumbs, meas);
                      }

                    // paleoModel found
                    if (table.hasOwnProperty(mod)) {
                      for (var k = 0; k < table[mod].length; k++) {
                        var modObj = table[mod][k];
                        // found summary table
                        if (modObj.hasOwnProperty("summaryTable")) {
                          crumbs = pc + i + "model" + k + "summary";
                          requiredTable(modObj.summaryTable, crumbs);
                        }
                        // found ensemble table
                        if (modObj.hasOwnProperty("ensembleTable")) {
                          crumbs = pc + i + "model" + k + "ensemble";
                          requiredTable(modObj.ensembleTable, crumbs);
                        }
                        // found distribution table
                        if (modObj.hasOwnProperty("distributionTable")) {
                          for (var j = 0; j < modObj.distributionTable.length; j++) {
                            var distObj = modObj.distributionTable[j];
                            crumbs = pc + i + "model" + k + "distribution" + j;
                            requiredTable(distObj, crumbs);
                          } // end for
                        } // end dist
                      } // end model loop
                    } // end if model
                  } // end paleoData object loop
                } // end else
              } // end else
          } catch(err){
            console.log("validator: requiredPaleoChron: " + err);
          }

        }; // end requiredPaleoChron fn

        // each table must have "filename" and "missingValue"
        // each column must have "number", "tsid", and "variableName"
        var requiredTable = function (t, crumbs) {
          // look for table filename
          var filename = t.filename;
          var missingValue = t.missingValue;
          var _pcTableName = "paleoDataTableName";
          // add in the table name requirement based on table type
          if (crumbs.indexOf("chron") !== -1){
            _pcTableName = "chronDataTableName";
          }

          try {
            // check for table name key
            if (!t.hasOwnProperty(_pcTableName) || !t[_pcTableName]){
              logFeedback("err", "Missing data: " + crumbs + "." + _pcTableName, _pcTableName);
            }

            if(!t.hasOwnProperty("columns") || t.columns.length === 0){
              logFeedback("err", "Missing data: " + crumbs + ".columns", "columns");
            }
            // columns found
            else if (t.hasOwnProperty("columns")) {
              if (filename) {
                requiredColumnsCtMatch(filename, t.columns);
              }
              // loop over each column in the table
              // console.log(t.columns);
              for (var i = 0; i < t.columns.length; i++) {
                // loop over each of the required column keys
                for (var k in keys.reqColumnKeys) {
                  currKey = keys.reqColumnKeys[k];
                  // see if this column has each of the required keys
                  if (!t.columns[i].hasOwnProperty(currKey) || !t.columns[i][currKey]) {
                    // required key is missing, log error
                    logFeedback("err", "Missing data: " + crumbs + ".column" + i + "." + currKey, currKey);
                  }
                } // end table keys
              } // end columns loop
            } // end 'if columns exist'

            // loop over each column in the table
            for (var _w = 0; _w < keys.reqTableKeys.length; _w++) {
              // loop over each of the required column keys
              currKey = keys.reqTableKeys[_w];
              // see if this column has each of the required keys
              if (!t.hasOwnProperty(currKey) || !t[currKey]) {
                // required key is missing, log error
                logFeedback("err", "Missing data: " + crumbs + "." + currKey, currKey);
              }
            } // end columns loop


          } catch(err){
            console.log("validator: requiredTable: " + err);
          }

        }; // end requiredTable fn

        // check that column count in a table match the column count in the CSV data
        var requiredColumnsCtMatch = function (filename, columns) {
          var csvCt = 0;
          console.log("columns");
          console.log(columns);
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
              console.log("one column");
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
                console.log("two columns");
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

        // verify required keys in metadata root level
        var requiredRoot = function (m) {
          try {
            // console.log(m);
            // loop through and check for required fields. (lipdVersion, archiveType, paleoMeasurementTable..what else???)
            for (var i = 0; i < keys.reqRootKeys.length; i++) {
              // Current key
              var key = keys.reqRootKeys[i];
              // console.log("current key: " + key);
              if (key === "geo") {
                // Geo found. Check for valid data.
                if (m.hasOwnProperty(key)) {
                  requiredGeo(m);
                }
                // Geo not found. Coordinates are definitely missing, which triggers an error.
                else {
                  logFeedback("err", "Missing data: " + "coordinates", "coordinates");
                }
              } else if (!m.hasOwnProperty(key) || !m[key]) {
                // All other required root keys
                // key not found! log the error
                logFeedback("err", "Missing data: " + key, key);
              }
            } // end for
          } catch(err){
            console.log("validator: requiredRoot: " + err);
          }

        }; // end requiredRoot fn

        // pub is not mandatory, but if pub is present, then it must have the required keys
        var requiredPub = function (m) {
          try {
            // pub not found, log a warning.
            if (!m.hasOwnProperty("pub") || !m.pub) {
              logFeedback("warn", "No publication data", "pub");
            }
            // pub found, make sure it has the required keys
            else {
              // for each pub in the pub list
              for (var i = 0; i < m.pub.length; i++) {
                var curPub = m.pub[i];
                var _idx = i+1;
                // special case: year and journal not required if this publication is a dataCitation
                if(m.pub[i].hasOwnProperty("type")){
                  // type is a dataCitation, use the a different set of required keys
                  if (m.pub[i].type === "dataCitation"){
                    // loop over required keys, and see if this pub has the key
                    requiredPubLoop(m, i, keys.reqPubDcKeys);
                  } // if dataCitation
                  else{
                    // type is NOT a dataCitation, use the normal set of required keys
                    requiredPubLoop(m, i, keys.reqPubKeys);
                  }
                } // if has type property
                // publication does not have a "type" field. assume it's not a dataCitation
                else{
                  requiredPubLoop(m, i, keys.reqPubKeys);
                } // end else
              } // end for publication
            } // end if else
          } catch (err) {
            console.log("validator: requiredPub: " + err);
            logFeedback("warn", "Encountered problem validating: pub");
          }
        };

        var requiredPubLoop = function(m, i, pubKeys){
          try{
            for (var k = 0; k < keys.reqPubKeys.length; k++) {
              var key = keys.reqPubKeys[k];
              if (!m.pub[i].hasOwnProperty(key)) {
                // this pub is missing a required key!
                logFeedback("err", "Missing data: " + "publication" + _idx + "." + key, key);
              } else if (!m.pub[i][key]){
                logFeedback("err", "Missing data: " + "publication" + _idx + "." + key, key);
              }
            }
          } catch(err) {
            console.log("requiredPubLoop: " + err);
          }
          return;
        };

        // checks if there is coordinate information needed to plot a map of the location
        var requiredGeo = function (m) {
          try {
            coords = m.geo.geometry.coordinates.length;
            // start building map marker(s)
            if (coords == 2 || coords == 3) {
              // get coordinate values
              // GEOJSON specifies [ LONGITUDE , LATITUDE, ELEVATION (optional)]
              lon = m.geo.geometry.coordinates[0];
              lat = m.geo.geometry.coordinates[1];
              // check if values are in range
              lonValid = numberInRange(-180, 180, lon);
              latValid = numberInRange(-90, 90, lat);

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


        //  HELPERS

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
          if (val >= start && val <= end) {
            return true;
          }
          return false;
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

        // Error log: Tally the error counts, and log messages to user
        var logFeedback = function (errType, msg, key) {
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
            // var validBagitFiles = ["manifest-md5.txt", "bagit.txt", "bag-info.txt"];
            var count = 0;
            var errors = 0;
            validBagitFiles.forEach(function (filename) {
              if (files.hasOwnProperty(filename)) {
                count++;
              } else {
                //
                errors++;
                logFeedback("err", "Missing bagit file: " + filename);
              }
            });
            // if all 4 bagit files are found, display valid bagit message
            // if (count === 4) {
            //   logFeedback("pos", "Valid Bagit File", "bagit");
            //   feedback.validBagit = true;
            // }
            // TEMPORARY: Only check for 3 bagit files to be valid, since online bagit doesn't include one file.
            if (count === 3) {
              logFeedback("pos", "Valid Bagit File", "bagit");
              feedback.validBagit = true;
            }
          }
        };

        // Check for Valid LiPD data. If no errors, then it's valid.
        var verifyValid = function () {
            if (feedback.missingTsidCt > 1) {
              // Count all TSid errors as one culmulative error
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
        // try{
          cb(validate());
        // } catch(err){
        //   console.log("validate: err: " + err);
        // }
        return;
        // return validate(files);

    }) // end validate


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
