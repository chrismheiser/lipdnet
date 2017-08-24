VER_1_3 = {
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

var versions = (function(){
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
    update_lipd_version: (function(L) {

      L = versions.get_lipd_version(L);

      if(L.lipdVersion.indexOf(['1.0', 1.0, 1])){
        L = versions.update_lipd_v1_1(L);
      }
      else if (L.lipdVersion.indexOf(["1.1", 1.1])){
        L = versions.update_lipd_v1_2(L);
      }
      else if (L.lipdVersion.indexOf(["1.2", 1.2])){
        L = versions.update_lipd_v1_3(L);
      }
      return L;
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
    get_lipd_version: (function(L){
      var _version = 1.3;
      var _keys = ["lipdVersion", "liPDVersion", "LiPDVersion"];
      for(var _m=0; _m < _keys.length; _m++){
        var _key = _keys[_m];
        if(L.hasOwnProperty(_key)){
          _version = parseFloat(L[_key]);
          L[_key].pop();
        }
      }
      if(_version){
        L["lipdVersion"] = _version;
      } else {
        console.log("Error: Unable to find a lipdVersion. Assuming v1.3");
      }
      return(L);
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
    merge_interpretations: (function(d){
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
              _tmp.append(d[_key]);
            }
          }
        }
        d["interpretation"] = _tmp;
      } catch(err){
        console.log("merge_interpretations: " + err);
      }
      return d;
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
    update_lipd_v1_1: (function(d){

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
              _tmp.push({"chronMeasurementTable": [table]});
            }
            // Atypical case:  The table exists, but it is a dictionary. Turn it into a list with one entry.
            else if (table.hasOwnProperty("chronMeasurementTable")){
              if(!Array.isArray(table.chronMeasurementTable)){
                _tmp.push({"chronMeasurementTable": [table.chronMeasurementTable]});
              }
            }
          }
          if(_tmp){
            d.chronData = _tmp;
          }
          d.lipdVersion = 1.1;
        }
      } catch(err){
        console.log("update_lipd_v1_1: " + err);
      }

      return d;
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
    update_lipd_v1_2: (function(d){

      var _tmp = [];
      try{
        // PaleoData is the only structure update
        if(d.hasOwnProperty("paleoData")){
          // As of 1.2, PaleoData should match the structure of v1.1 chronData.
          // There is an extra level of abstraction and room for models, ensembles, calibrations, etc.
          for(var _u=0; _u < d["paleoData"].length; _u++) {
            var _table = d["paleoData"][_u];
            // No paleoMeasurementTable. Add the extra level
            if(!_table.hasOwnProperty("paleoMeasurementTable")){
              _tmp.push({"paleoMeasurementTable": [_table]});
            }
            // paleoMeasurementTable exists, but it is an object, then turn it into an array with one entry
            else if(_table.hasOwnProperty("paleoMeasurementTable")){
              if(typeof(_table.paleoMeasurementTable) === "object" && !Array.isArray(_table.paleoMeasurementTable)){
                _tmp.push({"paleoMeasurementTable": [_table.paleoMeasurementTable]});
              }
            }
          }
          if(_tmp){
            d.paleoData = _tmp;
          }
        }
        d.lipdVersion = 1.2;
      } catch(err){
        console.log("update_lipd_v1_2: " + err);
      }
      return d;
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
    update_lipd_v1_3: (function(d){
      try{
        d = versions.update_lipd_v1_3_names(d);
        d = versions.update_lipd_v1_3_structure(d);
        d.lipdVersion = 1.3;
      } catch(err) {
        console.log("update_lipd_v1_3: " + err);
      }
      return d;
    }),

    /**
     * Update the key names and merge interpretation data
     *
     * @param {object} d Metadata
     * @return {object} d Metadata
     *
     */
    update_lipd_v1_3_names: (function(d){

      try{
        // for arrays
        if(Array.isArray(d)){
          for(var _e=0; _e<d.length; _e++){
            // dive down
            d[_e] = versions.update_lipd_v1_3_names(d[_e]);
          }
        }
        // for objects
        else if(typeof(d) === "object"){
          for(var _key in d){
            if(d.hasOwnProperty(_key)){
              // dive down
              d[_key] = versions.update_lipd_v1_3_names(d[_key]);
              if(VER_1_3.swap.indexOf(_key) !== -1){
                var _key_swap = VER_1_3.swap[_key];
                d[_key_swap] = d[_key];
                delete d[_key];
              }
              else if(VER_1_3.tables.indexOf(_key) !== -1){
                d[_key] = "";
              }
            }
            // merge interpretations where necessary
            for(var _c=0; _c<VER_1_3.interpretations.length; _c++){
              if(d.hasOwnProperty(VER_1_3.interpretations[_c])){
                d = versions.merge_interpretations(d);
              }
            }
          }
        }
      } catch(err){
        console.log("update_lipd_v1_3_names: " + err);
      }
      return d;

    }),

    /**
     * Update the structure for summary and ensemble tables
     *
     * @param {object} d Metadata
     * @return {object} d Metadata
     *
     */
    update_lipd_v1_3_structure: (function(d){
      var _pcs = ["paleoData", "chronData"];
      var _tbs = ["summaryTable", "ensembleTable"];
      // root
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
      return d;
    })
  }

}());

