angular.module('ngGraphs', ['nvd3ChartDirectives']).controller('GraphCtrl', function($scope){
  $scope.vars = [];
  // FORMAT
  // $scope.graphData = [{
  //            "key": "Series 1",
  //             "values": [[1.0, 28.4], [3.0, 28.6], [5.0, 29.2], [7.0, 28.7], [9.0, 28.7], [11.0, 28.5], [13.0, 27.9], [15.0, 28.1], [17.0, 28.3], [19.0, 28.0], [21.0, 28.5], [23.0, 29.1], [25.0, 28.8], [27.0, 28.4], [29.0, 31.1], [31.0, 28.2], [33.0, 28.5], [35.0, 28.7], [36.0, 29.6], [37.0, 28.3], [39.0, 28.7], [43.0, 29.0], [47.0, 28.1], [51.0, 28.5], [55.0, 28.9], [59.0, 28.8], [61.0, 28.6], [63.0, 28.4], [67.0, 28.4], [71.0, 29.9], [75.0, 29.1], [79.0, 28.9], [83.0, 28.1], [86.0, 29.4], [87.0, 28.7], [91.0, 28.7], [95.0, 29.2], [99.0, 28.6], [103.0, 28.9], [107.0, 29.5], [111.0, 28.3], [115.0, 28.6], [119.0, 28.9], [123.0, 28.5], [127.0, 28.1], [131.0, 28.0], [135.0, 28.7], [136.0, 28.9], [139.0, 29.2], [143.0, 28.9], [147.0, 29.1], [151.0, 28.5], [155.0, 28.7], [159.0, 28.5], [161.0, 29.0], [163.0, 29.2], [167.0, 29.0], [171.0, 29.0], [175.0, 29.6], [179.0, 29.0], [183.0, 29.7], [186.0, 28.8], [187.0, 29.3], [191.0, 29.7], [195.0, 28.9], [199.0, 29.5], [203.0, 31.1], [207.0, 29.6], [211.0, 28.4], [215.0, 28.6], [219.0, 28.6], [223.0, 29.2], [227.0, 29.2], [231.0, 28.0], [235.0, 29.6], [239.0, 29.3], [243.0, 29.0], [247.0, 29.4], [251.0, 28.5], [255.0, 29.6], [259.0, 29.1], [263.0, 28.5], [267.0, 28.5], [271.0, 30.0], [275.0, 29.3], [279.0, 29.0], [283.0, 28.5], [286.0, 28.7], [287.0, 28.7], [291.0, 28.4], [295.0, 28.7], [299.0, 28.9], [303.0, 28.6], [307.0, 28.3], [311.0, 28.8], [315.0, 27.8], [319.0, 28.4], [323.0, 29.1], [327.0, 28.8], [331.0, 27.9], [335.0, 28.7], [336.0, 29.8], [339.0, 28.9], [343.0, 28.5], [347.0, 28.7], [351.0, 28.6], [355.0, 28.7], [359.0, 28.7], [363.0, 29.3], [367.0, 28.3], [371.0, 29.3], [375.0, 29.0], [379.0, 29.2], [383.0, 28.7], [386.0, 29.6], [387.0, 29.1], [389.0, 28.7], [391.0, 29.8], [395.0, 30.2], [399.0, 29.0], [403.0, 29.3], [407.0, 29.3], [411.0, 29.3], [415.0, 29.3], [419.0, 29.0], [423.0, 28.9], [427.0, 28.9], [431.0, 29.2], [435.0, 29.6], [436.0, 29.6], [439.0, 29.5], [443.0, 29.0], [447.0, 29.6], [451.0, 29.4], [455.0, 30.2], [459.0, 29.6], [461.0, 29.6], [463.0, 29.5], [467.0, 30.1], [471.0, 29.0], [475.0, 29.4], [479.0, 29.4], [483.0, 28.4], [487.0, 28.8], [491.0, 29.1], [495.0, 29.3], [499.0, 28.6], [503.0, 29.6], [507.0, 29.2], [511.0, 29.2], [515.0, 30.2], [519.0, 29.3], [523.0, 29.6], [527.0, 29.4], [531.0, 29.0], [535.0, 29.1], [536.0, 30.1], [539.0, 29.9], [543.0, 28.7], [547.0, 29.2], [551.0, 29.0], [555.0, 28.5], [559.0, 29.1], [563.0, 29.5], [567.0, 29.5], [571.0, 28.9], [575.0, 29.0], [579.0, 28.2], [583.0, 29.0], [586.0, 30.0], [587.0, 28.7], [591.0, 28.9], [595.0, 30.1], [599.0, 29.1], [603.0, 29.2], [607.0, 29.8], [611.0, 29.5], [615.0, 29.0], [619.0, 29.7], [623.0, 29.8], [627.0, 29.8], [631.0, 29.5], [635.0, 29.3], [639.0, 29.3], [643.0, 28.7], [647.0, 29.7], [651.0, 29.3], [655.0, 29.2], [659.0, 29.1], [661.0, 29.6], [663.0, 29.1], [667.0, 29.9], [671.0, 28.9], [675.0, 30.0], [679.0, 29.2], [683.0, 28.8], [687.0, 29.1], [691.0, 28.6], [695.0, 29.6], [699.0, 29.3], [703.0, 28.9], [707.0, 28.7], [711.0, 28.55], [715.0, 29.4], [719.0, 28.7], [723.0, 29.2], [727.0, 29.2], [731.0, 28.9], [735.0, 28.4], [739.0, 28.3], [743.0, 28.6], [747.0, 28.8], [751.0, 27.9], [755.0, 28.9], [759.0, 28.7], [761.0, 28.6], [763.0, 28.5], [767.0, 28.7], [771.0, 27.8], [775.0, 28.0], [779.0, 28.0], [783.0, 28.8], [787.0, 28.3], [791.0, 28.7], [795.0, 28.9], [799.0, 28.2], [803.0, 28.5], [807.0, 28.0], [811.0, 27.4], [815.0, 26.7], [819.0, 27.6], [823.0, 27.4], [827.0, 28.4], [831.0, 27.2], [835.0, 27.1], [839.0, 26.5], [843.0, 26.8], [847.0, 26.6], [851.0, 26.8], [855.0, 26.5], [859.0, 27.4], [861.0, 26.3], [863.0, 26.7], [867.0, 26.3], [871.0, 26.5], [875.0, 26.0], [879.0, 26.9], [883.0, 26.5], [887.0, 26.1]]
  // }];
  $scope.graphData = [];

  $scope.expandEntryGraph = function(x, entry){
    // Reset everything
    $scope.resetGraph(x);
    // Now turn on the toggle for this specific entry
    if (typeof entry.tmp === "undefined"){
      entry["tmp"] = {"toggleGraph": true};
    } else{
      entry.tmp.toggleGraph = true;

    }
    return x;
  };

  $scope.refreshGraph = function(vars, vals){
    $scope.vars = null;
    $scope.vars = vars;
    $scope.graphData = null;
    $scope.graphData = [{"key": "LiPD", "values": vals}];

  };


  $scope.swapAxis = function(){
    console.log("Swap the axis");
    var _newVals = [];
    var _newVars = $scope.vars.reverse();
    // Swap all the values in the graphData values array.
    for(var _u=0; _u<$scope.graphData[0].values.length; _u++){
      _newVals[_u] = $scope.graphData[0].values[_u].reverse();
    }
    $scope.refreshGraph(_newVars, _newVals);
  };

  $scope.resetGraph = function(x){
    // Turn off all graph toggles in paleoData AND chronData
    x = create.turnOffToggles(x, "toggleGraph");
    // Reset all columns with disabled checkboxes
    x = create.turnOffToggles(x, "toggleGraphDisabled");
    $scope.refreshGraph([], []);
  };

  $scope.addRmColumn = function(columns, values, idx, addBool){
    console.log(values);
    var _preCount = $scope.vars.length;
    if(addBool){
      // Add this column.
      $scope.addColumn(columns[idx], values);
      // Added column successfully. Pre count and post count are different.
      if($scope.vars.length !== _preCount){
        // Is this the second column?
        if($scope.vars.length === 2){
          // Yes, second column. Disable any column that is NOT the two columns in the graph (i.e. any col.tmp.toggleGraph = false;)
          for(var _n=0; _n<columns.length; _n++){
            // If this column isn't on the graph...
            if(!columns[_n].tmp.toggleGraph){
              // Disable this checkbox from being used.
              columns[_n].tmp.toggleGraphDisabled = true;
            }
          }
        }
      }

    } else {
      // Remove this column
      $scope.rmColumn(columns[idx], values);
      // Loop columns and enable any fields that are disabled.
      for(var _a=0; _a<columns.length; _a++){
        if(!columns[_a].tmp.toggleGraph){
          // Enable the checkboxes that are not selected
          columns[_a].tmp.toggleGraphDisabled = false;
        }
      }
    }

    // Since the graph doesn't automatically redraw when the data is updated, force a redraw by 'resetting' the data
    // at the end of every add / remove
    setInterval(function(){
      $scope.$apply(function(){
        var _vals = [];
        try{
          _vals = $scope.graphData[0].values;
        } catch(err){}
        $scope.refreshGraph($scope.vars, _vals);
      })
    }, 100);
  };

  $scope.addToScope = function(values, vars_entry, first_col){
    var _vals = null;
    // Retrieve value data or start a new array, depending on the situation.
    if(first_col){
      _vals = [];
    } else {
      _vals = $scope.graphData[0].values;
    }
    // Push col metadata to $scope.vars
    $scope.vars.push(vars_entry);

    // Loop over new values array.
    for(var _q=0; _q<values.length; _q++){
      // Parse string numbers into a float.
      if(values[_q] !== "" || values[_q] !== " "){
        var _val = parseFloat(values[_q]);
        if(first_col){
          // First column:
          // No inner arrays exist yet, so add new inner arrays with one value inside each.
          _vals.push([_val]);
        } else {
          // Second column:
          // Add the value to the existing inner array.
          _vals[_q].push(_val);
        }
      }
    }
    // We have all the scope data ready. Graph refresh isn't automatic so do some variable 'resetting' to trigger re-draw.
    $scope.refreshGraph($scope.vars, _vals);
  };


  $scope.addColumn = function(column, values){
    // Get metadata for this column
    var _vars_entry = {"variableName": column.variableName, "units": column.units};
    // First column. No graph data yet.
    if($scope.vars.length === 0){
      $scope.addToScope(values, _vars_entry, true);
    }
    // Second column. Need a couple extra steps.
    else {
      // Check that both columns contain an equal amount of values.
      if($scope.graphData[0].values.length !== values.length){
        // Oops. We can't graph arrays that aren't equal lengths.
        window.alert("Unable to graph: Those two columns do not contain the same amount of values.");
      } else {
        // All clear. Start adding data.
        $scope.addToScope(values, _vars_entry, false);
      }
    }
  };

  $scope.rmColumn = function(column, values){
    var _vn = column.variableName;
    var _units = column.units;
    var _graphVals = $scope.graphData[0].values;

    // One column: Just reset the graph and scope data. Easy!
    if($scope.vars.length === 1){
      $scope.refreshGraph([], []);
    }
    // Two columns: Find the right one to remove. :( This can be tough since not all columns will have variableName and units.
    else {
      // The target index will tell us which index in the values arrays that we should remove.
      var _tgt_idx = null;
      // Loop the scope vars
      for(var _i=0; _i < $scope.vars.length; _i++){
        // One entry of variable metadata
        var _item = $scope.vars[_i];
        // We don't want any generically-named metadata. Only go this route if the variableName is a real one.
        if(_item.variableName !== "" && typeof _item.variableName !== "undefined"){
          // Did the variableNames match?!
          if(column.variableName === _item.variableName){
            // Yes, this is the index that we want to remove.
            _tgt_idx = _i;
          }
        }
      }
      // If the index doesn't match vars[0] or vars[1], then we didn't get a match at all.
      if(_tgt_idx !== 0 || _tgt_idx !== 1){
        // We didn't get an exact match on a variableName (at least one that wasn't 'untitled' so
        // lets try to match up the values.
        var _curr_val = null;
        var _match0 = 0;
        var _match1 = 0;
        for(var _m=0; _m<10; _m++){
          _curr_val = parseFloat(values[_m]);
          if(_graphVals[_m][0] === _curr_val){
            _match0++;
          } else if (_graphVals[_m][1] === _curr_val){
            _match1++;
          }
        }
        // Index 0 got more matches. Set index 0 as the column to be removed.
        if(_match0 > _match1){
          _tgt_idx = 0;
        }
        // Index 1 got more matches OR matches were equal. If equal, let's just guess that the last column added is the
        // one to be removed.
        else {
          _tgt_idx = 1
        }

        // Remove the column metadata from scope vars
        $scope.vars.splice(_tgt_idx, 1);
        // Go through the graphVals and start removing the target index.
        for(var _e=0; _e<_graphVals.length; _e++){
          _graphVals[_e].splice(_tgt_idx, 1);
        }
      }
      // Refresh the graph
      $scope.refreshGraph($scope.vars, _graphVals);
    }
  };
});