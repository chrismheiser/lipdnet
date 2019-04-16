var create = (function(){

  return {

    /**
       * Add an author entry to the author array
       *
       * @param   {Array}   The author data array
       * @return  {Array}   The author data array
       */
    addAuthor: (function(entry){
      // The only field within an author entry is "name"
      var _block = {"name": ""};
      // Add the new author entry to the author data array
      entry.push(_block);
      return entry;
    }),

    /**
     *
     * Add an entry to any field that supports multiple entries. Acceptable fields are listed below.
     *
     * Block Types: measurement, summary, ensemble, distribution, funding, pub, author, column, geo, onlineResource
     *
     * called by : ngContValidate.js > addBlock()
     *
     * @param    {Object}  entry      Any type of data block that allows multiple entries.
     * @param    {String}  blockType  Acceptable blockTypes are listed above.
     * @param    {String}  pc         Mode: paleo or chron or null
     * @return   {Object}  entry      Any type of data block that allows multiple entries.
     */
    addBlock: (function(entry, blockType, pc){
      try{
        // Is this a data table entry?
        if(pc !== null){
          // If the table type is measurement or summary, build the crumbs path. For other tables, we'll do it later.
          if(blockType === "measurement"){
            var _crumbs = "";
            _crumbs = pc + "0" + blockType;
          } else if (blockType === "summary"){
            _crumbs = pc + "0model0" + blockType;
          }

          // Measurement tables
          if (blockType === "measurement"){
            entry["measurementTable"] = create.addTable(entry["measurementTable"], _crumbs);
          }
          // Model tables
          else if (["summary", "ensemble", "distribution"].indexOf(blockType) !== -1){
            create.addModelTable(entry, blockType, function(entry2){
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
          // This data is not a data table, so add the data according to the field (blockType)
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
          } else if (blockType === "onlineResource"){
            entry = create.addOnlineResource(entry);
          }

        }
        // Return the entry that now has an extra data block.
        return entry;
      } catch (err){
       console.log("Error: create:addBlock: " + err);
      }
    }),

    /**
       * Add a table to chronData. The chronData structure is not initialized when creating a new file from scratch
       * because it is not required data. If a user adds chronData, we need to come here to initialize the structure
       * on the first table. All subsequent tables will not need this step. Also, paleoData tables do NOT have this
       * process because it is required data and the structure is initialized on page load.
       *
       * Block Types : measurement, summary,
       *
       * @param  {Object}    entry      LiPD Metadata
       * @param  {String}    blockType  Acceptable blockTypes are listed above.
       *
       */
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

    /**
       * Add a funding entry to the funding array
       *
       * @param   {Array}   The funding data array
       * @return  {Array}   The funding data array
       */
    addFunding: (function(entry){
        // These are the basic fields for a funding entry.
      var _block = {"agency": "", "grant": "", "investigator": "", "country": ""};
      if (!entry){
        entry = [];
      }
      // Add the new funding entry to the funding data array
      entry.push(_block);
      return entry;
    }),

    /**
       * Add an online resource entry to the online resource array
       *
       * @param   {Array}   The online resource data array
       * @return  {Array}   The online resource data array
       */
    addOnlineResource: (function(entry){
        // These are the basic fields for an online resource entry
        var _block = {"onlineResource": "", "onlineResourceDescription": ""};
        // Add the new online resource entry to the online resource array.
        entry.push(_block);
        return entry;
    }),

    /**
       * Add a publication entry to the publication array.
       *
       * @param    {Array}  entry      The publication data array
       * @return   {Array}  entry      The publication data array (with new entry)
       */
    addPublication: (function(entry){
      // These are the basic fields for a publication entry
      var _block = {"identifier": [{ "type": "doi", "id": "", "url": "" }], "title": "", "year":"", "journal": "",
                  "issue":"", "edition": "", "volume":"", "author": [{"name": ""}] };
      // Add the new publication entry to the publication data array
      entry.push(_block);
      return entry;
    }),

    /**
     * Add or remove the given field to the metadata entry.
     *
     * @param    {Object}  entry      Any type of data block that allows multiple entries.
     * @param    {Object}  field      The name of the field being added or removed
     * @return   {Object}  entry      Any type of data block that allows multiple entries.
     */
    addRmProperty: (function(entry, field){
      try{
        // Remove the field
        if (entry.hasOwnProperty(field)){
          //  If the field currently exists, delete the data
          delete entry[field];
        }
        // Add the field
        else {
          // If the field doesn't exist yet, add the field.
          entry[field] = "";
        }
      } catch(err) {
        console.log("create: addRemoveField: " + err);
      }
      return entry;
    }),

    /**
       *  Add a table to the given data table array.
       *
       * @param     {Array}   entry    Data tables
       * @param     {String}  crumbs   Crumbs that create the path to this table
       * @return    {Array}   entry    Data tables (with the new data table entry)
       */
    addTable: (function(entry, crumbs){
      try{
        if(typeof(entry)=== "undefined"){
          entry = [];
        }
        // Table name = crumbs + table index number
        var _tn = crumbs + entry.length;
        // Csv filename = crumbs + table index number + file extension
        var _csv = crumbs + entry.length + ".csv";
        // Push the new data table object onto the data table arrays.
        entry.push({"tableName": _tn, "filename": _csv, "columns": []});
        // Return the table array
        return entry;
      } catch(err){
        console.log("addTable: " + err);
        console.log(entry);
      }
    }),

    /**
     * Add a data table column to the columns array.
     *
     * @param  {Array}  columns  Data table columns
     * @return {Array}  columns  Data table columns (with a new column added)
     */
    addTableColumn: (function(columns){
      // Our new column number is one higher than the amount of columns we currently have.
      var _number = columns.length + 1;
      // These are the basic fields for a new data column
      var _column = {"number": _number,"variableName": "", "description": "", "units": "", "values": ""};
      // Push the new column onto the columns array
      columns.push(_column);
      // Return the columns array
      return columns;
    }),

    /**
     * Add the required column keys to each column if they don't exist.
     *
     * @param   {Array} D      Metadata
     * @param   {Array} fields Field names (strings) to be added to columns
     * @return  {Array} D      Metadata (with new fields added)
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
     * @param   {Array} models    Metadata
     * @param   {Array} fields    Field names (strings) to be added to columns
     * @return  {Array} models    Metadata
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
     * @param   {Array} tables  Metadata
     * @param   {Array} fields  Field names (strings) to be added to columns
     * @return  {Array} tables  Metadata
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
     * @param   {Array} tables   Metadata
     * @param   {Array} fields   Field names (strings) to be added to columns
     * @return  {Array} tables   Metadata
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

    /**
     * Standardize all csv filenames. Filenames are sometimes changed arbitrarily by users or have names that don't
     * match the filenames noted in the metadata. This function standardizes all filenames to match the format below.
     *
     * Format :  Dataset Name  + crumbs  + file extension
     * Example:  Smith.paleo0measurement0.csv
     *
     * @param   {Object}  _scopeFiles   $scope.files data from the ngContValidate.js > ValidateCtrl controller
     * @return  {Object}  _scopeFiles   $scope.files data from the ngContValidate.js > ValidateCtrl controller
     */
    alterFilenames: (function(_scopeFiles){
      var _dsn = _scopeFiles.dataSetName;
      // Standardize all the filenames in the scope csv data.
      _scopeFiles.csv = create.alterCsvFilenames(_scopeFiles.csv, _dsn);
      // Standardize all the filenames in the metadata table entries.
      _scopeFiles.json = create.alterJsonFilenames(_scopeFiles.json, _dsn);
      return _scopeFiles;
    }),

    /**
     * Standardize the filenames within the csv scope data. These filenames will match the respective filenames
     * listed in the json metadata for each table.
     *
     * @param    {Object}  _csv      Csv data sorted by filename
     * @param    {String}  _dsn      Dataset name
     * @return   {Object}  _csvCopy  Csv data sorted by filename, using standardized filenames
     */
    alterCsvFilenames: (function(_csv, _dsn){
      // Instead of replacing the filenames in place, we'll put the new filenames with the data into a new object.
      var _csvCopy = {};
      // Loop for each file (table) in the csv data
      for (var _key in _csv){
        if (_csv.hasOwnProperty(_key)){
          // No datasetname in this filename. Place the data into csvCopy under the new filename.
          if(_key.indexOf(_dsn) === -1){
            // Reassign the csv data under the new filename.
            _csvCopy[_dsn + "." + _key]  = _csv[_key];
          } else {
            // Don't do anything. Place the filename and data into the csvCopy as-is
            _csvCopy[_key] = _csv[_key];
          }
        }
      }
      // Return the csvCopy, that has standardized filenames.
      return _csvCopy;
    }),

    /**
     * Standardize the filenames within the jsonld scope metadata. These filenames will match the respective filenames
     * listed in the csv scope data.
     *
     * Recursive: find any filename entries and prefix it with the dataSetName (dsn)
     *
     * @param    {*}       _x        Any data type, metadata
     * @param    {String}  _dsn      Dataset name
     * @return   {*}       _x        Any data type, metadata
     */
    alterJsonFilenames: (function(x, dsn){
      // Loop over each entry in object
      for (var _key in x){
        // Safety check. Make sure data is valid.
        if (x.hasOwnProperty(_key) && x[_key] !== undefined){
          // Found a filename field.
          if(_key === "filename"){
            // Does the filename have the datasetname in it?
            if(x[_key].indexOf(dsn) === -1) {
              // Standardize the filename by prefixing the dataset name
              x[_key] = dsn + "." + x[_key];
            }
          } else if (x[_key].constructor === [].constructor && x[_key].length > 0) {
            // Data type is an Array and the value is NOT blank or empty. Iterate over array.
            for (var _g=0; _g < x[_key].length; _g++){
              // Dive down with every Array entry.
              x[_key][_g] = create.alterJsonFilenames(x[_key][_g], dsn);
            }
          } else if (x[_key].constructor === {}.constructor && x[_key].length > 0){
            // Data is an object and the value is NOT blank or empty. Dive down.
            x[_key] = create.alterJsonFilenames(x[_key], dsn);
          }
        }
      }
      // Bubble up
      return x;
    }),

    /**
     * Make some final touches to the metadata before sending data to the backend for downloading.
     *
     * @param   {Object}  _scopeFiles      $scope.files data from the ngContValidate.js > ValidateCtrl controller
     * @return  {Object}  _scopeFilesCopy  $scope.files data from the ngContValidate.js > ValidateCtrl controller
     *
     */
    closingWorkflow: (function(_scopeFiles){
      // Create a copy of the object, so we don't affect the original scope data.
      var _scopeFilesCopy = JSON.parse(JSON.stringify(_scopeFiles));
      // TODO copy the archiveType from the root, to each data table column
      // Remove temporary lipd.net fields from the jsonld metadata
      _scopeFilesCopy.json = create.rmTmpEmptyData(_scopeFilesCopy.json);

      return _scopeFilesCopy;
    }),

    /**
     * Make some final touches to the metadata before sending data to the backend for downloading.
     *
     * NOAA: The closing workflow is different for NOAA downloads because we have to prep the csv data in a certain
     * format so it'll be compatible with the python conversion script.
     *
     * @param     {Object}  _scopeFiles      $scope.files data from the ngContValidate.js > ValidateCtrl controller
     * @param     {String}  _dsn             Dataset name
     * @param     {Object}  _csv             Csv data, sorted by filename
     * @callback  {Object}                   $scope.files data  and csv data
     *
     */
    closingWorkflowNoaa: (function(_scopeFiles, _dsn, _csv, cb){
      // Call the normal closing workflow that removes empty and temporary data
      var _newScopeFiles = create.closingWorkflow(_scopeFiles, _dsn, _csv);
      // Structure the csv data for the python conversion script
      var _newCsv = create.structureCsvForPy(_newScopeFiles.csv);
      // Callback with the formatted data
      cb({"metadata": _newScopeFiles.json, "csvs": _newCsv});
    }),

    /**
     * Recursive: Turn off all view toggles (that control the expansion and collapse of different views) found within
     * the data given. This is done right before expanding a view so that only one view is open at a time
     *
     * @param  {*}        _x          Any data type
     * @param  {String}   toggle_key
     * @return {*}        _x          Any data type
     */
    turnOffToggles: (function(_x, toggle_key){
      try{
        for (var _key in _x) {
          // Safety check, item must be valid
          if (_x.hasOwnProperty(_key)) {
            // Skip null values
            if(_x[_key]){
                // Key matches one of the keys that we want to remove
                if (_key === toggle_key) {
                    // Remove the key
                    _x[_key] = false;
                }
                // Array data type
                else if (_x[_key].constructor === [].constructor) {
                    // Loop over each item in the array
                    for (var _g = 0; _g < _x[_key].length; _g++) {
                        // Dive down for this array entry
                        _x[_key][_g] = create.turnOffToggles(_x[_key][_g], toggle_key);
                    }
                }
                // Object data type
                else if (_x[_key].constructor === {}.constructor) {
                    // Dive down for this object
                    _x[_key] = create.turnOffToggles(_x[_key], toggle_key);
                }
            }
          }
        }
      } catch (err){
        console.log(err);
      }
      // Bubble up
      return _x;
    }),

    /**
     * Get the csv data matching the given filename. Use the complete csv data from the controller scope, and find
     * either a csv_name that matches a portion of the filename, or is an exact match to the filename.
     *
     * Two cases:
     * When creating from scratch, the dataset name isn't added to the filename until the closing download workflow.
     * When a file is uploaded, the dataset name will be present.
     *
     * Example csv_name : paleo0measurement0.csv
     * Example _filename : Smith2018.paleo0measurement0.csv
     *
     * Called by : ngContValidate.js  > parseCsv()
     *
     * @param    {String}  csv_name    Filename that matches the data that we want
     * @param    {Object}  _csv        All csv data, sorted by filename
     * @return   {Object}              The filename and data that matched our search
     */
    getParsedCsvObj: (function(csv_name, _csv){
      var _csv_obj = {};
      var _found = false;

      // Loop over all the csv filenames
      for (var _filename in _csv){
        if(_csv.hasOwnProperty(_filename)){
          // Is this csv_name in the current filename?
          // (ie. is "paleo0measurement0.csv" within "Heiser2018.paleo0measurement0.csv"... In this example, Yes)
          if(_filename.indexOf(csv_name) !== -1){
            // Swap and use the new filename match
            csv_name = _filename;
            // Also get the object for this filename
            _csv_obj = _csv[_filename];
            _found = true;
          }
        }
      }

      // If a sub match wasn't found, then check for an exact match. (We prefer a sub-match in case the filename isn't
      // standardized yet)
      if(!_found){
        if(_csv.hasOwnProperty(csv_name)){
          _csv_obj = _csv[csv_name];
        }
      }

      // Return the requested data and the filename that matches it.
      return {"name": csv_name, "data": _csv_obj};
    }),

    /**
     *
     * Recursive: Go through all the LiPD metadata and add in the temporary variables that run the page views. Done
     * for uploaded files.
     *
     * Temporary data throughout  the lipd.net playground page:
     * Table level: {"tmp": {"toggle": bool, "parse": bool, "graphActive": bool}
     * Model Table Method: {"tmp": {"toggle": bool}}
     * Column Level: {"tmp": {"toggle": bool}}
     *
     * @param    {*}  x   Any data type
     * @return   {*}  x   Any data type
     */
    initColumnTmp: (function(x){
      // When uploading a file, we need to add in the column property booleans for the "Add Properties" section of each
      // column. That way, an uploaded file that already has properties from our list will trigger the checkbox to be on.
      var _ignore = ["values", "variableName", "units", "number"];
      // loop over this data structure
      try{
        // Loop for n amount of unknown keys
        for (var _key in x){
          if (x.hasOwnProperty(_key) && x[_key] !== undefined){

            // Are we at table level? We'll know based on if columns are present.
            if(_key === "columns"){
              x["tmp"] = {};
              // X is currently a data table. Set the toggle
              x["tmp"] = {"toggle": false, "parse": true, "toggleGraph": false};
              // loop for each column
              for (var _v = 0; _v < x.columns.length; _v++){
                var _col = x.columns[_v];
                // Create the tmp object in each column
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

            if(x[_key]){
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
        }
      } catch (err){
        console.log(err);
      }
      return x;
    }),

    /**
     * When a LiPD file is uploaded, it needs an Array for these fields. Empty or not. If missing, put in empty arrays.
     *
     * @param   {Object}   x   LiPD metadata  (full)
     * @return  {Object}   x   LiPD metadata  (full)
     */
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

    /**
     * Add a model table to the given entry. This can be any of the 3 valid table types.
     *
     * @param    {Object}    entry       A data entry from paleoData or chronData  (ie. paleoData[1])
     * @param    {String}    tableType   summary, ensemble, or distribution
     * @callback {Callback}  cb          Go back to addBlock()
     */
    addModelTable: (function(entry, tableType, cb){
        try{
            // This data entry does not exist yet. Create the entry to start.
            if(typeof entry === "undefined"){
                entry = {};
            }
            // This entry does not have a model in it yet. Create one.
            if(entry.hasOwnProperty("model")){
                if(typeof entry["model"][0][tableType + "Table"] === "undefined"){
                    entry["model"][0][tableType] = [];
                }
            }
            // Model entry doesn't exist. Create it.
            else {
                // Add a model that includes all the tables, but leave them blank.
                entry["model"] = [{"summaryTable": [], "ensembleTable": [], "distributionTable": [], "method": {}}];
            }
            // Callback with the entry.
            cb(entry);
        } catch(err){
            console.log("Error: create: prepModelTable: " + err);
            console.log(entry);
        }
    }),

    /**
     * Remove the temporary variables (toggle, column values) that were added when creating the page.
     * These cannot end up in the final LiPD file because they are clutter and only useful to the LiPD playground view.
     *
     * @param  {Object}   x   LiPD metadata
     * @return {Object}   x   LiPD metadata (without tmp data)
     */
    rmTmpEmptyData: (function(x){
      // All fields that should be deleted
      var _removables = ["toggle", "values", "tmp", "showColumn"];
      try{
        for (var _key in x){
          // safety check: don't want prototype attributes
          if (x.hasOwnProperty(_key)){
            if(x[_key]){

              // To prevent 'null' elevation coordinate from being left in the metadata. Causes readLipd issues.
              if(_key === "coordinates"){
                if(x[_key].length === 3){
                  if(x[_key][2] === "null" || x[_key][2] === null){
                    x[_key].pop();
                  }
                }
              }
              else if (typeof(x[_key]) === "string" && !x[_key]){
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
            }
          } // hasownproperty
        } // for key in object
      } catch (err){
        console.log(err);
      }
      // Metadata without tmp data
      return x;
    }),

    /**
       * Remove the data block at the given index for the given array.
       *
       * @param  {Array}  entry   Array that can have multiple entries (ie. pub, funding, authors)
       * @param  {Number} idx     Index to delete from array
       * @return {Array}  entry   Array, with the index deleted
       */
    rmBlock: (function(entry, idx){
      if (idx > -1) {
          entry.splice(idx, 1);
      }
      return entry;
    }),

    /**
     * Scrape relevant data from the doi.org response object and put it into our publication entry.
     *
     * @param  {Object}  res     Data response from the doi.org API request
     * @param  {Object}  entry   Publication metadata (one entry)
     * @return {Object}  entry   Publication metadata (one entry, with doi data)
     */
    sortDoiResponse: (function(res, entry){
      // Map our publication keys to the doi.org keys.
      var _keys = {
        "citation": "citation",
        "published-print": "year",
        "container-title": "journal",
        "author": "authors",
        "publisher": "publisher",
        "title": "title",
        "type": "type",
        "volume": "volume",
        "issue": "issue",
        "page": "pages",
        "abstract": "abstract"
      };
      // Loop for each key in the mapping
      for (var _key in _keys) {
        try{
          // Does the response object have this data?
          if (_keys.hasOwnProperty(_key) && res.data.hasOwnProperty(_key)) {
            if (res.data[_key]){
              // Special case for the created date. It's formatted differently than we want.
              if (_key === "published-print"){
                // get the year from the created attribute
                entry.year = res.data['published-print']["date-parts"][0][0];
              }
              // Special case for author names. It's separated by 'given' and 'family' names. We don't need that.
              else if (_key === "author"){
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
              }
              // Normal case: All other keys
              else {
                // Set the data directly using our key name.
                entry[_keys[_key]] = res.data[_key];
              }
            }
          }
        } catch(err){
          console.log(err);
        }
      }
      // Return the publication entry with the doi.org data included.
      return entry;
    }),

    /**
       * When passing data to our python NOAA conversion process, we need the csv data to be in column format. In the
       * playground, table values are stored row-by-row. However, in for python we want the "transposed" version of the
       * data which stores data column-by-column.
       *
       * @param   {Object}  _csv        All csv data, sorted by filename
       * @return  {Object}  _newCsv     Csv data, sorted by filename, but only including the transposed data.
       */
    structureCsvForPy: (function(_csv){
      // Create new object
      var _newCsv = {};
      // Loop for each table
      for(var _filename in _csv){
        if(_csv.hasOwnProperty(_filename)){
          // Set the transposed data into the object by filename
          _newCsv[_filename] = _csv[_filename]["transposed"];
        }
      }
      // Return the data.
      return _newCsv;
    }),

    /**
     * Used to update the csv data in the controller scope when a new column of data is added to an existing data table.
     * This is only used on the old parser method (NOT the spreadsheet method).
     *
     * @param   {Object}  _scope_vals  One table of values, taken from the csv data in the controller scope.
     * @param   {Object}  _csv         A parsed object using the PapaParse module. One column of values with metadata.
     * @return  {Object}  _scope_vals  One table of values, taken from the csv data in the controller scope.
     */
    updateCsvScope: (function(_scope_vals, _csv){

      // Check for an empty object. If empty, then there's no data to update.
      if(Object.keys(_scope_vals).length === 0 && _scope_vals.constructor === Object){
        // No old data to update. The new data can be used as-is.
        return _csv;
      }
      // There is new data
      else {
        // Theoretically, these should have the same number of rows because all tables should have columns of equal
        // lengths. If for some reason the new data has more rows, then we will use that since it's the larger number.
        if (_scope_vals.rows <= _csv.rows) {
          _scope_vals.rows = _csv.rows;
        }
        // All the other metadata needs to be updated or replaced.
        _scope_vals.cols = _scope_vals.cols + _csv.cols;
        _scope_vals.errors = _scope_vals.errors.concat(_csv.errors);
        _scope_vals.meta = _csv.meta;
        // Delimiter may be the same or different. We'll use the delimiter given on the most recent parse.
        _scope_vals.delimiter = _csv.delimiter;
        // Transposed data is easy. Concat the new column to the old columns.
        _scope_vals.transposed = _scope_vals.transposed.concat(_csv.transposed);
        // Row data is All data row arrays need to have the new columns concatenated onto the end.
        for(var _i = 0; _i < _scope_vals.data.length; _i++){
          _scope_vals.data[_i] = _scope_vals.data[_i].concat(_csv.data[_i]);
        }
      }
      // Our new scope data is finished and ready to replace the old scope.
      return _scope_vals;
    }),

    // STORED DATA LISTS -----

    /**
     *  Archive Type controlled vocabulary. These are the options allowed for the archiveType field.
     */
    archiveTypeList: (function() {
        return ["coral", "document", "glacier ice", "hybrid", "lake sediment", "marine sediment", "mollusks shells",
            "peat", "rock", "sclerosponge", "speleothem", "wood"];
    }),

    /**
     *  CreatedBy tracks the origin of the data for development purposes. We want to know where it was created in case
     *  there are issues with the file structure, keys, etc. This gives us a starting point for debugging.
     */
    createdByList: (function(){
      return ["lipd.net", "wiki", "matlab", "python", "unknown"];
    }),

    /**
     *  The default column fields are fields that have appear in the auto-complete input when adding fields to a column.
     *
     *  Called by : ngContValidate > $scope.dropdowns.columnFields
     */
    defaultColumnFields: (function(){
      return ["proxy", "measurementMaterial", "method", "sensorSpecies", "sensorGenus", "variableType",
        "proxyObservationType", "notes", "inferredVariableType", "takenAtDepth"];
    }),

    /**
     * Field list. These are all the fields that
     *
     * NOT CURRENTLY IN USE
     * Called by : ngContValidate > $scope.fields.
     *
     */
    fieldsList: (function(){
      return [ "calibration", "hasResolution", "inferredVariableType", "interpretation", "measurementMaterial",
          "method", "notes", "physicalSample", "proxy", "proxyObservationType", "sensorGenus", "sensorSpecies",
          "takenAtDepth", "variableType"
      ];
    }),

    /**
     * Snapshot of the Wiki ontology data. Use if our real-time requests aren't working.
     * Last updated : 12.18.18
     *
     * @return  {Object}    Wiki ontology data
     */
    getOntologyBackup:(function(){
        return {
            "inferredVariableType": [
                "d18o",
                "uncertainty temperature",
                "temperature1",
                "temperature2",
                "temperature3",
                "uncertainty temperature1",
                "thermocline temperature",
                "sedimentation rate",
                "relative sea level",
                "sea surface salinity",
                "accumulation rate",
                "mean accumulation rate",
                "accumulation rate, total organic carbon",
                "accumulation rate, calcium carbonate",
                "sampledata",
                "subsurface temperature",
                "Radiocarbon age",
                "Sea surface temperature",
                "Carbonate ion concentration",
                "Year",
                "Temperature",
                "Salinity",
                "Age"
            ],
            "archiveType": [
                "borehole",
                "bivalve",
                "documents",
                "molluskshell",
                "lake",
                "Hybrid",
                "Tree",
                "Coral",
                "Marine sediment",
                "Wood",
                "Lake sediment",
                "Sclerosponge",
                "Glacier ice",
                "Rock",
                "Speleothem"
            ],
            "proxyObservationType": [
                "diffusespectralreflectance",
                "julianday",
                "d18o",
                "trw",
                "dust",
                "chloride",
                "sulfate",
                "nitrate",
                "depth",
                "mg",
                "x-rayfluorescence",
                "dd",
                "ghostmeasured",
                "trsgi",
                "mg ca",
                "samplecount",
                "segment",
                "ringwidth",
                "residual",
                "ars",
                "corrs",
                "rbar",
                "sd",
                "se",
                "eps",
                "core",
                "uk37prime",
                "upper95",
                "lower95",
                "year old",
                "thickness",
                "na",
                "deltadensity",
                "blueintensity",
                "varvethickness",
                "reconstructed",
                "agemin",
                "agemax",
                "sampleid",
                "depth top",
                "depth bottom",
                "r650 700",
                "r570 630",
                "r660 670",
                "rabd660 670",
                "watercontent",
                "c n",
                "bsi",
                "mxd",
                "effectivemoisture",
                "pollen",
                "unnamed",
                "sr ca",
                "calcification1",
                "calcification2",
                "calcification3",
                "calcificationrate",
                "composite",
                "calcification4",
                "notes1",
                "calcification5",
                "calcification",
                "calcification6",
                "calcification7",
                "trsgi1",
                "trsgi2",
                "trsgi3",
                "trsgi4",
                "iceaccumulation",
                "f",
                "cl",
                "ammonium",
                "k",
                "ca",
                "duration",
                "hindex",
                "varveproperty",
                "x radiograph dark layer",
                "d18o1",
                "sedaccumulation",
                "massacum",
                "melt",
                "sampledensity",
                "37:2alkenoneconcentration",
                "alkenoneconcentration",
                "alkenoneabundance",
                "bit",
                "238u",
                "distance",
                "232th",
                "230th/232th",
                "d234u",
                "230th/238u",
                "230th age uncorrected",
                "230th age corrected",
                "d234u initial",
                "totalorganiccarbon",
                "cdgt",
                "c/n",
                "caco3",
                "pollencount",
                "drybulkdensity",
                "37:3alkenoneconcentration",
                "min sample",
                "max sample",
                "age uncertainty",
                "is date used original model",
                "238u content",
                "238u uncertainty",
                "232th content",
                "232th uncertainty",
                "230th 232th ratio",
                "230th 232th ratio uncertainty",
                "230th 238u activity",
                "230th 238u activity uncertainty",
                "decay constants used",
                "corrected age",
                "corrected age unceratainty",
                "modern reference",
                "al",
                "s",
                "ti",
                "mn",
                "fe",
                "rb",
                "sr",
                "zr",
                "ag",
                "sn",
                "te",
                "ba",
                "numberofobservations",
                "total organic carbon",
                "bsio2",
                "calciumcarbonate",
                "wetbulkdensity",
                "Diffuse spectral reflectance",
                "N",
                "C",
                "P",
                "Mn/Ca",
                "B/Ca",
                "notes",
                "Precipitation",
                "Reflectance",
                "Sr/Ca",
                "d13C",
                "Ba/Ca",
                "Density",
                "Al/Ca",
                "Floral",
                "Zn/Ca",
                "Mg/Ca",
                "Radiocarbon",
                "Si",
                "Uk37",
                "TEX86",
                "Age"
            ],
            "units": [
                "ad",
                "year ce",
                "year ad",
                "mm",
                "kyr bp",
                "yr",
                "bp",
                "kyr",
                "yrs bp",
                "kabp",
                "yrs",
                "yr bp",
                "Year"
            ]
        };
    }),

    /**
     *  Playground page Tour: these steps are given to the intro.js module to create an step-by-step tour of different
     *  sections of the playground page. Each step is linked to a portion of the page via an element from the DOM.
     *  Write a short description about the piece, and then align it to a 'position' if desired.
     */
    tourSteps: (function(){
      return [
        {
          element:document.querySelector(".step0"),
          intro: "Welcome to the Create LiPD page! This tour is designed to teach you the ins and outs of creating or " +
          "editing a LiPD file. We tried to make working with LiPD data as simple as possible, but some parts of the process " +
          "inevitably need more explanation. Don't forget to hover your mouse pointer on items throughout the page to see more hints. "
        },
        {
          element:document.querySelector(".tourbanner"),
          intro: "The Playground is regularly updated to correct bugs, add features, and make your experience better. Occasionally, there will be a banner at the top of the page to notify you of a recent change or other important information."

        },
        {
          // Map
          element: document.querySelector(".step1"),
          intro: "Use the map to verify the location for the dataset. A pin drops on the map using the coordinate data. Use the graph to plot a simple line graph with the values from your data tables.",
          position: "bottom"
        },
        {
            element: document.querySelector(".tourgithub"),
            intro: "Help us make your experience better! Let us know what you think is done well, and what we can do better. This link will take you to the LiPD Github page where we track issues and comments about the website.",
        },
        {
          // Choose file button
          element: document.querySelector(".step2"),
          intro: "If you have a LiPD file you want to upload, you can do that here. If not, that's okay too! Use the fields to start building your dataset.",
          position: 'right'
        },
        {
          // Validate button
          element: document.querySelector(".step3"),
          intro: 'LiPD files must abide by a set of standards to be considered a valid file. Standards for data structure, field names, and controlled vocabulary are verified. The validation process gives you feedback on how to alter your dataset to meet these standards.',
          position: 'right'
        },
        {
          // Save Session button
          element: document.querySelector(".step4"),
          intro: "If you've spent considerable time working on your dataset, but it's not quite ready to download, please save the session! The data will be saved to your internet browser for as long as you keep the browser window open.  We'll offer to load a saved session if there is one available when you return to the Playground page. You may only save one session at a time.",
          position: 'right'
        },
        {
          // Download lipd button
          element: document.querySelector(".stepdllipd"),
          intro: 'Download your validated dataset as a LiPD file to your computer.',
          position: "right"
        },
        {
          // Download NOAA button
          element: document.querySelector(".stepdlnoaa"),
          intro: "Download your validated dataset as a NOAA template text file. Please note, one text file is created for every paleo measurement table in your dataset. A multi-file output is downloaded as a ZIP file.",
          position: "right"
        },
        {
            // Upload to Wiki button
            element: document.querySelector(".stepwikiupload"),
            intro: "Upload your validate dataset to the LinkedEarth Wiki. Must be logged in to Linked Earth Wiki, and dataset must meet Wiki standards prior to upload. ('Wiki Ready' switch)",
            position: "right"
        },
        {
          // NOAA ready, wiki ready switches
          element: document.querySelector(".step7"),
          intro: "The LinkedEarth Wiki and NOAA have additional requirements to our normal LiPD standards. Turning on these switches adds required fields to the page and add rules to the validation process.",
          position: "right"
        },
        {
          // Feedback boxes
          element: document.querySelector(".step8"),
          intro: "Validation results. Every time you press the 'Validate' button, these feedback boxes will show the validation results. Warnings are recommended fixes, but not required. Errors MUST be fixed.",
          position: "right"
        },
        {
          // Requirements boxes
          element: document.querySelector(".step9"),
          intro: "The requirements boxes give you feedback on how complete your dataset is and if you meet different levels of requirements. Hover your mouse pointer over each box to view specific requirements for each organization.",
          position: "right"
        },
        {
          // Files list
          element: document.querySelector(".step10"),
          intro: "All files ( .jsonld, .csv, .txt ) archived withing the LiPD file are listed here. The filenames listed may be clicked to view the contents inside. Advanced users may click the 'metadata.jsonld' to edit metadata directly.",
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
          intro: "The section for NOAA specific data is hidden until you enable the switch 'NOAA Ready (Beta)'",
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
          intro: "'Autocomplete using DOI' is the important part of the publication section. When you enter a DOI (Digital Object Identifier) and click the button, we'll use doi.org to retrieve and fill the publication data for you as much as possible. Authors are stored as individual entries according to BibJson standard. .",
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
          element: document.querySelector(".tourtable"),
          intro: "Data tables cover a lot of functionality. Tables and columns collapse and expand. Column fields are suggested to you, but you may enter custom fields if needed. Add values to your tables via the Spreadsheet (Beta) or the classic parser. The Spreadsheet is similar to an Excel spreadsheet. Please note that if you enter data and you don't see the changes, click the 'Refresh' button to update the table. When using the classic parser, copy/paste your values into the box and select parsing options. We recommend using the Spreadsheet unless you are experiencing issues with it.",
          position: "top"
        },
        // {
        //   // Delimiter
        //   element: document.querySelector(".step17"),
        //   intro: "Choose the delimiter that matches what you see in the input box below. One exception: When copying data from a spreadsheet, the delimiter is 'Tab (\\t)'.",
        //   position: "right"
        // },
        // {
        //   // Parse Mode
        //   element: document.querySelector(".step18"),
        //   intro: "The parse box has multiple modes attached to it. Choose the one that fits your situation. 'Start New' builds a brand new table. 'Update' keeps all existing column metadata, and replaces all column values. 'Add' keeps all existing columns and adds the parsed values as new columns to the table  ",
        //   position: "right"
        // },
        // {
        //   // Header
        //   element: document.querySelector(".step19"),
        //   intro: "Header row data will parse into the 'variableName' field for each column. Please note, units will not be parsed from the header row.",
        //   position: "right"
        // },
        // {
        //   // Parse Values Box
        //   element: document.querySelector(".step20"),
        //   intro: "Here's an example of some data with a header line. This is what the data would look like if you copied it from a spreadsheet and it had a 'Tab' delimiter. Click 'Parse Values' to see how it creates columns in this table.",
        //   position: "top"
        // },
        // {
        //   // Add table dropdown and button
        //   element: document.querySelector(".step21"),
        //   intro: "Add a new data table to paleoData or chronData by choosing the table type from the dropdown menu and clicking '+ Add Table'. We're working to add support for more tables!",
        //   position: "top"
        // },
        {
          // Delete Section buttons
          element: document.querySelector(".step22"),
          intro: "If you want to remove and ENTIRE paleoData section or chronData section, their respective 'Delete' buttons will do that. There's a confirmation box that asks you if you're sure before deleting the data.",
          position: "top"
        },
        {
          // chronData
          element: document.querySelector(".step23"),
          intro: "The chronData section is identical to everything you saw in the paleoData section.",
          position: "top"
        },
        {
          element: document.querySelector(".step24"),
          intro: "That's it! The Playground has a lot going on, but hopefully this tour has explained some of your initial questions and the process makes more sense. Remember, you can use the 'Questions, comments, concerns' button to report issues or ask for help.",
        },


      ]
    }),

    /**
     *  Merge page Tour: these steps are given to the intro.js module to create an step-by-step tour of different
     *  sections of the merge page. Each step is linked to a portion of the page via an element from the DOM.
     *  Write a short description about the piece, and then align it to a 'position' if desired.
     */
    tourStepsMerge: (function(){
        return [
            {
                element:document.querySelector(".tourmergeupload"),
                intro: "There are two ways to merge your data. You can upload LiPD files or paste data from your 'metadata.jsonld' files. Please note, your merged output will only be a LiPD file if both input files are also LiPD files."
            },
            {
                element:document.querySelector(".tourmergeprogress"),
                intro: "The progress bar shows you how to proceed through the merge process. When you finish a step, it will highlight green."
            },
            {
                element:document.querySelector(".tourmergediff"),
                intro: "When two datasets are loaded, the differences are calculated and shown here in the 'Resolve Differences' tab. When all differences are resolved between the two files, the output is shown in the 'Results' tab. "
            },
        ];
    }),

    /**
     *  NOT CURRENTLY IN USE
     *  A list of all inferred variable types as noted by the LinkedEarth Wiki. Normally this will not be used because
     *  we query the Wiki for this data during page load. However, if we get a bad response from our query then we
     *  will fall back to this hard-coded list.
     */
    inferredVariableTypeList: (function(){
      return ['Temperature', 'Sea Surface Temperature', 'Bottom Water Temperature', 'Ocean Mixed Layer Temperature',
      'Surface air temperature', 'Carbon dioxide concentration', 'Methane concentration', 'Nitrous oxide concentration',
      'Free oxygen levels', 'pH', 'Carbonate saturation', 'Carbonate Ion Concentration', 'Salinity',
        'Precipitation Amount', 'd18O', 'dD', 'ExcessD', 'Moisture Content', 'PDSI', 'Year', 'JulianDay',
      'Age', 'Radiocarbon Age', 'SOI', 'Nino3.4', 'Nino3', 'Nino4', 'Nino1', 'Nino2', 'Nino1+2', 'AMO', 'NAO', 'AO',
      'SAM', 'AAO'];
    }),

    /**
     * NOT CURRENTLY IN USE
     */
    interpretationLocalList: (function(){
      return ["local", "far-field"];
    }),

    /**
     *  NOT CURRENTLY IN USE
     */
    interpretationDirectionList: (function(){
      return ["positive", "negative"];
    }),

    /**
     * NOT CURRENTLY IN USE
     */
    interpretationScopeList: (function(){
      return ["climate", "ecology", "isotope"];
    }),

    /**
       *  NOT CURRENTLY IN USE
       *  A list of all proxy observation types as noted by the LinkedEarth Wiki. Normally this will not be used because
       *  we query the Wiki for this data during page load. However, if we get a bad response from our query then we
       *  will fall back to this hard-coded list.
       */
    proxyObservationTypeList: (function(){
      return ['Al/Ca', 'Ar-Ar', 'B/Ca', 'Ba/Ca', 'C', 'Clay fraction', 'Color', 'd34S', 'd13C', 'd15N', 'd17O', 'd18O',
      'dD', 'Density', 'Diffuse spectral reflectance', 'Faunal', 'Fe/Ca', 'Floral', 'Grain size', 'Historic',
      'Layer thickness', 'Lead Isotope', 'Li/Ca', 'Lithics', 'Luminescence', 'Magnetic susceptibility', 'Mg/Ca',
      'Mineral matter', 'Mn/Ca', 'Moisture Content', 'N', 'Neodymium', 'Organic matter', 'P', 'Permeability',
      'Porosity', 'Radiocarbon', 'Resistivity', 'Sand fraction', 'Si', 'Silt fraction', 'Sr/Ca', 'TEX86', 'U-Th',
      'Uk37', 'X-Ray diffraction', 'X-ray fluorescence', 'Zn/Ca'];
    }),

    /**
     * Time unit options for dropdown list.
     * Called by : ngContValidate > $scope.dropdowns.timeUnit
     * Used in : NOAA field when NOAA switch is turned on.
     */
    timeUnitList: (function(){
      return ["AD", "BP", "CE"];
    }),

    /**
     *  All the tooltips used for each field on the playground page. Sorted by section and field name.
     *
     *  @param   {String}  section  The section of the tooltip to retrieve
     *  @param   {String}  key      The key name (field) to retrieve
     *  @return  {String}  _tip     The tooltip to display to the user for this specific field
     */
    tooltipLibrary: (function(section, key){
      // The tip that we will show to the user
      var _tip = " ";
      // Our library of tooltips, sorted by section.
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
          "originalSourceUrlDescription": {"tooltip": ""},
          "modifiedDate": {"tooltip": "NA"},
          "datasetDOI": {"tooltip": "What is the digital object identifier associated with the dataset? Example: 10.1000/sample123"},
          "NOAAdataType": {"tooltip": "NA"},
          "NOAAstudyName": {"tooltip": "NA"}
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
          "gcmdLocation": {"tooltip": "Use the GCMD Keyword Valids from https://wiki.earthdata.nasa.gov/display/CMR/GCMD+Keyword+Access , " +
              "Example: OCEAN>ATLANTIC OCEAN>NORTH ATLANTIC OCEAN>BALTIC SEA"},

        },
        "paleoData": {
          "tsid": {"tooltip": "Time Series ID. Each column has its own unique TSid to identify it."},
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
          "error" : {"tooltip" :"NA"},
          "NOAAseasonality": {"tooltip": "NA"},
          "NOAAdataType": {"tooltip": "NA"},
          "NOAAdataFormat": {"tooltip": ""},
          "detail" : {"tooltip": "NA"},
          "measurementMaterial": {"tooltip": "NA"},
          "measurementMethod": {"tooltip" : "NA"},

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
      // Attempt to get the tooltip from the library. If you don't find it, send back an empty string instead.
      try{
        _tip = _lib[section][key].tooltip;
      } catch(err){
      }
      // Return the tooltip
      return _tip;
    }),

    /**
     * NOT CURRENTLY USED
     */
    variableTypeList: (function(){
      return ["measured", "inferred"];
    }),

    /**
     * Create an array of years dating back to 1950 (arbitrary choice)
     *
     * Called by : ngContValidate > $scope.dropdowns.years
     * Used by : Publication for pubYear dropdown field
     *
     * @return   {Array}  _years   Array of year integers
     */
    yearList: (function(){
      var _years = [];
      for(var _n=new Date().getFullYear(); _n>1950; _n--){
        _years.push(_n);
      }
      return _years;
    }),

    /**
     *  Get the popover (a small dialog box that appears when you hover on certain page elements) from a collection
     *  of popovers. In this case, these are the preferred and required data from each agency regarding the LiPD file
     *  completeness.
     *
     *  @param   {String}   name    The name of the popover that you want
     *  @return  {String}           The HTML code that renders as the content in the popover element on the page
     */
    getPopover: (function(name){
      var _popovers = {
        "lipd": '' +
        '<h5>LiPD Requirements</h5><br>' +
        '<p>Root:</p><ul>' +
        '<li>dataSetName</li>' +
        '<li>archiveType</li>' +
        '<li>createdBy</li>' +
        '</ul><br><p>Geo:</p><ul>' +
        '<li>coordinates</li>' +
        '</ul><br><p>paleoData:</p><ul>' +
        '<li>measurementTable</li>' +
        '</ul><br><p>Columns:</p><ul>' +
        '<li>variableName</li>' +
        '<li>units ("unitless" if units not applicable)</li>' +
        '<li>values</li>' +
        '</ul>',
        "wiki": '' +
        '<h5>Linked Earth Wiki Requirements</h5><br>' +
        '<p>In addition to the normal LiPD Requirements: </p>' +
        '</ul><br><p>Columns:</p><ul>' +
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
        '</ul><br><p>Columns:</p><ul>' +
        '<li>description</li>' +
        '<li>dataFormat</li>' +
        '<li>dataType</li>',
        "progress": ''+
         '<p>Ideally, all LiPD files are 100% complete with all required information provided. Use this progress bar ' +
         'to track how close you are to having a complete LiPD dataset. Please note: requirements may change as you ' +
        'add data, remove data, and switch modes.</p>'
      };

      return _popovers[name];

    }),

  }; // end return

}());
