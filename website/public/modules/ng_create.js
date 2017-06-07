var create = (function(){

  return {

    addAuthor: (function(entry){
      var _block = {"name": ""};
      entry.push(_block);
      return entry;
    }),

    addBlock: (function(entry, blockType, pc){

      if(pc !== null){
        if (blockType === "measurement"){
          entry = create.addTable(entry, pc);
        } else if (blockType === "summary"){
          entry = create.addTable(entry, pc);
        } else if (blockType === "distribution"){
          entry = create.addTable(entry, pc);
        } else if (blockType === "ensemble"){
          entry = create.addTable(entry, pc);
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
    }),

    addChronData :(function(entry){
      try{
        var _ignore = entry.chronData[0].chronMeasurementTable[0];
      }catch (err) {
        entry.chronData = [
          {"chronMeasurementTable": [{"chronDataTableName": "", "missingValue": "NaN",
        "filename": "", "columns": []}]}];
      }
      return entry;
    }),

    addFunding: (function(entry){
      var _block = {"agency": "", "grant": "", "investigator": "", "country": ""};
      entry.push(_block);
      return entry;
    }),

    // TODO ???
    addGeo: (function(entry){
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

    addTable: (function(entry, pc){
      if(typeof(entry)=== "undefined"){
        entry = [];
      }
      // Add a full data table to an entry.
      var _block = {"tableName": "", "filename": "", "missingValue": "NaN", "columns": []};
      if(pc === "paleo"){
        _block.paleoDataTableName = "";
      } else if (pc === "chron"){
        _block.chronDataTableName = "";
      }
      entry.push(_block);
      return entry;
    }),

    addTableColumn: (function(entry){
      // Our new column number is one higher than the amount of columns we currently have.
      var _number = entry.length + 1;
      var _block = {"number": _number,"variableName": "", "description": "", "units": "", "values": ""};
      entry.push(_block);
      return entry;
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
      // change all the csv filesnames in the table data
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

    rmTmpEmptyData: (function(x){
      // We add a few temporary variables (toggle, column values) when creating the page.
      // However, these cannot end up in the final lipd file. remove them.
      var _removables = ["toggle", "values", "tmp"];
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

    // STORED DATA LISTS

    archiveTypeList: (function(){
      return ["coral", "document", "glacier ice", "hybrid","lake sediment", "marine sediment", "mollusks shells",
        "peat", "rock", "sclerosponge", "speleothem", "wood"];
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

    proxyObservationTypeList: (function(){
      return ['Al/Ca', 'Ar-Ar', 'B/Ca', 'Ba/Ca', 'C', 'Clay fraction', 'Color', 'd34S', 'd13C', 'd15N', 'd17O', 'd18O',
      'dD', 'Density', 'Diffuse spectral reflectance', 'Faunal', 'Fe/Ca', 'Floral', 'Grain size', 'Historic',
      'Layer thickness', 'Lead Isotope', 'Li/Ca', 'Lithics', 'Luminescence', 'Magnetic susceptibility', 'Mg/Ca',
      'Mineral matter', 'Mn/Ca', 'Moisture Content', 'N', 'Neodymium', 'Organic matter', 'P', 'Permeability',
      'Porosity', 'Radiocarbon', 'Resistivity', 'Sand fraction', 'Si', 'Silt fraction', 'Sr/Ca', 'TEX86', 'U-Th',
      'Uk37', 'X-Ray diffraction', 'X-ray fluorescence', 'Zn/Ca'];
    }),

    variableTypeList: (function(){
      return ["measured", "inferred"];
    }),

  }; // end return

}());
