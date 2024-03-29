var misc = (function(){
  // 'use strict';
  return {

    checkCoordinatesDms: (function(D, dms, ddMode){

      // Only attempt conversion process if the Decimal Degrees switch is OFF (i.e., DMS is on)
      if(!ddMode){
       var _dd = misc.convertToDecimalDegrees(dms);
       // longitude
       D.geo.geometry.coordinates[0] = _dd[0];
       // latitude
       D.geo.geometry.coordinates[1] = _dd[1];
      }
      return(D);
    }),

    convertCoordinates: (function(mode, dd, dms){

      // Convert DD to DMS
      if(mode){
        dms = misc.convertToDms(dd);
      }
      // Convert DMS to DD
      else {
        dd = misc.convertToDecimalDegrees(dms);
      }
      var _vals = {"dd": dd, "dms": dms};
      return(_vals);
    }),

    convertToDecimalDegrees: (function(dms){
      // FORMULA : DD = d + (min/60) + (sec/3600)
      // lat, lon
      var _dd = [0, 0];
      try{
        _dd[0] = dms.lon.d + (dms.lon.m/60) + (dms.lon.s/3600);
        _dd[1] = dms.lat.d + (dms.lat.m/60) + (dms.lat.s/3600);
        _dd[0] = Number(_dd[0].toFixed(6));
        _dd[1] = Number(_dd[1].toFixed(6));
        if(dms.lon.dir.name === "W"){
          _dd[0] = -(_dd[0]);
        }
        if(dms.lat.dir.name === "S"){
          _dd[1] = -(_dd[1]);
        }
      } catch(err){
        console.log("Error converting decimal degrees! " + err);
      }
      return _dd;
    }),

    convertToDms: (function(dd){
      var _dms = {
        "lon": {"d": 0, "m": 0, "s": 0, "dir": {id: 1, name: "E"}},
        "lat": {"d": 0, "m": 0, "s": 0, "dir": {id: 1, name: "W"}}
      };

      // get the dd values
      var _lon = dd[0];
      var _lat = dd[1];

      // lon conversion
      _dms.lon.d = Math.floor(_lon);
      _dms.lon.m = Math.floor(((_lon - _dms.lon.d) * 60));
      _dms.lon.s = Number(((_lon - _dms.lon.d - _dms.lon.m/60) * 3600).toFixed(2));
      if(_lon < 0){
        _dms.lon.dir = {id: 2, name:"S"}
      }

      // lat conversion
      _dms.lat.d = Math.floor(_lat);
      _dms.lat.m = Math.floor(((_lat - _dms.lat.d) * 60));
      _dms.lat.s = Number(((_lat - _dms.lat.d - _dms.lat.m/60) * 3600).toFixed(2));
      if(_lat < 0){
        _dms.lat.dir = {id: 2, name: "W"};
      }

      return _dms;
    }),

    removeCsvHeader: (function(_csv){
      try{
        // Remove the first array in the .data. Remove index 0, and remove one element
        _csv.data.splice(0, 1);
        // Remove the first element of each array in .transposed
        for(var _y = 0; _y < _csv.transposed.length; _y++){
          _csv.transposed[_y].splice(0, 1);
        }
      } catch (err){
        console.log("misc: removeCsvHeader: " + err);
      }
      return _csv;
    }),

    putCsvMeta: (function(_csv){
      _csv.rows = _csv.data.length;
      _csv.cols = _csv.data[0].length;
      _csv.delimiter = _csv.meta.delimiter;
      _csv.transposed = misc.transpose(_csv.data);
      return _csv;
    }),

    getDelimiter: (function(_bool){
      // true == semi-colon
      // false == comma (default)
      var _delimiter = ",";
      if(_bool === true){
        _delimiter = ";";
      }
      return _delimiter;
    }),

    // add dataSetNames to
    renameCsvFilenames: (function(_files, _dataSetName){
      // skip the process?
      var _skip = false;
      var _current = "";

      // initial look at _csv, to see if we can skip this processing
      for (var _w = 0; _w < _files.csv.length; _w++){
        // current filename
        _current = _files.csv[_w];
        // filename does not currently have the datasetname. must go through process
        if (_current.indexOf(_dataSetName) === -1){
          _skip = true;
          break;
        }
      }

      // CSV filenames are missing dataSetName. Have to go through and fix all the filenames.
      if (!_skip){
        // filename does not currently have the datasetname
        if (filename.indexOf(_dataSetName) === -1){
          // append the datasetname to the front of the filename
        }
      }
    }),

    // Transpose CSV rows into CSV columns
    transpose: (function(a) {

      // Calculate the width and height of the Array
      var w = a.length ? a.length : 0,
        h = a[0] instanceof Array ? a[0].length : 0;

      // In case it is a zero matrix, no transpose routine needed.
      if(h === 0 || w === 0) { return []; }

      var i, j, t = [];

      // Loop through every item in the outer array (height)
      for(i=0; i<h; i++) {

        // Insert a new row (array)
        t[i] = [];

        // Loop through every item per item in outer array (width)
        for(j=0; j<w; j++) {

          // Save transposed data.
          t[i][j] = a[j][i];
        }
      }

      return t;
    }),

    // create a random string of numbers/letters for the TMP folder
    makeid: (function(prefix, cb){
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for( var i=0; i < 6; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        cb(prefix + text);
        return prefix + text;
    }),

    // Create and add TSids. Make sure they don't already exist
    reconcileTSidCreate: (function(_TSids, _objs, cb){
      try{
        console.log("misc: reconcileTSidCreate");
        // loop for each new tsid that was generated.
        for(var _i = 0; _i < _objs.length; _i++){
          var _loop = true;
          // grab one tsid for this loop
          var _currTSid = misc.generateTSid();
          // loop until we get a tsid that doesn't conflict with the master list
          while(_loop){
            // does it exist already?
            _exists = misc.tsidExists(_TSids, _currTSid);
            if(_exists){
              // this TSid is already in master. generate a new TSid.
              _currTSid = misc.generateTSid();
            } else {
              // this TSid is not in use! save it to the object
              _objs[_i].tsid = _currTSid;
              _loop = false;
            }
          } // end while
        } // end for
        cb(_objs);
      } catch(err){
        console.log(err);
      }
    }),

    // Create and add TSids. Make sure they don't already exist
    replaceAllTSids: (function(_TSids, _objs, cb){
      try{
        console.log("misc: replaceAllTSids");
        // loop for each new tsid that was generated.
        for(var _i = 0; _i < _objs.length; _i++){
          var _loop = true;
          // grab one tsid for this loop
          var _currTSid = misc.generateTSid();
          // loop until we get a tsid that doesn't conflict with the master list
          while(_loop){
            // does it exist already?
            _exists = misc.tsidExists(_TSids, _currTSid);
            if(_exists){
              // this TSid is already in master. generate a new TSid.
              _currTSid = misc.generateTSid();
            } else {
              // this TSid is not in use! save it to the object
              _objs[_i].tsid = _currTSid;
              _loop = false;
            }
          } // end while
        } // end for
        cb(_objs);
      } catch(err){
        console.log(err);
      }
    }),

    // Check that our given TSid isn't already registered. Remove any TSids that exist, so we dont re-register them.
    reconcileTSidRegister: (function(_TSids, _objs, cb){
      try{
        console.log("misc: reconcileTSidRegister");
        // loop for each new tsid that was generated.
        for(var _i = 0; _i < _objs.length; _i++){
          _currTSid = _objs[_i]["tsid"];
          // does it exist already?
          _exists = misc.tsidExists(_TSids, _currTSid);
          if(_exists){
            // TSid is already registered. Remove the object from our array.
            if (_i > -1) {
                _objs.splice(_i, 1);
            }
          } // end if exists
        } // end for
        cb(_objs);
      } catch(err){
        console.log(err);
      }
    }),

    /**
     * Generate a TSid. An alphanumeric unique ID for every column. Prefix + 8 chars.
     * 'WEB' prefix for LiPD Playground + 8 generated characters (TsID standard)
     *
     * @return {string} _tsid TsID
     */
    generateTSid: (function(){
      var _tsid = "";
      function uuidv4() {
        // https://stackoverflow.com/a/2117523
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        })
      }

      _tsid = "WEB-" + uuidv4();
      console.log("misc: Generating TSid: " + _tsid);
      return _tsid;
    }),

    /**
     * Wrapper for Batch creation of TSids
     */
    generateTSids: (function(_count){
      try{
        var _data = [];
        for(var _i=0; _i < _count; _i++){
          _data.push(misc.generateTSid());
        }
        return _data;
      } catch(err){
        console.log(err);
      }
    }),

    // Check if a given TSid exists in the current Master list
    tsidExists: (function(_tsid_master, _tsid){
      try{
        console.log("TSid exists?: " + _tsid);
        if(_tsid_master.indexOf(_tsid) > -1){
          return true;
        } else {
          return false;
        }
      } catch(err){
        console.log("misc: tsidExists: " + err);
      }
    }),

    // Checks if the file is a .txt file, if yes, then assume it's a bagit file
    isBagit: (function(filename){
      if(filename.indexOf(".txt") >= 0){
        return true;
      } else {
        return false;
      }
    }),

    // Create the "Simple View" data. Copy the "Advanced View" data, and remove what's not necessary.
    advancedToSimple: (function (j) {
      // make a clone of the dictionary, so we dont ruin the reference.
      var d = JSON.parse(JSON.stringify(j));
      // remove items from root
      d = misc.rmAdvKeys(d, false);

      // Geo: instead of removing items, just grab the one item that we do want.
      if (d.hasOwnProperty("geo")) {
        try {
          coords = d["geo"]["geometry"]["coordinates"];
          d["geo"] = { "geometry": { 'coordinates': coords } };
        } catch (err) {
          // no coordinates or no geo found
        }
      }

      // Pub: remove items from publication
      d = misc.rmAdvKeys(d, false);

      // loop for each section
      pc = ["paleo", "chron"];
      for (var _i3 = 0; _i3 < pc.length; _i3++) {
        var pcData = pc[_i3] + "Data";
        var meas = pc[_i3] + "MeasurementTable";
        var mod = pc[_i3] + "Model";
        if (d.hasOwnProperty(pcData)) {
          for (var _k2 = 0; _k2 < d[pcData].length; _k2++) {
            if (d[pcData][_k2].hasOwnProperty(meas)) {
              var table = d[pcData][_k2][meas];
              for (var _j = 0; _j < table.length; _j++) {
                // remove items from table
                table[_j] = misc.rmAdvKeys(table[_j], true);
              }
            }
            if (d[pcData][_k2].hasOwnProperty(mod)) {
              var table = d[pcData][_k2][mod];
              for (var _j2 = 0; _j2 < table.length; _j2++) {
                if (table[_j2].hasOwnProperty("summaryTable")) {
                  // remove items from table
                  table[_j2]["summaryTable"] = misc.rmAdvKeys(table[_j2]["summaryTable"], true);
                }
                if (table[_j2].hasOwnProperty("ensembleTable")) {
                  // remove items from table
                  table[_j2]["ensembleTable"] = misc.rmAdvKeys(table[_j2]["ensembleTable"], true);
                }
                if (table[_j2].hasOwnProperty("distributionTable")) {
                  table2 = table[_j2]["distributionTable"];
                  for (var p = 0; p < table[_j2]["distributionTable"].length; p++) {
                    // remove items from table
                    table2[p] = misc.rmAdvKeys(table[_j2]["distributionTable"][p], true);
                  }
                }
              }
            }
          }
        }
      }
      return d;
    }),

    // Subroutine of advancedToSimple
    rmAdvKeys: (function (d, isTable) {
      var advKeys = ["@context", "tsid", "number", "google", "md5", "lipdversion", "investigators"];

      try {
        // get all keys in this object
        var keys = Object.keys(d);
        // make all keys case-insensitive
        for (var _i = 0; _i < keys.length; _i++) {
          var key = keys[_i];
          var keyLow = key.toLowerCase();
          // look for an exact match inside advKeys
          if (advKeys.indexOf(keyLow) > 0) {
            delete d[key];
          }
          // look for a substring match inside each advKey entry
          else {
              for (var _k = 0; _k < advKeys.length; _k++) {
                if (advKeys[_k].indexOf(keyLow) > 0) {
                  delete d[key];
                  break;
                }
              }
            }
        }
        // if this is a table, then check the columns too.
        if (isTable) {
          if (d.hasOwnProperty("columns")) {
            for (var _i2 = 0; _i2 < d["columns"].length; _i2++) {
              misc.rmAdvKeys(d["columns"][_i2], false);
            }
          }
        }
      } catch (err) {
        console.log("rmAdvKeys: " + err);
      }
      return d;
    })

  }; // end return

}());
