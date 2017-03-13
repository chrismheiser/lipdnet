// EXTERNAL
// Everything in validate_ext and validate_int is the exact same code.
// The only exception is the internal code has "module.exports = lipdValidation;" and external does not.
// Internal = backend nodeJs
// External = front end angular

var lipdValidator = (function(){
  // 'use strict';
  return {

    test:(function(strings){
      console.log("it worked");
    }),

    // Sort data by file type, filename, and gather other metdata
    sortBeforeValidate: (function (objs) {
        console.log("sortBeforeValidate");
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
        // loop over each csv/jsonld object. sort them into the scope by file type
        angular.forEach(objs, function (obj) {
          if (obj.type === "json") {
            files.dataSetName = obj.filenameFull.split("/")[0];
            files.lipdFilename = obj.filenameFull.split("/")[0] + ".lpd";
            files.json = obj.data;
          } else if (obj.type === "csv") {
            files.csv[obj.filenameShort] = obj.data;
          } else if (obj.type === "bagit") {
            files.bagit[obj.filenameShort] = obj;
          } else {
            console.log("Not sure what to do with this file: " + obj.filenameFull);
          }
        });
        return(files);
    }),
    // end sortBeforeValidate

    // LiPD Validation: Check data for required fields, proper structure, and proper data types.
    // Attempt to fix invalid data, and return data with and feedback (errors and warnings)
    validate: (function(files){

      console.log("In validate");
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
          "reqPubKeys": ["authors", "title", "year", "journal"],
          "reqTableKeys": ["number", "variableName", "TSid"],
          "reqGeoKeys": ["coordinates"]
        };

        // END GLOBALS

        // Generate a TSid. An alphanumeric unique ID.
        var generateTSid = function(){
          var _tsid = "";
          function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
          }

          // Create TSID.
          // VAL prefix for tracability back to validator
          // 8 alphanumeric characters to match TSid standard format.
          _tsid = "VAL" + s4() + s4();
          return _tsid;
        };

        // PopulateTSid: Columns
        // Check all columns in a table with TSid's where necessary
        var populateTSids3 = function(table){
          // Safe check. Make sure table has "columns"
          if (table.hasOwnProperty("columns")) {
            // Loop over all columns in the table
            for (var _i2 = 0; _i2 < table.columns.length; _i2++) {
              var col = table.columns._i2;
              // Check for TSid key in column
              if(!col.hasOwnProperty("TSid")){
                // populate if doesn't exist.
                var _tsid = generateTSid();
                table.columns._i2.TSid =  _tsid;
              }
            }
          }
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
            for (var _k2 = 0; _k2 < d.pcData.length; _k2++) {
              // Is there a measurement table?
              if (d.pcData._k2.hasOwnProperty(meas)) {
                var table = d.pcData._k2.meas;
                // Loop for all meas tables
                for (var _j = 0; _j < table.length; _j++) {
                  // Process table entry
                  d.pcData._k2.meas._j = populateTSids3(table._j);
                }
              }
              // Is there a model table?
              if (d.pcData._k2.hasOwnProperty(mod)) {
                var table = d.pcData._k2.mod;
                // Loop for each paleoModel table
                for (var _j2 = 0; _j2 < table.length; _j2++) {
                  // Is there a summaryTable?
                  if (d.pcData._k2.mod._j2.hasOwnProperty("summaryTable")) {
                    // Process table
                    d[pcData][_k2][mod][_j2]["summaryTable"] = populateTSids3(table[_j2]["summaryTable"]);
                  } // end summary
                  // Is there a ensembleTable?
                  if (table._j2.hasOwnProperty("ensembleTable")) {
                    // Process table
                    d[pcData][_k2][mod][_j2]["ensembleTable"] = populateTSids3(table[_j2]["ensembleTable"]);
                  } // end ensemble
                  // Is there a distributionTable?
                  if (table[_j2].hasOwnProperty("distributionTable")) {
                    table2 = table[_j2]["distributionTable"];
                    // Loop for all dist tables
                    for (var p = 0; p < table[_j2]["distributionTable"].length; p++) {
                      // Process table
                      d[pcData][_k2][mod][_j2]["distributionTable"][p] = populateTSids3(table2.p);
                    }
                  } // end dist
                } // end model loop
              } // end model
            } // end paleoData loop
          } // end if hasOwnProperty
          return d;
        };

        // PopulateTSid: Paleo/Chron
        // Loop for each paleo/chron entry
        var populateTSids1 = function(files){
          // using files.json
          // run once for paleoData and chronData
          pc = ["paleo", "chron"];
          for (var _i4 = 0; _i4 < pc.length; _i4++) {
            var _pc1 = pc._i4;
            var _pc2 = pc._i4 + "Data";
            // If paleoData found, continue.
            if(files.json.hasOwnProperty(_pc2)){
              // Process the paleoData, and replace the data in the json
              files.json = populateTSids2(files.json, _pc1);
            }
          }
          // Revalidate to remove TSid errors
          validate();
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

        // Validate: Triggered during file upload, and with "Validate" button click.
        var validate = function () {
          console.log("validating");
          console.log("verifyStructure");
          verifyStructure(files.json);
          console.log("verifyRequiredFields");
          verifyRequiredFields(files.json);
          console.log("verifyBagit");
          verifyBagit(files.bagit);
          console.log("verifyValid");
          verifyValid(feedback);
          var jsonCopy = JSON.parse(JSON.stringify(files.json));
          console.log("Finished Validate");
          return {"dat": files.json, "feedback": feedback, "filename": files.lipdFilename, "status": feedback.status};
        };

        // Helper: Check that geo coordinates are within the proper latitude and longitude ranges.
        var numberInRange = function (start, end, val) {
          if (val >= start && val <= end) {
            return true;
          }
          return false;
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
                correctType = verifyDataType("string", k, v);
              } else if (lowKey === "lipdversion") {
                // Valid LiPD versions: 1.0, 1.1, 1.2
                // check that the value is a number
                v = parseInt(v);
                correctType = verifyDataType("number", k, v);
                if (correctType) {
                  if ([1.0, 1.1, 1.2].indexOf(v) == -1) {
                    // LiPD version wasn't valid. Log errors to scope.
                    logFeedback("err", "Invalid LiPD Version: Valid versions are 1.0, 1.1, and 1.2", "lipdVersion");
                  } // end if in
                } // end data type check
              } else if (lowKey === "pub") {
                // pub must follow BibJSON standards
                verifyArrObjs(k, v);
              } else if (lowKey === "investigators" || lowKey === "investigator") {
                verifyDataType("any", k, v);
              } else if (lowKey === "funding") {
                verifyArrObjs(k, v);
              } else if (lowKey === "geo") {
                // geo must follow GeoJSON standards
                verifyDataType("object", k, v);
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

        // TODO: Do I need to verify these for structure????
        // if pub section exists, make sure it matches the bib json standard
        // if geo section exists, make sure it matches the geo json standard

        // check if the data type for a given key matches what we expect for that key
        var verifyDataType = function (dt, k, v) {
          try {
            // special case: check for object array.
            if (dt === "array") {
              if (!Array.isArray(v)) {
                logFeedback("err", "Invalid data type: " + k + ".\n- Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
                return false;
              }
            } else if (dt === "any"){
              return true;
            } else {
              // expecting specified data type, but didn't get it.
              if ((typeof v === 'undefined' ? 'undefined' : _typeof(v)) != dt) {
                logFeedback("err", "Invalid data type: " + k + ".\n- Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
                return false;
              } // end if
            } // end else
          } catch (err) {
            // caught some other unknown error
            console.log("verifyDataType: Caught error parsing.\n- Expected: " + cdt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)));
          } // end catch
          return true;
        };

        // Check for an Array with objects in it.
        var verifyArrObjs = function (k, v) {
          isArr = verifyDataType("array", k, v);
          if (isArr) {
            isObjs = verifyDataType("object", k, v[0]);
            if (isObjs) {
              return true;
            }
          }
          console.log("verifyArrObjs: Invalid data type: expected: obj, given: " + _typeof(v[0]));
          return false;
        };

        // Verify Data types in Paleo/Chron data.
        var verifyPaleoChron = function (pdData, k, v) {

          // value is an array
          if (!Array.isArray(v)) {
            logFeedback("err", "Invalid data type: " + k + ". Expected: " + dt + ", Given: " + (typeof v === 'undefined' ? 'undefined' : _typeof(v)), k);
          } else if (Array.isArray(v) && v.length > 0) {
            // check if the root paleoData or chronData is an array with objects.
            var correctTop = verifyArrObjs(k, v);

            if (correctTop) {
              // create table names based on what "mode" we're in. chron or paleo
              var meas = pdData + "MeasurementTable";
              var mod = pdData + "Model";
              // check if measurement table exists
              if (v[0].hasOwnProperty(meas)) {
                // check if measurement table is array with objects
                verifyArrObjs(meas, v[0][meas]);
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
                        verifyArrObjs(table, v[0][mod][0][table]);
                      } else {
                        verifyDataType("object", table, v[0][mod][0][table]);
                      }
                    } // if has property
                  } // end model table inner
                } // end correctBottom
              } // end has model table
            } // end correctTop
          } // end else
        }; // end verify

        // END VERIFY STRUCTURE

        // REQUIRED DATA
        // master for checking for required fields. call sub-routines.
        var verifyRequiredFields = function (m) {
          // call sub-routine checks
          requiredRoot(m);
          requiredPaleoChron("paleo", m);
          requiredPaleoChron("chron", m);
        };

        // verify required fields at all levels of paleoData & chronData
        var requiredPaleoChron = function (pc, m) {

          // I'll use "paleoData" in comments, but this function applies to paleoData and chronData
          var pdData = pc + "Data";
          var meas = pc + "MeasurementTable";
          var mod = pc + "Model";

          // paleoData not found
          if (!m.hasOwnProperty(pdData)) {
            if (pc === "paleo") {
              logFeedback("err", "Missing data: " + pdData + " section", pdData);
            }
          }
          // paleoData found
          else {
              if (pc === "paleo" && m[pdData].length === 0) {
                logFeedback("err", "Missing data: " + meas, meas);
              } else {
                // for each object in the paleoData list
                for (var i = 0; i < m[pdData].length; i++) {
                  // hold table in variable.
                  var table = m[pdData][i];
                  var crumbs = pdData + i + meas;

                  // measurementTable found
                  if (table.hasOwnProperty(meas)) {
                    for (var k = 0; k < table[meas].length; k++) {
                      // hold current meas table object in a variable
                      var measObj = table[meas][k];
                      var crumbs = pdData + i + meas + k;
                      requiredTable(measObj, crumbs);
                    }
                  } // end meas

                  // paleoMeasurementTable not found, and it's required
                  else if (!table.hasOwnProperty(meas) && pc == "paleo") {
                      // log error for missing required table
                      logFeedback("err", "Missing data: " + crumbs, meas);
                    }
                  // paleoModel found
                  if (table.hasOwnProperty(mod)) {
                    for (var k = 0; k < table[mod].length; k++) {
                      var modObj = table[mod][k];
                      var crumbs = pdData + i + mod + k;
                      // found summary table
                      if (modObj.hasOwnProperty("summaryTable")) {
                        requiredTable(modObj.summaryTable, crumbs + ".summaryTable");
                      }
                      // found ensemble table
                      if (modObj.hasOwnProperty("ensembleTable")) {
                        requiredTable(modObj.ensembleTable, crumbs + ".ensembleTable");
                      }
                      // found distribution table
                      if (modObj.hasOwnProperty("distributionTable")) {
                        for (var j = 0; j < modObj.distributionTable.length; j++) {
                          var distObj = modObj.distributionTable[j];
                          requiredTable(distObj, crumbs + ".distributionTable" + j);
                        } // end for
                      } // end dist
                    } // end model loop
                  } // end if model
                } // end paleoData object loop
              } // end else
            } // end else
        }; // end requiredPaleoChron fn

        // each table must have "filename" and "missingValue"
        // each column must have "number", "tsid", and "variableName"
        var requiredTable = function (t, crumbs) {

          // look for table filename
          var filename = "";
          if (!t.hasOwnProperty("filename")) {
            logFeedback("err", "Missing data: " + crumbs + ".filename", "filename");
          } else {
            filename = t.filename;
          }

          // look for table missing value
          var missingValue = "";
          if (!t.hasOwnProperty("missingValue")) {
            logFeedback("err", "Missing data: " + crumbs + ".missingValue", "missingValue");
          } else {
            missingValue = t.missingValue;
          }

          // columns not found
          if (!t.hasOwnProperty("columns")) {
            logFeedback("err", "Missing data: " + crumbs + ".columns", "columns");
          }
          // columns found
          else if (t.hasOwnProperty("columns")) {

              if (filename) {
                requiredColumnsCtMatch(filename, t.columns);
              }
              // loop over each column in the table
              for (var i = 0; i < t.columns.length; i++) {
                // loop over each of the required column keys
                for (var k in keys.reqTableKeys) {
                  currKey = keys.reqTableKeys[k];
                  // see if this column has each of the required keys
                  if (!t.columns[i].hasOwnProperty(currKey)) {
                    // required key is missing, log error
                    logFeedback("err", "Missing data: " + crumbs + ".column" + i + "." + currKey, currKey);
                  }
                } // end table keys
              } // end columns loop
            } // end 'if columns exist'
        }; // end requiredTable fn

        // check that column count in a table match the column count in the CSV data
        var requiredColumnsCtMatch = function (filename, columns) {
          var csvCt = files.csv[filename]["cols"];
          var metaCt = columns.length;
          // edge case: ensemble table that has "two" columns, but actuall column 2 is a list of columns.
          if (csvCt !== metaCt) {
            // column counts don't match. Do we have two columns? Might be an ensemble table
            if (columns.length === 2) {
              // Is column 2 an array of columns? (most likely)
              if (Array.isArray(columns[1]["number"])) {
                // calculate how many columns this array REALLY represents.
                metaCt = columns[1].number.length - 1 + metaCt;
                // Do the column counts match now?
                if (csvCt !== metaCt) {
                  // Okay, there is actually an error now. Log it.
                  logFeedback("err", "Mismatched columns: " + filename + " has " + csvCt + ", Jsonld has " + metaCt, filename);
                }
              }
              // is column 1 an array of column numbers? (less likely)
              else if (Array.isArray(columns[0]["number"])) {
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
        }; // end requiredColumnsCtMatch fn

        // verify required keys in metadata root level
        var requiredRoot = function (m) {
          // loop through and check for required fields. (lipdVersion, archiveType, paleoMeasurementTable..what else???)
          for (var i = 0; i < keys.reqRootKeys.length; i++) {
            // Current key
            var key = keys.reqRootKeys[i];
            // Pub found. Check for required keys.
            if (key === "pub" && m.hasOwnProperty(key)) {
              requiredPub(m);
            } else if (key === "geo") {
              // Geo found. Check for valid data.
              if (m.hasOwnProperty(key)) {
                requiredGeo(m);
              }
              // Geo not found. Coordinates are definitely missing, which triggers an error.
              else {
                  logFeedback("err", "Missing data: " + "coordinates", "coordinates");
                }
            }
            // All other required root keys
            else if (!m.hasOwnProperty(key)) {
                // key not found! log the error
                logFeedback("err", "Missing data: " + key, key);
              }
          }
        };

        // pub is not mandatory, but if pub is present, then it must have the required keys
        var requiredPub = function (m) {
          try {
            // pub not found, log a warning.
            if (!m.hasOwnProperty("pub")) {
              logFeedback("warn", "No publication data", "pub");
            }
            // pub found, make sure it has the required keys
            else {
                // for each pub in the pub list
                for (var i = 0; i < m.pub.length; i++) {
                  var curPub = m.pub[i];
                  // loop over required keys, and see if this pub has the key
                  for (var k = 0; k < keys.reqPubKeys.length; k++) {
                    var key = keys.reqPubKeys[k];
                    if (!m.pub[i].hasOwnProperty(key)) {
                      // this pub is missing a required key!
                      logFeedback("err", "Missing data: " + "pub" + i + key, key);
                    }
                  }
                }
              }
          } catch (err) {
            logFeedback("warn", "Encountered problem validating: pub");
          }
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
              // check if longitude is range
              if (!lonValid) {
                logFeedback("error", "Longitude out of range: Enter value from -180 to 180", "longitude");
              }
              // check if latitude is in range
              if (!latValid) {
                logFeedback("error", "Latitude out of range: Enter value from -90 to 90", "latitude");
              }
            } else {
              // there aren't any coordinate values to make the map
              logFeedback("error", "Missing data: " + "geo - coordinates", "coordinates");
            }
          } catch (err) {
            logFeedback("warn", "Unable to map location", "geo");
            console.log("requiredGeo: " + err);
          }
        };

        // END REQUIRED DATA


        // VERIFY BAGIT
        // verify the 4 bagit files are present, indicating a properly bagged LiPD file.
        var verifyBagit = function (files) {
          // Bagit filenames are static. Check that each is present.
          var validBagitFiles = ["tagmanifest-md5.txt", "manifest-md5.txt", "bagit.txt", "bag-info.txt"];
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
          if (count === 4) {
            logFeedback("pos", "Valid Bagit File", "bagit");
            feedback.bagitValid = true;
          }
        };
        // END VERIFY BAGIT

        // VERIFY VALID
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
        // END VERIFY VALID
        try{
          cb(validate());
        } catch(err){
          console.log("validate: err: " + err);
        }
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
