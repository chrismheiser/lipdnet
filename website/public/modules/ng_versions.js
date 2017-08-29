var versions = (function(){
  // 'use strict';
  return {

    /**
     * Validator: Entry point for the validation process. Callback layer
     *
     * @param {array} files LiPD data sorted by type.
     *   files = { "modal": {}, "lipdFilename": "", "dataSetName": "", "fileCt": 0, "bagit": {}, "csv": {},
                  "jsonSimple": {}, "json": {} };
     * @param {object} options Validation options {"fileUploaded": true/false}
     * @param {callback} cb Callback sorts the validation results
     */
    update_lipd_version: (function(files, cb) {
      var _d = {"files": {}, "version": 1.0};
      try{
        versions.get_lipd_version(files.json, function(_dat){
          files.json = _dat.meta;
          _d.version =  _dat.version;
          versions.update_lipd_version_2(files, function(_dat2){
            files.json = _dat2;
            _d.files = files;
            cb(_d);
          });
        });
      } catch(err){
        console.log("update_lipd_version: " + err);
      }
    }),

    update_lipd_version_2: (function(files, cb){
      if(['1.0', 1.0, 1].indexOf(files.json.lipdVersion) !== -1){
        versions.update_lipd_v1_1(files.json, function(d){
          versions.update_lipd_v1_2(d, function(d2){
            versions.update_lipd_v1_3(d2, function(d3){
              cb(d3);
            });
          });
        });
      }
      else if (['1.1', 1.1].indexOf(files.json.lipdVersion) !== -1){
        versions.update_lipd_v1_2(files.json, function(d2){
          versions.update_lipd_v1_3(d2, function(d3){
            cb(d3);
          });
        });
      }
      else if (['1.2', 1.2].indexOf(files.json.lipdVersion) !== -1){
        versions.update_lipd_v1_3(files.json, function(d3){
          cb(d3);
        });
      } else {
        // already at v1.3
        cb(files.json)
      }

    }),

    /**
     *
     * Get the LiPD version for this file. Account for other key variations, and switch them to "lipdVersion"
     * if necessary. If a lipdVersion does not exist, then assume it is the current version (v1.3) and hope for
     * the best.
     *
     * @param {object} L Metadata
     * @return {object} L Metadata
     *
     */
    get_lipd_version: (function(L, cb){
      var _version = null;
      var _keys = ["lipdVersion", "liPDVersion", "LiPDVersion"];
      try{
        for(var _m=0; _m < _keys.length; _m++){
          var _key = _keys[_m];
          if(L.hasOwnProperty(_key)){
            _version = parseFloat(L[_key]);
            delete L[_key];
          }
        }
        if(_version){
          L["lipdVersion"] = _version;
        } else {
          console.log("Error: Unable to find a lipdVersion. Assuming v1.3");
          L["lipdVersion"] = 1.3;
        }
      } catch(err){
        console.log("get_lipd_version: " + err);
      }
      cb({"meta": L, "version": _version});
    }),

    /**
     * v1.3 change
     *
     * Previously interpretation fields were separated by type ( climateInterpretation, isotopeInterpretation, etc) but
     * now all interpretations are merged into a single collective "interpretation" field. Given the different way that
     * this data has been stored over the version history, we need to account for different possibilities.
     *
     * @param {object} d Metadata
     * @return {object} d Metadata
     *
     */
    merge_interpretations: (function(d, cb){
      var _tmp = [];
      var _keys = ["climateInterpretation", "isotopeInterpretation", "interpretation"];

      try{

        for(var _p = 0; _p < _keys.length; _p++){
          var _key = _keys[_p];
          if(d.hasOwnProperty(_key)){
            if(Array.isArray(d[_key])){
              for(var _h=0; _h < d[_key].length; _h++){
                _tmp.push(d[_key][_h]);
              }
            } else if (typeof(d[_key]) === "object"){
              _tmp.push(d[_key]);
            }
          }
        }
        d["interpretation"] = _tmp;
      } catch(err){
        console.log("merge_interpretations: " + err);
      }
      cb(d);
    }),

    /**
     *
     * Update LiPD v1.0 to v1.1
     * - chronData entry is a list that allows multiple tables
     * - paleoData entry is a list that allows multiple tables
     * - chronData now allows measurement, model, summary, modelTable, ensemble, calibratedAges tables
     * - Added 'lipdVersion' key
     *
     * @param {object} d Metadata
     * @return {object} d Metadata
     */
    update_lipd_v1_1: (function(d, cb){

      console.log("Updating to v1.1");
      var _tmp = [];

      try{
        // ChronData is the only structure update
        if(d.hasOwnProperty("chronData")){

          // As of v1.1, ChronData should have an extra level of abstraction.
          // No longer shares the same structure of paleoData
          for(var _b=0; _b < d.chronData.length; _b++){
            var _table = d.chronData[_b];
            // Typical case: the file has table data right at the top
            if(!_table.hasOwnProperty("chronMeasurementTable")){
              _tmp.push({"chronMeasurementTable": [_table]});
            }
            // Atypical case:  The table exists, but it is a dictionary. Turn it into a list with one entry.
            else if (_table.hasOwnProperty("chronMeasurementTable")){
              if(!Array.isArray(_table.chronMeasurementTable)){
                _tmp.push({"chronMeasurementTable": [_table.chronMeasurementTable]});
              }
            }
          }
          if(_tmp){
            d.chronData = _tmp;
          }
        }
        d.lipdVersion = 1.1;
        cb(d);
      } catch(err){
        console.log("update_lipd_v1_1: " + err);
        cb(d);
      }
    }),


    /**
     * Update LiPD v1.1 to v1.2
     * - Added NOAA compatible keys : maxYear, minYear, originalDataURL, WDCPaleoURL, etc
     * - 'calibratedAges' key is now 'distribution'
     * - paleoData structure mirrors chronData. Allows measurement, model, summary, modelTable, ensemble,
     * distribution tables
     *
     * @param {object} d Metadata v1.1
     * @return {object} d Metadata v1.2
     *
     */
    update_lipd_v1_2: (function(d, cb){

      var VER_1_2 = {
        "swap": {
          "calibratedAges": "distributionTable",
          "calibratedAge": "distributionTable",
          "chronModelTable": "summaryTable",
          "paleoModelTable": "summaryTable"
        }
      };
      var _pcs = ["paleo", "chron"];

      console.log("Updating to v1.2");
      console.log(d);
      var _tmp = [];
      try{

        for(var _p = 0; _p < _pcs.length; _p++){
          var _pc = _pcs[_p];
          // Structure: paleoData is the only update
          if(d.hasOwnProperty(_pc + "Data")) {
            // As of 1.2, PaleoData should match the structure of v1.1 chronData.
            // There is an extra level of abstraction and room for models, ensembles, calibrations, etc.
            for (var _u = 0; _u < d[_pc + "Data"].length; _u++) {
              var _pmt = _pc + "MeasurementTable";
              var _table = d[_pc + "Data"][_u];
              // No paleoMeasurementTable. Add the extra level
              if (!_table.hasOwnProperty(_pmt)) {
                if(_pc === "paleo"){
                  _tmp.push({"paleoMeasurementTable": [_table]});
                } else {
                  _tmp.push({"chronMeasurementTable": [_table]});
                }
              }
              // paleoMeasurementTable exists, but it is an object, then turn it into an array with one entry
              else if (_table.hasOwnProperty(_pmt)) {
                if (typeof(_table[_pmt]) === "object" && !Array.isArray(_table[_pmt])) {
                  if(_pc === "paleo"){
                    _tmp.push({"paleoMeasurementTable": [_table]});
                  } else {
                    _tmp.push({"chronMeasurementTable": [_table]});
                  }
                }
              }
            } // end for
          } // end hasOwn
        }

        // Keys: chronData keys are the only update
        if(d.hasOwnProperty("chronData")){
          for(var _i=0; _i < d["chronData"].length; _i++){
            if(d["chronData"][_i].hasOwnProperty("chronModel")){
              for(var _b=0; _b < d["chronData"][_i]["chronModel"].length; _b++){
                var _model = d["chronData"][_i]["chronModel"][_b];
                for(var _key in VER_1_2["swap"]){
                  if(VER_1_2["swap"].hasOwnProperty(_key)){
                    if(_model.hasOwnProperty(_key)){
                      var _tmp_table = _model[_key];
                      delete _model[_key];
                      _model[VER_1_2["swap"][_key]] = _tmp_table;
                    }
                  }
                }
              }
            }
          }
        }
        if(_tmp){
          console.log("v12: paleodata");
          console.log(_tmp);
          d.paleoData = _tmp;
        }

        d.lipdVersion = 1.2;
        console.log("done with 1.2");
        console.log(d);
      } catch(err){
        console.log("update_lipd_v1_2: " + err);
      }
      cb(d);

    }),

    /**
     * Update LiPD v1.2 to v1.3
     *
     * - Added 'createdBy' key
     * - Top-level folder inside LiPD archives are named "bag". (No longer <datasetname>)
     * - jsonld file is now generically named 'metadata.jsonld' (No longer <datasetname>.lpd )
     * - All "paleo" and "chron" prefixes are removed from "paleoMeasurementTable", "paleoModel", etc.
     * - Merge isotopeInterpretation and climateInterpretation into "interpretation" block
     * - ensemble table entry is a list that allows multiple tables
     * - summary table entry is a list that allows multiple tables
     *
     * @param {object} d: Metadata v1.2
     * @return {object} d: Metadata v1.3
     */
    update_lipd_v1_3: (function(d, cb){
      console.log("Updating to v1.3");

      try{
        versions.update_lipd_v1_3_names(d, function(d2){
           console.log("done v1.3 names:");
           console.log(d2);
          versions.update_lipd_v1_3_structure(d2, function(d3){
            console.log("done v1.3 structure: ");
            console.log(d3);
            d3.lipdVersion = 1.3;
            cb(d3);
          });
        });
      } catch(err) {
        console.log("update_lipd_v1_3: " + err);
        cb(d);
      }
    }),

    /**
     * Update the key names and merge interpretation data
     *
     * @param {object} d Metadata
     * @return {object} d Metadata
     *
     */
    update_lipd_v1_3_names: (function(d, cb){
      try{
        d = versions.update_lipd_v1_3_names_rec(d);
      } catch(err){
        console.log("update_lipd_v1_3_names: " + err);
      }
      cb(d);

    }),

    update_lipd_v1_3_names_rec: (function(d){
      var VER_1_3 = {
        "tables": ["chronTableName", "paleoTableName", "paleoDataTableName", "chronDataTableName",
          "chronMeasurementTableName", "paleoMeasurementTableName"],
        "swap": {
          "paleoMeasurementTable": "measurementTable",
          "chronMeasurementTable": "measurementTable",

          "paleoModel": "model",
          "chronModel": "model",

          "paleoDataMD5": "dataMD5",
          "chronDataMD5": "dataMD5",

          "chronEnsembleMD5": "tableMD5",
          "paleoEnsembleMD5": "tableMD5",

          "chronEnsembleTableMD5": "tableMD5",
          "paleoEnsembleTableMD5": "tableMD5",

          "paleoMeasurementTableMD5": "tableMD5",
          "chronMeasurementTableMD5": "tableMD5"
        },
        "interpretations": ["climateInterpretation", "isotopeInterpretation"]
      };
        // for arrays
        if(Array.isArray(d)){
          for(var _e=0; _e<d.length; _e++){
            // dive down
            d[_e] = versions.update_lipd_v1_3_names_rec(d[_e]);
          }
        }
        // for objects
        else if(typeof(d) === "object"){
          for(var _key in d){
            if(d.hasOwnProperty(_key)){
              // dive down
              d[_key] = versions.update_lipd_v1_3_names_rec(d[_key]);
              if(Object.keys(VER_1_3["swap"]).indexOf(_key) !== -1){
                var _key_swap = VER_1_3["swap"][_key];
                d[_key_swap] = d[_key];
                delete d[_key];
              }
              else if(VER_1_3.tables.indexOf(_key) !== -1){
                d[_key] = "";
              }
            }
            // merge interpretations where necessary
            for(var _c=0; _c < VER_1_3["interpretations"].length; _c++){
              if(d.hasOwnProperty(VER_1_3["interpretations"][_c])){
                versions.merge_interpretations(d, function(d2){
                  d = d2;
                });
              }
            }
          }
        }
        return(d);
    }),

    /**
     * Update the structure for summary and ensemble tables
     *
     * @param {object} d Metadata
     * @return {object} d Metadata
     *
     */
    update_lipd_v1_3_structure: (function(d, cb){
      var _pcs = ["paleoData", "chronData"];
      var _tbs = ["summaryTable", "ensembleTable"];
      // root

      try{
        for(var _y=0; _y < _pcs.length; _y++){
          var _pc = _pcs[_y];
          // Section
          if(d.hasOwnProperty(_pc)){
            for(var _r=0; _r < d[_pc].length; _r++){
              // Section entry
              var _section = d[_pc][_r];
              // Model
              if(_section.hasOwnProperty("model")){
                for(var _w=0; _w < _section["model"].length; _w++){
                  // Model entry
                  var _model = _section["model"][_w];
                  console.log("model entry");
                  console.log(_model);
                  for(var _e=0; _e<_tbs.length; _e++){
                    if(_model.hasOwnProperty(_tbs[_e])){
                      // It's an object, but not an array object
                      if(!Array.isArray(_model[_tbs[_e]]) && typeof(_model[_tbs[_e]]) === "object"){
                        try{
                          // Swap out the object for an array, then add the table to the array.
                          var _tmp = _model[_tbs[_e]];
                          _model[_tbs[_e]] = [];
                          _model[_tbs[_e]].push(_tmp);
                        } catch(err){
                          console.log("update_lipd_v1_3_structure: " + err);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cb(d);
      } catch(err){
        console.log("update_lipd_v1_3_structure: " + err);
        cb(d);
      }

    })
  }

}());

