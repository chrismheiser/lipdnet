var create = (function(){

  return {

    addAuthor: (function(entry){
      var _block = {"name": ""};
      entry.push(_block);
      return entry;
    }),

    addBlock: (function(entry, blockType, pc){
      try{
        if(pc !== null){
          console.log("Entry inbound");
          console.log(entry);
          // measurement tables
          if (blockType === "measurement"){
            entry["measurementTable"] = create.addTable(entry["measurementTable"]);
          }
          // model tables
          else if (["summary", "ensemble", "distribution"].indexOf(blockType) !== -1){
            console.log("sendto prepModelTable");
            console.log(entry);
            create.prepModelTable(entry, blockType, function(entry2){
              if (blockType === "summary"){
                entry2["model"][0]["summaryTable"] = create.addTable(entry2.model[0].summaryTable);
              } else if (blockType === "distribution"){
                entry2["model"][0]["distributionTable"] = create.addTable(entry2.model[0].distributionTable);
              } else if (blockType === "ensemble"){
                entry2["model"][0]["ensembleTable"] = create.addTable(entry2.model[0].ensembleTable);
              }
            });
          }
        } else {
          // This is a block that doesn't require a "paleo" or "chron" designation
          if(blockType === "funding"){
            entry = create.addFunding(entry);
          } else if (blockType === "pub"){
            entry = create.addPublication(entry);
          } else if (blockType === "author"){
            entry = create.addAuthor(entry);
          } else if (blockType === "column"){
            entry = create.addTableColumn(entry);
          } else if (blockType === "geo"){
            entry = create.addGeo(entry);
          }
        }
        return entry;
      } catch (err){
       console.log("create:addBlock: " + err);
      }
    }),

    addChronData :(function(entry){
      try{
        var _ignore = entry.chronData[0].measurementTable[0];
      }catch (err) {
        entry.chronData = [
          {"measurementTable": [{"tableName": "", "missingValue": "NaN",
        "filename": "", "columns": []}]}];
      }
      return entry;
    }),

    addDataSetName: (function(_dsn, _csv){
      // Check if the datasetname is in the CSV filenames or not.
      for (var _key in _csv){
        if(_csv.hasOwnProperty(_key)){
          // if the datasetname exists in this csv file.
          if(_key.indexOf(_dsn) !== -1){
            // don't need to add a datasetname. We found it.
            return false;
          }
        }
      }
      // no datasetname found. We need to add them throughout the JSON data and _csv names.
      return true;
    }),

    addFunding: (function(entry){
      var _block = {"agency": "", "grant": "", "investigator": "", "country": ""};
      if (!entry){
        entry = [];
      }
      entry.push(_block);
      return entry;
    }),

    addPublication: (function(entry){
      var _block = {"identifier": [{ "type": "doi", "id": "", "url": "" }], "title": "", "year":"", "journal": "",
                  "issue":"", "edition": "", "volume":"", "author": [{"name": ""}] };
      entry.push(_block);
      return entry;
    }),

    addRmProperty: (function(entry, field){
      try{
        if (entry.hasOwnProperty(field)){
          delete entry[field];
        } else {
          entry[field] = "";
        }
      } catch(err) {
        console.log("create: addRemoveField: " + err);
      }
      return entry;
    }),

    addTable: (function(entry){
      try{
        if(typeof(entry)=== "undefined"){
          entry = [];
        }
        // Add a full data table to an entry.
        entry.push({"tableName": "", "filename": "", "missingValue": "NaN", "columns": []});
        return entry;
      } catch(err){
        console.log("addTable: " + err);
        console.log(entry);
      }
    }),

    addTableColumn: (function(entry){
      // Our new column number is one higher than the amount of columns we currently have.
      var _number = entry.length + 1;
      var _block = {"number": _number,"variableName": "", "description": "", "units": "", "values": ""};
      entry.push(_block);
      return entry;
    }),

    addNoaaReady: (function(D, cb){
      cb(D);
    }),

    /**
     * Add the wiki required fields to the
     */
    addWikiReady: (function(D, cb){
      var _pcs = ["paleoData", "chronData"];
      // var _required_wiki = {
      //   "root": ["dataSetName", "archiveType"],
      //   "column": ["takenAtDepth", "variableName", "inferredVariableType", "proxyObservationType"]
      // };

      // We don't need to add the root fields, because those are already standard.

      for (var _u=0; _u < _pcs.length; _u++){
        var _pc = _pcs[_u];
        if(D.hasOwnProperty(_pc)){
          var _section = D[_pc];
          for(var _s=0; _s < _section.length; _s++){
            if(_section[_s].hasOwnProperty("measurementTable")){
              D[_pc][_s]["measurementTable"] = create.addWikiReadyTables(_section[_s]["measurementTable"]);
            }
            if(_section[_s].hasOwnProperty("model")){
              D[_pc][_s]["model"] = create.addWikiReadyModels(_section[_s]["model"]);
            }
          }
        }
      }

      cb(D);
    }),

    addWikiReadyModels: (function(models){
      for(var _p = 0; _p <models.length; _p++){
        var _model = models[_p];
        if (_model.hasOwnProperty("summaryTable")){
          models[_p]["summaryTable"] = create.addWikiReadyModels(models[_p]["summaryTable"]);

        }
        if (_model.hasOwnProperty("ensembleTable")){
          models[_p]["ensembleTable"] = create.addWikiReadyModels(models[_p]["ensembleTable"]);
        }
        // if (_model.hasOwnProperty("distributionTable")){
        //   models[_p]["distributionTable"] = create.addWikiReadyModels(models[_p]["distributionTable"]);
        // }
      }
      return(models);
    }),

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param {Array} tables Metadata
     * @return {Array} tables Metadata
     */
    addWikiReadyTables: (function(tables){
      var _required = ["takenAtDepth", "variableName", "inferredVariableType", "proxyObservationType"];
      for(var _t = 0; _t<tables.length; _t++){
        var _columns = tables[_t]["columns"];
        for(var _c = 0; _c < _columns.length; _c++){
          for (var _k = 0; _k < _required.length; _k++){
            var _key = _required[_k];
            if(!_columns[_c].hasOwnProperty(_key)){
              tables[_t]["columns"][_c][_key] = "";
            }
          }
        }
      }
      return(tables);
    }),

    alterFilenames: (function(_json){
      var _dsn = _json.dataSetName;
      var _newCsv = {};
      // change all the csv filenames in the csv section
      for (var _key in _json.csv){
        if (_json.csv.hasOwnProperty(_key)){
          _newCsv[_dsn + "." + _key]  = _json.csv[_key];
        }
      }
      // change all the csv filenames in the table data
      var _newJson = create.alterJsonFilenames(_json.json, _dsn);
      _json.csv = _newCsv;
      _json.json = _newJson;
      return _json;
    }),

    alterJsonFilenames: (function(x, dsn){
      // find any filename entries and append the datasetname to the front of it.

      // loop over this data structure
      for (var _key in x){
        // safety check: don't want prototype attributes
        if (x.hasOwnProperty(_key) && x[_key] !== undefined){
          // found a filename entry. change it.
          if(_key === "filename"){
            x[_key] = dsn + "." + x[_key];
          } else if (x[_key].constructor === [].constructor && x[_key].length > 0) {
            // value is an array. iterate over array and recursive call
            for (var _g=0; _g < x[_key].length; _g++){
              // process, then return in place.
              x[_key][_g] = create.alterJsonFilenames(x[_key][_g], dsn);
            }
          } else if (x[_key].constructor === {}.constructor && x[_key].length > 0){
            x[_key] = create.alterJsonFilenames(x[_key], dsn);
          }
        }
      }
      return x;
    }),

    /**
     * Wrapper for multiple closing functions before initiating a file download
     *
     * For example: removing temporary fields, fixing filenames, and moving data around.
     *
     */
    closingWorkflow: (function(_scopeFiles, _dsn, _csv){
      // Remove temporary fields from the JSON data
      var _newJson = JSON.parse(JSON.stringify(_scopeFiles));
      // TODO copy the archiveType from the root, to each data table column

      _newJson.json = create.rmTmpEmptyData(_newJson.json);
      // Append the DataSetName to the front of all the CSV files.
      var _addDataSetName = create.addDataSetName(_dsn, _csv);
      if (_addDataSetName){
        // Add Datasetname to all json and csv filenames.
        _newJson = create.alterFilenames(_newJson);
      }
      return _newJson;
    }),

    initColumnTmp: (function(x){
      // when uploading a file, we need to add in the column property booleans for the "Add Properties" section of each
      // column. That way, an uploaded file that already has properties from our list will trigger the checkbox to be on.
      var _ignore = ["values", "variableName", "units", "number"];
      // loop over this data structure
      try{
        for (var _key in x){
          // safety check: don't want prototype attributes
          if (x.hasOwnProperty(_key) && x[_key] !== undefined){
            // if this key is in the array of items to be removed, then remove it.
            if(_key === "columns"){
              // loop for each column
              for (var _v = 0; _v < x.columns.length; _v++){
                var _col = x.columns[_v];
                x.columns[_v].tmp = {};
                // loop for each property in one column
                for (var _prop in _col){
                  if (_col.hasOwnProperty(_prop) && _col[_prop] !== undefined){
                    // console.log(_prop);
                    if(!_ignore.includes(_prop)){
                      // console.log("adding prop");
                      _col.tmp[_prop] = true;
                    }
                  }
                }
                // console.log(_col);
              }
              // console.log(_x);
            } else if (x[_key].constructor === [].constructor && x[_key].length > 0) {
              // value is an array. iterate over array and recursive call
              for (var _g=0; _g < x[_key].length; _g++){
                // process, then return in place.
                x[_key][_g] = create.initColumnTmp(x[_key][_g]);
              }
            } else if (x[_key].constructor === {}.constructor && x[_key].length > 0){
              x[_key] = create.initColumnTmp(x[_key]);
            }
          }
        }
      } catch (err){
        console.log(err);
      }
      return x;
    }),

    // When a LiPD file is uploaded, it needs an Array for these fields. Empty or not. If missing, put in empty arrays. 
    initMissingArrs: (function(x){
      var currKey = "";
      var keys = ["pub", "funding", "chronData", "paleoData"];
      for (var key in keys){
        try {
          currKey = keys[key];
          if(!x.hasOwnProperty(currKey)){
             x[currKey] = [];
          } else {
            if(x[currKey] === 'undefined' || !x[currKey]){
              x[currKey] = [];
            }
          }
        } catch (err){
          console.log("initMissingArrs: " + err);
        }
      }
      return x;
    }),

    rmTmpEmptyData: (function(x){
      // We add a few temporary variables (toggle, column values) when creating the page.
      // However, these cannot end up in the final lipd file. remove them.
      var _removables = ["toggle", "values", "tmp", "showColumn"];
      try{
        for (var _key in x){
          // safety check: don't want prototype attributes
          if (x.hasOwnProperty(_key)){
            if (typeof(x[_key]) === "string" && !x[_key]){
              delete x[_key];
            } // if string
            // if this key is in the array of items to be removed, then remove it.
            else if(_removables.includes(_key)){
              // remove this key
              delete x[_key];
            } // if key in removables
            else if (x[_key].constructor === [].constructor) {
              // value is an array. iterate over array and recursive call
              if (x[_key].length === 0){
                delete x[_key];
              } else {
                for (var _g=0; _g < x[_key].length; _g++){
                  // process, then return in place.
                  x[_key][_g] = create.rmTmpEmptyData(x[_key][_g]);
                }
              }
            } // if array
            else if (x[_key].constructor === {}.constructor){
              if (JSON.stringify(x[_key]) === JSON.stringify({})){
                delete x[_key];
              } else {
                x[_key] = create.rmTmpEmptyData(x[_key]);
              }
            } // if object
          } // hasownproperty
        } // for key in object
      } catch (err){
        console.log(err);
      }
      return x;
    }),

    rmBlock: (function(entry, idx){
      if (idx > -1) {
          entry.splice(idx, 1);
      }
      return entry;
    }),

    sortDoiResponse: (function(res, entry){
      var _keys = {
        "citation": "citation",
        "created": "year",
        "author": "authors",
        "publisher": "publisher",
        "title": "title",
        "type": "type",
        "volume": "volume",
        "issue": "issue",
        "page": "pages",
        "abstract": "abstract"
      };
      //do some stuff and put res data into the entry.
      for (var _key in _keys) {
        try{
          if (_keys.hasOwnProperty(_key) && res.data.hasOwnProperty(_key)) {
            if (res.data[_key]){
              if (_key === "created"){
                // get the year from the created attribute
                entry.year = res.data.created["date-parts"][0][0];
              } else if (_key === "author"){
                // loop over and sort through the author names
                var _auths = [];
                var _currAuth = "";
                // Loop over the authors data in the response object
                for(var _i = 0; _i < res.data.author.length; _i++){
                  // put together the string for this one author
                  _currAuth = res.data.author[_i].family  + ", " + res.data.author[_i].given;
                  // push this author into the array in BibJson fashion
                  _auths.push({"name": _currAuth});
                }
                // set the authors array to the entry data
                entry.authors = _auths;
              } else {
                // normal case: create new key in entry, and set the value using the respoonse object data.
                entry[_keys[_key]] = res.data[_key];
              }
            } // end if undefined
          } // end if hasOwnProperty
        } catch(err){
          console.log(err);
        }
      } // end for loop
      return entry;
    }),

    // STORED DATA LISTS -----

    archiveTypeList: (function(){
      return ["coral", "document", "glacier ice", "hybrid","lake sediment", "marine sediment", "mollusks shells",
        "peat", "rock", "sclerosponge", "speleothem", "wood"];
    }),

    createdByList: (function(){
      return ["excel", "lipd.net", "wiki", "noaa", "unknown"];
    }),

    defaultColumnFields: (function(){
      return ["proxy", "measurementMaterial", "method", "variableType", "sensorSpecies", "sensorGenus", "variableType",
        "proxyObservationType", "notes", "interpretation"];
    }),

    inferredVariableTypeList: (function(){
      return ['Temperature', 'Sea Surface Temperature', 'Bottom Water Temperature', 'Ocean Mixed Layer Temperature',
      'Surface air temperature', 'Carbon dioxide concentration', 'Methane concentration', 'Nitrous oxide concentration',
      'Free oxygen levels', 'pH', 'Carbonate saturation', 'Carbonate Ion Concentration', 'Salinity', 'dD', 'd18O',
      'ExcessD', 'Precipitation Amount', 'd18O', 'dD', 'ExcessD', 'Moisture Content', 'PDSI', 'Year', 'JulianDay',
      'Age', 'Radiocarbon Age', 'SOI', 'Nino3.4', 'Nino3', 'Nino4', 'Nino1', 'Nino2', 'Nino1+2', 'AMO', 'NAO', 'AO',
      'SAM', 'AAO'];
    }),

    interpretationLocalList: (function(){
      return ["local", "far-field"];
    }),

    interpretationDirectionList: (function(){
      return ["positive", "negative"];
    }),

    interpretationScopeList: (function(){
      return ["climate", "ecology", "isotope"];
    }),

    prepModelTable: (function(entry, blockType, cb){
      try{
        if(entry.hasOwnProperty("model")){
          if(!entry["model"][0].hasOwnProperty(blockType + "Table")){
            entry["model"][0][blockType] = [];
          }
        }
        // model doesnt exist. create it
        else {
          entry["model"] = [{"summaryTable": [], "ensembleTable": [], "distributionTable": [], "method": {}}];
        }
        cb(entry);
      } catch(err){
        console.log("create: prepModelTable: " + err);
        console.log(entry);
      }
    }),

    proxyObservationTypeList: (function(){
      return ['Al/Ca', 'Ar-Ar', 'B/Ca', 'Ba/Ca', 'C', 'Clay fraction', 'Color', 'd34S', 'd13C', 'd15N', 'd17O', 'd18O',
      'dD', 'Density', 'Diffuse spectral reflectance', 'Faunal', 'Fe/Ca', 'Floral', 'Grain size', 'Historic',
      'Layer thickness', 'Lead Isotope', 'Li/Ca', 'Lithics', 'Luminescence', 'Magnetic susceptibility', 'Mg/Ca',
      'Mineral matter', 'Mn/Ca', 'Moisture Content', 'N', 'Neodymium', 'Organic matter', 'P', 'Permeability',
      'Porosity', 'Radiocarbon', 'Resistivity', 'Sand fraction', 'Si', 'Silt fraction', 'Sr/Ca', 'TEX86', 'U-Th',
      'Uk37', 'X-Ray diffraction', 'X-ray fluorescence', 'Zn/Ca'];
    }),

    timeUnitList: (function(){
      return ["AD", "BP", "CE"];
    }),

    variableTypeList: (function(){
      return ["measured", "inferred"];
    }),

    yearList: (function(){
      var _years = [];
      for(var _n=new Date().getFullYear(); _n>1950; _n--){
        _years.push(_n);
      }
      return(_years);
    })

  }; // end return

}());
