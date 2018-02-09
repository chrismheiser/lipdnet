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


    getTourSteps: (function(){
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
          intro: "The map uses your coordinate data to drop a pin on your dataset's location."
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
          // Header
          element: document.querySelector(".step18"),
          intro: "Header row data will parse into the 'variableName' field for each column. Please note, units will not be parsed from the header row.",
          position: "right"
        },
        {
          // Keep existing columns
          element: document.querySelector(".step19"),
          intro: "Use this switch to make corrections to your values, or to completely redo your columns. For example, setting this switch to 'Yes' will preserve all column metadata that you have worked on so far and update the values ONLY. Setting the switch to 'No' will parse values and wipe all other column metadata for a fresh start.",
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
        }
      ]
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

    structureCsvForPy: (function(_csv, _dsn){
      var _newCsv = {};
      for(var _filename in _csv){
        if(_csv.hasOwnProperty(_filename)){
          _newCsv[_filename] = _csv[_filename]["transposed"];
        }
      }
      return _newCsv;
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
        "proxyObservationType", "notes"];
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
