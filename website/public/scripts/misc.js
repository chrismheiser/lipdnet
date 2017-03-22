var misc = (function(){
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
    _tsid = "VAL" + s4() + s4();
    return _tsid;
  }),

  isBagit: (function(filename){
    if (filename.indexOf(".txt") >= 0){
      return true;
    } else {
      return false;
    }
  }),

  // Create the "Simple View" data. Copy the "Advanced View" data, and remove what's not necessary.
  advancedToSimple: (function (d) {
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
  }),


}; // end return

}());
