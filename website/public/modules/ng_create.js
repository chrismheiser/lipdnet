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
          if(blockType === "measurement"){
            var _crumbs = "";
            _crumbs = pc + "0" + blockType;
          } else if (blockType === "summary"){
            _crumbs = pc + "0model0" + blockType;
          }
          // measurement tables
          if (blockType === "measurement"){
            entry["measurementTable"] = create.addTable(entry["measurementTable"], _crumbs);
          }
          // model tables
          else if (["summary", "ensemble", "distribution"].indexOf(blockType) !== -1){
            create.prepModelTable(entry, blockType, function(entry2){
              if (blockType === "summary"){
                entry2["model"][0]["summaryTable"] = create.addTable(entry2.model[0].summaryTable, _crumbs);
              } else if (blockType === "distribution"){
                entry2["model"][0]["distributionTable"] = create.addTable(entry2.model[0].distributionTable, _crumbs);
              } else if (blockType === "ensemble"){
                entry2["model"][0]["ensembleTable"] = create.addTable(entry2.model[0].ensembleTable, _crumbs);
              }
              return entry2;
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
       console.log("Error: create:addBlock: " + err);
      }
    }),

    addChronData :(function(entry, blockType){
      if(blockType === "measurement"){
        entry.chronData = [
          {"measurementTable": [{"tableName": "chron0measurement0", "filename": "chron0measurement0.csv"}]}];
      } else if (blockType === "summary"){
        entry.chronData = [
          {"model": [{"summaryTable": [{"tableName": "chron0model0summary0", "filename": "chron0model0summary0.csv"}], "method":{}}]}];
      }
      return entry;
    }),

    // addDataSetName: (function(_dsn, _csv){
    //   // Check if the datasetname is in the CSV filenames or not.
    //   for (var _key in _csv){
    //     if(_csv.hasOwnProperty(_key)){
    //       // if the datasetname exists in this csv file.
    //       if(_key.indexOf(_dsn) !== -1){
    //         // don't need to add a datasetname. We found it.
    //         return false;
    //       }
    //     }
    //   }
    //   // no datasetname found. We need to add them throughout the JSON data and _csv names.
    //   return true;
    // }),

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

    addTable: (function(entry, crumbs){
      try{
        if(typeof(entry)=== "undefined"){
          entry = [];
        }
        // Add a full data table to an entry.
        _tn = crumbs + entry.length;
        _csv = crumbs + entry.length + ".csv";
        entry.push({"tableName": _tn, "filename": _csv, "columns": []});
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

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param {Array} D Metadata
     * @param {Array} fields Field names (strings) to be added to columns
     * @return {Array} D Metadata, with new fields added
     */
    addFieldsToCols: (function(D, fields, cb){
      var _pcs = ["paleoData", "chronData"];

      // We don't need to add the root fields, because those are already standard.

      for (var _u=0; _u < _pcs.length; _u++){
        var _pc = _pcs[_u];
        if(D.hasOwnProperty(_pc)){
          var _section = D[_pc];
          for(var _s=0; _s < _section.length; _s++){
            if(_section[_s].hasOwnProperty("measurementTable")){
              D[_pc][_s]["measurementTable"] = create.addFieldsToTables(_section[_s]["measurementTable"], fields);
            }
            if(_section[_s].hasOwnProperty("model")){
              D[_pc][_s]["model"] = create.addFieldsToModels(_section[_s]["model"], fields);
            }
          }
        }
      }

      cb(D);
    }),

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param {Array} models Metadata
     * @param {Array} fields Field names (strings) to be added to columns
     * @return {Array} models Metadata
     */
    addFieldsToModels: (function(models, fields){
      for(var _p = 0; _p <models.length; _p++){
        var _model = models[_p];
        if (_model.hasOwnProperty("summaryTable")){
          models[_p]["summaryTable"] = create.addFieldsToTables(models[_p]["summaryTable"], fields);

        }
        if (_model.hasOwnProperty("ensembleTable")){
          models[_p]["ensembleTable"] = create.addFieldsToTables(models[_p]["ensembleTable"], fields);
        }
      }
      return(models);
    }),

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param {Array} tables Metadata
     * @param {Array} fields Field names (strings) to be added to columns
     * @return {Array} tables Metadata
     */
    addFieldsToTables: (function(tables, fields){
      for(var _t = 0; _t<tables.length; _t++){
        tables[_t] = create.addFieldsToTable(tables[_t], fields);
      }
      return(tables);
    }),

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param {Array} tables Metadata
     * @param {Array} fields Field names (strings) to be added to columns
     * @return {Array} tables Metadata
     */
    addFieldsToTable: (function(table, fields){
        var _columns = table["columns"];
        for(var _c = 0; _c < _columns.length; _c++){
          for (var _k = 0; _k < fields.length; _k++){
            var _key = fields[_k];
            if(!_columns[_c].hasOwnProperty(_key)){
              table["columns"][_c][_key] = "";
            }
          }
        }
      return(table);
    }),

    alterFilenames: (function(_scopeFiles){
      var _dsn = _scopeFiles.dataSetName;
      _scopeFiles.csv = create.alterCsvFilenames(_scopeFiles.csv, _dsn);
      _scopeFiles.json = create.alterJsonFilenames(_scopeFiles.json, _dsn);
      return _scopeFiles;
    }),

    alterCsvFilenames: (function(_csv, _dsn){
      var _csvCopy = {};
      // change all the csv filenames in the csv metadata
      for (var _key in _csv){
        if (_csv.hasOwnProperty(_key)){
          if(_key.indexOf(_dsn) === -1){
            _csvCopy[_dsn + "." + _key]  = _csv[_key];
          } else {
            _csvCopy[_key] = _csv[_key];
          }
        }
      }
      return(_csvCopy);
    }),

    alterJsonFilenames: (function(x, dsn){
      // Recursive: find any filename entries and append the datasetname to the front of it.

      // loop over this data structure
      for (var _key in x){
        // safety check: don't want prototype attributes
        if (x.hasOwnProperty(_key) && x[_key] !== undefined){
          // found a filename entry. change it.
          if(_key === "filename"){
            if(x[_key].indexOf(dsn) === -1) {
              x[_key] = dsn + "." + x[_key];
            }
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
      var _scopeFilesCopy = JSON.parse(JSON.stringify(_scopeFiles));
      // TODO copy the archiveType from the root, to each data table column
      _scopeFilesCopy.json = create.rmTmpEmptyData(_scopeFilesCopy.json);
      // Prepend DSN to CSV filenames wherever necessary. Do this for _csv metadata data and _json metadata.
      _scopeFilesCopy = create.alterFilenames(_scopeFilesCopy);
      return _scopeFilesCopy;
    }),

    closingWorkflowNoaa: (function(_scopeFiles, _dsn, _csv, cb){
      var _newScopeFiles = create.closingWorkflow(_scopeFiles, _dsn, _csv);
      var _newCsv = create.structureCsvForPy(_newScopeFiles.csv, _dsn);
      cb({"metadata": _newScopeFiles.json, "csvs": _newCsv});
    }),

    turnOffToggles: (function(_x, toggle_key){
      // Turn off all Toggles (recursive) beneath the given level.
      try{
        for (var _key in _x) {
          // safety check: don't want prototype attributes
          if (_x.hasOwnProperty(_key)) {
            // if this key is in the array of items to be removed, then remove it.
            if (_key === toggle_key) {
              // remove this key
              _x[_key] = false;
            } // if key in removables
            else if (_x[_key].constructor === [].constructor) {
              // value is an array. iterate over array and recursive call
              for (var _g = 0; _g < _x[_key].length; _g++) {
                // process, then return in place.
                _x[_key][_g] = create.turnOffToggles(_x[_key][_g], toggle_key);
              }
            } // if array
            else if (_x[_key].constructor === {}.constructor) {
              _x[_key] = create.turnOffToggles(_x[_key], toggle_key);
            } // if object
          } // hasownproperty
        }
      } catch (err){
        console.log(err);
      }
      return _x;
    }),

    getParsedCsvObj: (function(csv_name, csv_objs){
      var _csv_obj = {};
      var _found = false;

      // Loop over all the csv filenames
      for (var _filename in csv_objs){
        if(csv_objs.hasOwnProperty(_filename)){
          // Is this csv_name in the current filename?
          // (ie. is "paleo0measurement0.csv" within "Heiser2018.paleo0measurement0.csv". Yes. )
          if(_filename.indexOf(csv_name) !== -1){
            // Swap and use the new filename match
            csv_name = _filename;
            // Also get the object for this filename
            _csv_obj = csv_objs[_filename];
            _found = true;
          }
        }
      }

      // If a sub match wasn't found, then check for an exact match. (We prefer a sub-match)
      if(!_found){
        if(csv_objs.hasOwnProperty(csv_name)){
          _csv_obj = csv_objs[csv_name];
        }
      }

      return {"name": csv_name, "data": _csv_obj};
    }),


    initColumnTmp: (function(x){
      // Tmp Data throughout page:
      // Table level: {"tmp": {"toggle": bool, "parse": bool, "graphActive": bool}
      // Model Table Method: {"tmp": {"toggle": bool}}
      // Column Level: {"tmp": {"toggle": bool}}

      // when uploading a file, we need to add in the column property booleans for the "Add Properties" section of each
      // column. That way, an uploaded file that already has properties from our list will trigger the checkbox to be on.
      var _ignore = ["values", "variableName", "units", "number"];
      // loop over this data structure
      try{
        // Loop for n amount of unknown keys
        for (var _key in x){
          if (x.hasOwnProperty(_key) && x[_key] !== undefined){

            // Are we at table level? We'll know based on if columns are present.
            if(_key === "columns"){
              // X is currently a data table. Set the toggle
              x["tmp"] = {"toggle": false, "parse": true, "toggleGraph": false};
              // loop for each column
              for (var _v = 0; _v < x.columns.length; _v++){
                var _col = x.columns[_v];
                x.columns[_v].tmp = {"toggle": false, "toggleGraph": false, "toggleGraphDisabled": false};
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
            }

            // Is this a table? We need to add a temp object
            if (_key === "filename"){

            }

            // Check if this is a nested structure and we need to process deeper.
            if (x[_key].constructor === [].constructor && x[_key].length > 0) {
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
                entry.author = _auths;
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

    structureCsvForPy: (function(_csv, _dsn){
      var _newCsv = {};
      for(var _filename in _csv){
        if(_csv.hasOwnProperty(_filename)){
          _newCsv[_filename] = _csv[_filename]["transposed"];
        }
      }
      return _newCsv;
    }),

    updateCsvScope: (function(_scope_vals, _csv){

      if(Object.keys(_scope_vals).length === 0 && _scope_vals.constructor === Object){
        // No old data to update. The new data can be used as-is.
        return _csv;
      } else {
        // Theoretically, these should have the same number of rows, but if for some reason the new data has more rows,
        // then just use that instead.
        if (_scope_vals.rows <= _csv.rows) {
          _scope_vals.rows = _csv.rows;
        }
        // All the other metadata needs to be updated or replaced.
        _scope_vals.cols = _scope_vals.cols + _csv.cols;
        _scope_vals.errors = _scope_vals.errors.concat(_csv.errors);
        _scope_vals.meta = _csv.meta;
        _scope_vals.delimiter = _csv.delimiter;
        _scope_vals.transposed = _scope_vals.transposed.concat(_csv.transposed);
        // All data row arrays need to have the new columns concatenated onto the end.
        for(var _i = 0; _i < _scope_vals.data.length; _i++){
          _scope_vals.data[_i] = _scope_vals.data[_i].concat(_csv.data[_i]);
        }
      }
      // Our new scope data is finished and ready to replace the old scope.
      return _scope_vals;
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
      return ["proxy", "measurementMaterial", "method", "sensorSpecies", "sensorGenus", "variableType",
        "proxyObservationType", "notes", "inferredVariableType", "takenAtDepth"];
    }),

    fieldsList: (function(){
      return [
        { id: 1, name: "calibration"},
        { id: 2, name: "hasResolution"},
        { id: 3, name: "inferredVariableType"},
        { id: 4, name: "interpretation"},
        { id: 5, name: "measurementMaterial"},
        { id: 6, name: "method"},
        { id: 7, name: "notes"},
        { id: 8, name: "physicalSample"},
        { id: 9, name: "proxy"},
        { id: 10, name: "proxyObservationType"},
        { id: 11, name: "sensorGenus"},
        { id: 12, name: "sensorSpecies"},
        { id: 13, name: "takenAtDepth"},
        { id: 14, name: "variableType"},
      ]
    }),

    tourSteps: (function(){
      return [
        {
          element:document.querySelector(".step0"),
          intro: "Welcome to the Create LiPD page! This tour is designed to teach you the ins and outs of creating or " +
          "editing a LiPD file. We tried to make working with LiPD data as simple as possible, but some parts of the process " +
          "inevitably need more explanation. Don't forget to hover your mouse pointer on items throughout the page to see more hints. "
        },
        {
          // Map
          element: document.querySelector(".step1"),
          intro: "Use the map to verify the location for the dataset. A pin drops on the map using the coordinate data. Use the graph to plot a simple line graph with the values from your data tables."
        },
        {
          // Choose file button
          element: document.querySelector(".step2"),
          intro: "If you have a LiPD file you want to upload, you can do that here. If not, that's okay too! Use the fields to start building a LiPD file",
          position: 'right'
        },
        {
          // Validate button
          element: document.querySelector(".step3"),
          intro: 'LiPD files must abide by a set of standards for key names, data structure, minimum data thresholds, etc. to be considered a valid file. The validation process gives you feedback on how to make your data a valid LiPD file.',
          position: 'right'
        },
        {
          // Save Session button
          element: document.querySelector(".step4"),
          intro: "Need a break from your dataset? Did your internet connection disconnect? Save the session and come back later. Just don't close your internet browser! We'll offer to load an older session if we find one saved in the browser.",
          position: 'right'
        },
        {
          // Download lipd button
          element: document.querySelector(".step5"),
          intro: 'Download your validated data as a LiPD file to your local computer.',
          position: "right"
        },
        {
          // Download NOAA button
          element: document.querySelector(".step6"),
          intro: "Download your validated data as a NOAA template text file. Please note, one text file is created for every paleo measurement table in your dataset. A multi-file output is downloaded as a ZIP file.",
          position: "right"
        },
        {
          // NOAA ready, wiki ready switches
          element: document.querySelector(".step7"),
          intro: "The LinkedEarth Wiki and NOAA have additional data requirements to the LiPD requirements. Turning on these switches will add custom data input fields to the page and add rules to the validation process.",
          position: "right"
        },
        {
          // Feedback boxes
          element: document.querySelector(".step8"),
          intro: "Validation results. Every time you press the 'Validate' button, these boxes will show the results. Warnings are recommended fixes, but not required. Errors MUST be fixed.",
          position: "right"
        },
        {
          // Requirements boxes
          element: document.querySelector(".step9"),
          intro: "The requirements boxes give you feedback on how complete your dataset is and if you meet different levels of requirements. Hover your mouse pointer over each box to view specific requirements for each.",
          position: "right"
        },
        {
          // Files list
          element: document.querySelector(".step10"),
          intro: "All files ( .jsonld, .csv, .txt ) archived withing the LiPD file are listed here after upload. The filenames listed may be clicked to view the contents inside.",
          position: "right"
        },
        {
          // Root data - disabled fields and asterisks
          element: document.querySelector(".step11"),
          intro: "Fields with a dashed underline are disabled. If you see one, it is done intentionally to preserve standardization and the field will be automatically populated for you. Fields with an asterisk (*) are required fields.",
          position: "left"
        },
        {
          // NOAA Specific
          element: document.querySelector(".step12"),
          intro: "The section for NOAA specific data is hidden until you flip the switch for 'NOAA Ready (Beta)'",
          position: "left"
        },
        {
          // Funding - Multiple entry sections
          element: document.querySelector(".step13"),
          intro: "Sections with an 'Add+' button allow for multiple entries that expand and collapse. (You can try this during the tour!) Click '- Delete' to delete a specific entry. ",
          position: "left"
        },
        {
          // Publication
          element: document.querySelector(".step14"),
          intro: "'Autocomplete using DOI' is the important part of the publication section. When you enter a DOI (Digital Object Identifier) and click the button, we'll use doi.org to retrieve and fill the publication data for you as much as possible. Another note, we use BibJSON standards for publication data, which is why authors are stored as individual entries.",
          position: "left"
        },
        {
          // Geo
          element: document.querySelector(".step15"),
          intro: "LiPD stores coordinates as Decimal Degrees, but you may enter your coordinates in Degrees-Minutes-Seconds or Decimal Degrees. Use the switch to change modes. The other fields are standard. ",
          position: "left"
        },
        {
          // Paleo
          element: document.querySelector(".step16"),
          intro: "Use this section to build the columns of your data table. Enter the header row (where applicable) and column values ONLY. We recommend copying your data from a text file or spreadsheet, but entering data by hand works as well. (with one small exception noted in the next step)",
          position: "top"
        },
        {
          // Delimiter
          element: document.querySelector(".step17"),
          intro: "Choose the delimiter that matches what you see in the input box below. One exception: When copying data from a spreadsheet, the delimiter is 'Tab (\\t)'.",
          position: "right"
        },
        {
          // Parse Mode
          element: document.querySelector(".step18"),
          intro: "The parse box has multiple modes attached to it. Choose the one that fits your situation. 'Start New' builds a brand new table. 'Update' keeps all existing column metadata, and replaces all column values. 'Add' keeps all existing columns and adds the parsed values as new columns to the table  ",
          position: "right"
        },
        {
          // Header
          element: document.querySelector(".step19"),
          intro: "Header row data will parse into the 'variableName' field for each column. Please note, units will not be parsed from the header row.",
          position: "right"
        },
        {
          // Parse Values Box
          element: document.querySelector(".step20"),
          intro: "Here's an example of some data with a header line. This is what the data would look like if you copied it from a spreadsheet and it had a 'Tab' delimiter. Click 'Parse Values' to see how it creates columns in this table.",
          position: "top"
        },
        {
          // Add table dropdown and button
          element: document.querySelector(".step21"),
          intro: "Add a new data table to paleoData or chronData by choosing the table type from the dropdown menu and clicking '+ Add Table'. We're working to add support for more tables!",
          position: "top"
        },
        {
          // Delete Section buttons
          element: document.querySelector(".step22"),
          intro: "If you want to remove and ENTIRE paleoData section or chronData section, their respective 'Delete' buttons will do that. There's a confirmation box that asks you if you're sure before deleting the data.",
          position: "top"
        },
        {
          // chronData
          element: document.querySelector(".step23"),
          intro: "The chronData section is identical to everything you've seen in the paleoData section, so I'll skip this section of the page.",
          position: "top"
        },
        {
          element: document.querySelector(".step24"),
          intro: "That's it! There many different pieces to this page, but hopefully this tour has explained some of the initial questions and the process makes more sense.",
        },


      ]
    }),

    inferredVariableTypeList: (function(){
      return ['Temperature', 'Sea Surface Temperature', 'Bottom Water Temperature', 'Ocean Mixed Layer Temperature',
      'Surface air temperature', 'Carbon dioxide concentration', 'Methane concentration', 'Nitrous oxide concentration',
      'Free oxygen levels', 'pH', 'Carbonate saturation', 'Carbonate Ion Concentration', 'Salinity',
        'Precipitation Amount', 'd18O', 'dD', 'ExcessD', 'Moisture Content', 'PDSI', 'Year', 'JulianDay',
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

        if(typeof entry === "undefined"){
          entry = {};
        }
        if(entry.hasOwnProperty("model")){
          if(typeof entry["model"][0][blockType + "Table"] === "undefined"){
            entry["model"][0][blockType] = [];
          }
        }
        // model doesnt exist. create it
        else {
          entry["model"] = [{"summaryTable": [], "ensembleTable": [], "distributionTable": [], "method": {}}];
        }
        cb(entry);
      } catch(err){
        console.log("Error: create: prepModelTable: " + err);
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

    fieldMetadataLibrary: (function(section, key){
      var _tip = " ";
      var _lib = {
        "root": {
          "createdBy": {"tooltip": "Where did this file originate from? How was the LiPD file created?", "label": "Created By", "model": "files.json.createdBy", "disabled": false, "fieldType": "text", "size": 50},
          "lipdVersion": {"tooltip": "Ontology and data structure change by version. We'll handle this for you, but it's important to know the current version.", "label": "LiPD Version *", "model": "files.json.lipdVersion", "disabled": true, "fieldType": "number", "size": 50},
          "dataSetName": {"tooltip": "Please use the format 'Name.Location.Year' for your dataset name", "label": "Dataset Name *", "model": "files.json.dataSetName", "disabled": false, "fieldType": "text", "size": 50},
          "collectionName": {"tooltip": "NA", "label": "Collection Name", "model": "files.json.collectionName", "disabled": false, "fieldType": "text", "size": 33, },
          "investigators": {"tooltip": "Use the format: LastName, FirstName; LastName, FirstName; ...", "label": "Investigators", "model": "files.json.investigators", "disabled": false, "fieldType": "text", "size": 66, },
          "notes": {"tooltip": "Use to add information that does not fit elsewhere in the dataset", "label": "Notes", "model": "files.json.notes", "disabled": false, "fieldType": "text", "size": 100},
          "archiveType": { "tooltip": "Which ProxyArchive underlies this ProxySystem?", "label": "Archive Type", "model": "files.json.archiveType", "disabled": false, "size": 50},

        },
        "funding": {
          "agency": {"tooltip": "Which entity was the Dataset funded by?"},
          "grant": {"tooltip": "What was the Funding source for the Dataset?"},
          "principalInvestigator": {"tooltip": "Who was the lead on the source of Funding for the Dataset?"},
          "country": {"tooltip": "Which nation funded the Dataset?"}

        },
        "noaa": {
          "earliestYear" : {"tooltip": "NA"},
          "mostRecentYear" : {"tooltip": "NA"},
          "timeUnit": {"tooltip": "NA"},
          "onlineResource": {"tooltip": "NA"},
          "onlineResourceDescription": {"tooltip": "NA"},
          "originalSourceUrl": {"tooltip": "NA"},
          "modifiedDate": {"tooltip": "NA"},
          "datasetDOI": {"tooltip": "What is the digital object identifier associated with the dataset? Example: 10.1000/sample123"},
        },
        "pub": {
          "publication": {"tooltip": "A document that serves as reference for a Dataset or its components"},
          "doi": {"tooltip": "What is the digital object identifier associated with the resource?  Example: 10.1000/sample123"},
          "title": {"tooltip": "What is the title of the Publication?"},
          "journal": {"tooltip": "What is the name of the journal in which the resource can be found?"},
          "report": {"tooltip": "NA"},
          "year": {"tooltip": "What year was the Publication issued? (not required for dataCitations)"},
          "pages": {"tooltip": "In what pages of the Publication can the reference to the resource be found? (not required for dataCitations)"},
          "volume": {"tooltip": "In which volume of the Publication does the reference to the Datatset appear?"},
          "edition": {"tooltip": "In which edition of the Publication does the reference to the Datatset appear?"},
          "issue": {"tooltip": "In what issue of the journal can the resource be found?"},
          "type": {"tooltip": "What publication type? (journal-article, data citation, etc.)"},
          "abstract": {"tooltip": "NA"},
          "citation": {"tooltip": "NA"},
          "author": {"tooltip": "Who wrote (i.e., created) the resource, such as a Publication? Use format: LastName, FirstName"},
        },
        "geo": {
          "latitude": {"tooltip": "The latitude value in decimal degrees from -90 to 90"},
          "longitude": {"tooltip": "The longitude value in decimal degrees from -180 to 180"},
          "elevation": {"tooltip": "Elevation value in meters"},
          "units": {"tooltip": "Standard elevation units is meters"},
          "siteName": {"tooltip": "NA"},
          "location": {"tooltip": "NA"},
          "country" : {"tooltip": "ISO 3166 standard country list"},
          "gcmdLocation": {"tooltip": "Example: Continent>North America>United States of America>Baltimore"},

        },
        "paleoData": {
          "paleoData": {"tooltip": "The Data pertaining to past environmental variability"},
          "measurement": {"tooltip": "DataTable that contains the Variables (both measured and inferred)"},
          "model": {"tooltip": "Model used to derive an environmental axis from the PaleoDataModel"},
          "table": {"tooltip": "DataTable containing PaleoData Variables"},
          "values": {"tooltip": "What are the numerical values of the Variable, Uncertainty, and Model outputs?"},
          "variableName": {"tooltip": "NA"},
          "units": {"tooltip": "In what unit of measure is (are) the Variable(s) expressed?"},
          "description": {"tooltip": "What additional details would you give about the resource?"},
          "calibration": {"tooltip": "NA"},
          "hasResolution": {"tooltip": "What is the Resolution of the Variable?"},
          "hasMinValue": {"tooltip": "What is the minimum value of the Variable?"},
          "hasMaxValue": {"tooltip": "What is the maximum value of the Variable?"},
          "hasMeanValue": {"tooltip": "What is the mean value of the Variable?"},
          "hasMedianValue": {"tooltip": "What is the median value of the Variable?"},
          "inferredVariableType": {"tooltip": "What type of InferredVariable does the InferredVariable belongs to?"},
          "interpretation": {"tooltip": "A suite of metadata that describes which phenomena drove variability in this Variable (e.g. environmental drivers)."},
          "direction": {"tooltip": "Is the InferredVariable value increasing or decreasing as the value of the MeasuredVariable is increasing?"},
          "measurementMaterial": {"tooltip": "NA"},
          "method": {"tooltip": "How is the information obtained from the resource?"},
          "missingValue": {"tooltip": "How are the missing values of the Variable identified in the DataTable?"},
          "notes": {"tooltip": "Use to add information that does not fit elsewhere in the dataset"},
          "physicalSample": {"tooltip": "The actual sample on which the measurements are made. For instance, the lake core analyzed in the lab is the physical sample."},
          "proxy": {"tooltip": "NA"},
          "proxyObservationType": {"tooltip": "What type of ProxyObservation does the MeasuredVariable or Proxy System belong to? For example, the measured value of 5.63 mmol/mol is of type Mg/Ca, or the proxy observation of the current prpoxy system is Mg/Ca"},
          "sensorGenus": {"tooltip": "What is the Genus of the Organic ProxySensor?"},
          "sensorSpecies": {"tooltip": "What is the species of the Organic ProxySensor?"},
          "takenAtDepth": {"tooltip": "At which depth in the ProxyArchive is the Variable measured or inferred?"},
          "variableType": {"tooltip": "NA"},
          "name": {"tooltip": "NA"},
          "runCommand": {"tooltip": "NA"},
          "runEnv": {"tooltip": "NA"},
        },
        "chronData": {
          "chronData": {"tooltip": "The data, metadata, and Model that describe the set of Variables used to relate depth/position to time (chronological information)"},
          "measurement": {"tooltip": "DataTable that contains the Variables (both measured and inferred)"},
          "model": {"tooltip": "Model used to derive a time (or age) axis from the ChronDataModel"},
          "table": {"tooltip": "DataTable containing Variables pertaining to chronological information"},
        },
        "misc": {
          "editMode": {"tooltip": "Edit mode allows you to delete fields. Turn on to show delete buttons, and turn back off when done."},
          "addCustom": {"tooltip": "Don't see the field you want? Type in the box and press enter."},
          "addFields": {"tooltip": "Choose the field you would like to add to this column"},
          "fetchDoi": {"tooltip": "Provide a valid DOI and we'll fetch the associated publication information."},
          "map": {"tooltip": "We'll drop a pin on the dataset location using the coordinates given in the Geo section."},
          "graph": {"tooltip": "Use table data to plot two columns on a simply X,Y graph."}
        }
      };
      try{
        _tip = _lib[section][key].tooltip;
      } catch(err){
      }
      return _tip;
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
    }),

    getPopover: (function(name){
      var _popovers = {
        "lipd": '' +
        '<h5>LiPD Requirements</h5><br>' +
        '<p>Root Level:</p><ul>' +
        '<li>dataSetName</li>' +
        '<li>archiveType</li>' +
        '<li>createdBy</li>' +
        '</ul><br><p>Geo:</p><ul>' +
        '<li>coordinates</li>' +
        '</ul><br><p>paleoData:</p><ul>' +
        '<li>measurementTable</li>' +
        '</ul><br><p>Column Level:</p><ul>' +
        '<li>variableName</li>' +
        '<li>units ("unitless" if units not applicable)</li>' +
        '<li>values</li>' +
        '</ul>',
        "wiki": '' +
        '<h5>Linked Earth Wiki Requirements</h5><br>' +
        '<p>In addition to the normal LiPD Requirements: </p>' +
        '</ul><br><p>Column Level:</p><ul>' +
        '<li>proxyObservationType</li>' +
        '<li>variableType</li>' +
        '<li>takenAtDepth</li>' +
        '<li>inferredVariableType</li>' +
        '</ul>',
        "noaa": '' +
        '<h5>NOAA Requirements</h5><br>' +
        '<p>In addition to the normal LiPD Requirements: </p>' +
        '</ul><br><p>NOAA specific:</p><ul>' +
        '<li>maxYear</li>' +
        '<li>minYear</li>' +
        '<li>timeUnit</li>' +
        '<li>onlineResource</li>' +
        '<li>onlineResourceDescription</li>' +
        '<li>modifiedDate</li><br>' +
        '</ul><p>Root Level:</p><ul>' +
        '<li>investigators</li>' +
        '</ul><br><p>Geo:</p><ul>' +
        '<li>siteName</li>' +
        '<li>location</li>' +
        '</ul><br><p>Column Level:</p><ul>' +
        '<li>description</li>' +
        '<li>dataFormat</li>' +
        '<li>dataType</li>'
      };

      return _popovers[name];

    }),

  }; // end return

}());
