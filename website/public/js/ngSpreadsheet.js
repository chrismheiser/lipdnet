
function SpreadsheetCtrl($scope){
  $scope.options = {};

  // $scope.headers = [];
  $scope.settings = {
    // data: [[0,0,0]],
    rowHeaders: false,
    colHeaders: [],
    colWidths: 160,
    manualColumnResize: true,
    minSpareRows: 5,
    minSpareCols: 0,
    startRows: 10,
    startCols: 0,
    contextMenu: ["row_above", "row_below", "remove_row", "undo", "redo"],
    afterInit: function(index, amount){
      // Use this to keep a reference to the hot instance.
      $scope.hot = this;
    },
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
      $scope.hot.updateSettings($scope.settings);
    },
    // Every time there is a change, update the hot headers.
    afterChange: function (index, amount) {
      $scope.settings.colHeaders = $scope.updateHeaders($scope.$parent.entry2);
      this.updateSettings($scope.settings);
    },

  };

  $scope.refreshRender = function(){
    $scope.hot.render();
    $scope.settings.colHeaders = $scope.updateHeaders($scope.$parent.entry2);
    $scope.hot.updateSettings($scope.settings);

  };

  $scope.addColumn = function(table){
    if(typeof($scope.files.csv[table.filename]) === "undefined"){
      $scope.files.csv[table.filename] = {data: [[]]};
    }
    if(typeof(table.columns) !== "undefined"){
      table.columns.push({});
    }
  };

  $scope.removeColumn = function(table){
    // Remove this index from each row IF it exists. Blank columns often don't exist in csv data
    var _rm_idx = table.columns.length;
    if(typeof(table.columns) !== "undefined"){
      table.columns.pop();
      for(var _p=0; _p<$scope.$parent.files.csv[table.filename].data.length; _p++){
        if($scope.$parent.files.csv[table.filename].data[_p].length === _rm_idx){
          $scope.$parent.files.csv[table.filename].data[_p].pop();
        }
      }
    }
  };

  $scope.updateHeadersNull = function (table) {
    var _headers = [];
    if (table.hasOwnProperty("columns")) {
      for (var _m = 0; _m < table.columns.length; _m++) {
        _headers.push(null);
      }
    }
    return _headers;
  };

  $scope.updateHeaders = function (table) {
    var _headers = [];
    if (table.hasOwnProperty("columns")) {
      for (var _n = 0; _n < table.columns.length; _n++) {
        if(table.columns[_n].hasOwnProperty("units")){
          _headers.push(table.columns[_n].variableName + " (" + table.columns[_n].units + ") ");
        } else {
          _headers.push(table.columns[_n].variableName);
        }
      }
    }
    // $scope.headers = _headers;
    return _headers;
  };

}

angular
  .module('ngSpreadsheet', ['ngHandsontable'])
  .controller("SpreadsheetCtrl", SpreadsheetCtrl);