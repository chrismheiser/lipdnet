/**
 * Spreadsheet controller
 *
 * Each data table has its own spreadsheet instance for entering data. This spreadsheet uses the 'HandsOnTable' module
 * which is often referred to as 'hot' for short. These hot tables are interactive, can have headers, accept copy/paste
 * commands, and more. It's as close to a true spreadsheet as I could find for javascript.
 *
 * @param $scope
 * @constructor
 */
function SpreadsheetCtrl($scope){
  $scope.options = {};


  // Set up the hot table with the given settings. These settings can be changed, but assuming a ~1200x800, somewhat
  // standard resolution, this fits well. For larger resolutions, it looks better. The context menu is a tricky one.
  // Not all options in the context menu usually show, or they're greyed out. Seems to be a bug in hot.
  // $scope.headers = [];
  $scope.settings = {
    rowHeaders: false,
    colHeaders: [],
    colWidths: 160,
    manualColumnResize: true,
    minSpareRows: 5,
    minSpareCols: 0,
    startRows: 10,
    startCols: 0,
    contextMenu: ["row_above", "row_below", "remove_row", "undo", "redo", "copy", "cut"],

  /**
   * After init
   * Run once when the hot table is initialized.
   *
   * @param index
   * @param amount
   */
    afterInit: function(index, amount){
      // Use this as a reference to the hot instance.
      $scope.hot = this;
    },

  /**
   * After Paste
   * Run after each time data is pasted into the hot table.
   *
   * @param index
   * @param amount
   */
    afterPaste: function(index, amount){
      // Use countSourceCols() to determine how many columns are being pasted, and how many to push to the table.cols metadata.
      var _current = $scope.$parent.entry2.columns.length;
      var _pasted = $scope.hot.countSourceCols();
      // If our current columns is less than our columns after pasting, we need to add columns to table.columns
      if(_current < _pasted){
        // Get the difference between current and pasted counts
        var _diff = _pasted - _current;
        // Loop and add a column for each loop
        for(var _d=0; _d <_diff; _d++){
          $scope.addColumn($scope.$parent.entry2);
        }
      }
      // Update the hot instance so new changes are reflected
      $scope.hot.updateSettings($scope.settings);
    },

  /**
   * After Change
   * Run after anything in the hot instance changes. Good for debugging.
   *
   * @param index
   * @param amount
   */
    afterChange: function (index, amount) {
      // Check for updates to the column headers
      $scope.settings.colHeaders = $scope.updateHeaders($scope.$parent.entry2);
      // Refresh the table by running updateSettings.
      this.updateSettings($scope.settings);
      // console.log(this.getData());
      // console.log($scope.$parent.files.csv[$scope.$parent.entry2.filename]);
      // console.log("Spreadsheet change---");
      // console.log($scope.$parent.entry2);
    },
  };

  /**
   * Refresh the spreadsheet view. Even though there is a two-way bind between the spreadsheet view and the 'hot'
   * object data, the spreadsheet view often lags behind when changes or made. This is a workaround to force the
   * view to refresh.
   *
   * @return none              All data is updated in controller $scope
   */
  $scope.refreshRender = function(){
    // Don't attempt to refresh if we don't have a hot object yet.
    if(typeof $scope.hot !== "undefined"){
        // Render the hot instance
        $scope.hot.render();
        // Update the column headers
        $scope.settings.colHeaders = $scope.updateHeaders($scope.$parent.entry2);
        // Run update on hot instance
        $scope.hot.updateSettings($scope.settings);
    }
  };

  /**
   * Add a column to a data table.
   *
   * @param  {Object}  table   Table metadata
   * @return none              All data is updated in the controller $scope
   */
  $scope.addColumn = function(table){
    // The table values data does not exist yet
    if(typeof($scope.$parent.files.csv[table.filename]) === "undefined"){
      // Create a blank table with a standard 5 rows and 1 column.
      $scope.$parent.files.csv[table.filename] = {data: [[]], rows: 5, cols: 1};
    }
    // The table values data exists.
    else {
      // Add an empty array to the csv data to represent the new column
      $scope.$parent.files.csv[table.filename].data.push([]);
      // Increment the column counter in the table metadata
      $scope.$parent.files.csv[table.filename].cols++;
    }

    // The table metadata does not exist yet
    if(typeof(table.columns) === "undefined") {
      // Create the column
      var _col = {"number": 1};
      // If this is a paleo table, add one interpretation and the proxy field
      if(table.tableName.indexOf("paleo") !== -1){
            _col["proxy"] = "";
            _col["interpretation"] = [{"variable": "", "direction": "", "scope": ""}];
      }
      // Create the columns array with one column in it.
      table.columns = [_col];
    }
    // The table metadata exists
    else {
        // Create the column
        var _col2 = {"number": table.columns.length + 1};
        // If this is a paleo table, add one interpretation and the proxy field
        if(table.tableName.indexOf("paleo") !== -1){
            _col2["proxy"] = "";
            _col2["interpretation"] = [{"variable": "", "direction": "", "scope": ""}];
        }
      // Add a metadata column to the existing columns array
      table.columns.push(_col2);
    }
  };

  /**
   * Remove a column of data from the data table.
   * This process involves removing the column metadata from the json data, and removing associated column values
   * from the csv data. Any column
   *
   * @param   {Object}  table    Table metadata
   * @param   {Number}  index    Column index to remove. If null, then remove last column.
   * @return  none               All data is modified in the controller $scope
   */
  $scope.removeColumn = function(table, index){
      try{
          // Set a placeholder for index to remove
          var _rm_idx = null;

          // Target index number is provided
          if(index !== null){
              // Set the target index number for the column to delete.
              _rm_idx = index;
          }
          // Target index number not provided
          else {
              // By default, remove the last column in the table.
              _rm_idx = table.columns.length-1 ;
          }
          // Since arrays are 0-indexed (ie. _rm_idx), keep a 1-indexed number for later.
          var _oneidx = _rm_idx + 1;

          // Table columns exist
          if(typeof(table.columns) !== "undefined"){
              // If the target index is a real index
              if (_rm_idx > -1) {
                  // Remove the column value at the target index.
                  table.columns.splice(_rm_idx, 1);
              }
              // Loop over each row of data in this table
              for(var _p=0; _p<$scope.$parent.files.csv[table.filename].data.length; _p++){
                  // If this row of data is as long as the index that needs to be removed, then pop the end of the array.
                  // Example: if we want to remove index 3, but this row only has index [0,1,2], then we don't need to do anything
                  // Every row should have an equal number of values, but that's not always true.
                  try{
                      // If the column exists in this row of data, keep going.
                      if($scope.$parent.files.csv[table.filename].data[_p].length >=  _oneidx){
                          // In the current row, remove the value at the target index.
                          $scope.$parent.files.csv[table.filename].data[_p].splice(_rm_idx, 1);
                      }
                  } catch (err){
                      console.log("Error removeColumn: ", err);
                  }

              }
              // Column count exists
              if($scope.$parent.files.csv[table.filename].hasOwnProperty("cols")){
                  // Decrement the column count
                  $scope.$parent.files.csv[table.filename].cols--;
              }
              // Column count does not exist
              else {
                  // Get the current column count from the spreadsheet and set that as the current column count.
                  $scope.$parent.files.csv[table.filename].cols = $scope.hot.countCols();
              }
          }
      } catch (err){
          console.log(err);
      }

  };

  /**
 * Update the column headers
 * Each column has a header of "variableName (units)" when data is available. This function looks for that data and
 * places it in the header array as a str
 *
 * @param  {Object}  table     Table metadata
 * @return {Array}   _headers  Formatted header/unit  names for table columns
 */
  $scope.updateHeaders = function (table) {
    // Array to store all the header names
    var _headers = [];
    // If this table has columns...
    if (table.hasOwnProperty("columns")) {
      for (var _n = 0; _n < table.columns.length; _n++) {
        // Placeholder variableName and units for each column header, in case data is not available
        var _varName = "variableName";
        var _units = "units";

        if(table.columns[_n].hasOwnProperty("variableName")){
          if(typeof table.columns[_n].variableName !== "undefined"){
            // Get the variableName for this column
            _varName = table.columns[_n].variableName;
          }
        }
        if(table.columns[_n].hasOwnProperty("units")){
          if(typeof table.columns[_n].units !== "undefined"){
            // Get the units for this column
            _units = table.columns[_n].units;
          }
        }
        // Add this header name to the array
        _headers.push(_varName + " (" + _units + ") ");
      }
    }
    // Return the array of formatted header row names
    return _headers;
  };

  /**
     *  Wait for a validate cycle $broadcast event from parent controller ngContValidate. When validation occurs,
     *  refresh all the spreadsheet tables on the page.
     *
     */
  $scope.$on('refreshSpreadsheets', function(event, data){
      $scope.refreshRender();
  });

}

angular
  .module('ngSpreadsheet', ['ngHandsontable'])
  .controller("SpreadsheetCtrl", SpreadsheetCtrl);