// Controller - Validate Form

var q = angular.module('ngQuery', ["ngMaterial", "ui.bootstrap", "cgBusy", "toaster", "ngColors", "ngFileUpload", "cgBusy"]);

q.value('cgBusyDefaults',{
  message:'Please wait...',
  backdrop: true,
  minDuration: 0,
  templateUrl: "loading",
});

q.controller('QueryCtrl', ['$scope', '$log', '$timeout', '$q', '$http', "$uibModal","$sce", "toaster", "Upload",
  function ($scope, $log, $timeout, $q, $http, $uibModal, $sce, toaster, Upload) {

    $scope.checked = {
      "archiveType": {},
      "infVarType": {},
      "proxyObsType": {}
    };
    $scope.keyLib = {
      "archiveType": {},
      "infVarType": {},
      "proxyObsType": {}
    };
    $scope.dropdowns = {
      "ageBoundType": ["any", "entire", "entirely"],
      "archiveType": create.archiveTypeList(),
      "timeUnit": create.timeUnitList(),
      "infVarType": create.inferredVariableTypeList(),
      "proxyObsType": create.proxyObservationTypeList(),
    };
    $scope.query = {
      archiveType: [],
      proxyObsType: [],
      infVarType: [],
      sensorGenus: [],
      sensorSpecies: [],
      interpName: [],
      interpDetail: [],
      ageUnits: [],
      ageBound: [],
      ageBoundType: ["any"],
      recordLength: [],
      resolution: [],
      lat: [],
      lon:  [],
      alt:  [],
    };
    $scope.feedback = {
      "errCt": 0,
      "errMsgs": []
    };
    $scope.pageMeta = {
      "busyPromise": null,
    };
    $scope.resultCt = null;
    $scope.resultMsg = "";
    $scope.resultObjs = "";

    $scope.downloadAll = function(){
      $scope.uploadDownloadAll($scope.resultObjs, function(resp){
        console.log("Received backend response");
        console.log(resp);
      });
    };

    $scope.getTooltip = function(section, key){
      return create.fieldMetadataLibrary(section, key);
    };

    $scope.submitQuery = function(){
      $scope.validate(function(){
        if($scope.feedback.errCt === 0){
          console.log("Query is valid. Proceed to HTTP request...");

          $scope.addCheckedFields();
          $scope.uploadQuery($scope.query, function(resp){
            console.log("Received backend response");
            console.log(resp);
            if (resp.status !== 200){
              // window.alert("HTTP " + resp.status + ": There was a problem completing your request\n" + resp.statusText);
              $scope.resultMsg = "HTTP " + resp.status + ": This is embarrassing..." + resp.statusText;
              $scope.resultCt = 0;
              $scope.resultObjs = "";
            } else {
              console.log("Looks good! Displaying results.");
              $scope.resultObjs = resp.data;
              $scope.resultCt = resp.data.length;
              if($scope.resultCt === 0){
                $scope.resultMsg = "No datasets matched your query :(";
              } else {
                $scope.resultMsg = "Datasets found: " + $scope.resultCt;
              }
            }
          });
        } else {
          console.log("There are errors");
        }
      });
    };

    $scope.uploadDownloadAll = function (dat, cb) {
      // Upload *validated* lipd data to backend
      $scope.pageMeta.busyPromise = Upload.upload({
        url: '/downloadall',
        data: dat
      });
      $scope.pageMeta.busyPromise.then(function (resp) {
        // console.log('Success');
        // console.log(resp);
        cb(resp);
      }, function (resp) {
        console.log(resp);
        console.log('Error status: ' + resp.status);
        cb(resp);
      }, function (evt) {
        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
      });
    };

    $scope.uploadQuery = function (opts, cb) {
      // Upload *validated* lipd data to backend
      $scope.pageMeta.busyPromise = Upload.upload({
        url: '/query',
        data: opts
      });
      $scope.pageMeta.busyPromise.then(function (resp) {
        // console.log('Success');
        // console.log(resp);
        cb(resp);
      }, function (resp) {
        console.log(resp);
        console.log('Error status: ' + resp.status);
        cb(resp);
      }, function (evt) {
        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
      });
    };

    $scope.upperCaseEachWord = function(word){
      return word.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };

    $scope.getSynonyms = function(arr){
      var _arr_new = arr.slice();
      for(var _i=0; _i <arr.length; _i++) {
        // Uppercase the first letter of each word
        _arr_new.push($scope.upperCaseEachWord(arr[_i]));
        // Uppercase all letters
        _arr_new.push(arr[_i].toUpperCase());
      }
      return _arr_new;
    };

    $scope.createLib = function(){
      // for every term in $scope.keyLib
      for(var _section in $scope.keyLib) {
        if ($scope.keyLib.hasOwnProperty(_section)) {
          for (var _p = 0; _p < $scope.dropdowns[_section].length; _p++) {
            var _curKey = $scope.dropdowns[_section][_p];
            $scope.keyLib[_section][_curKey] = $scope.getSynonyms([_curKey]);
          }
        }
      }
    };

    $scope.createLib();

    $scope.addCheckedFields = function(){
      // loop each section in the checked model
      for(var _section in $scope.checked){
        // safety check
        if($scope.checked.hasOwnProperty(_section)){
          // clear out this section in the query each time, then add terms based on the current model
          $scope.query[_section] = [];
          // loop each checkbox field for this section
          for(var _key in $scope.checked[_section]){
            // safety check
            if($scope.checked[_section].hasOwnProperty(_key)){
              // if the box is checked, then add the terms to the query
              if($scope.checked[_section][_key]){
                $scope.query[_section] = $scope.query[_section].concat($scope.keyLib[_section][_key]);
              }
            }
          }
        }
      }
    };

    $scope.validateField = function(fieldName, data){
      if(data.length === 1){
        $scope.feedback.errMsgs.push("Please enter a lower AND upper boundary for: " + fieldName);
      }
    };


    // Before you do any validation, remove all null, undefined, and empty values. It'll make it much easier to validate.
    $scope.removeEmpties = function(q){
      for (var _key in q){
        if(q.hasOwnProperty(_key)){
          for(var _m=0; _m<q[_key].length; _m++){
            var _cur = q[_key][_m];
            if(!_cur || typeof(_cur) === "undefined" || _cur === null){
              q[_key].splice(_m, 1);
            }
          }
        }
      }
      return(q);
    };

    $scope.recordAgeBounds = function(q){
      if(q.recordLength.length === 1 && q.ageBound.length === 2){
        if(q.recordLength[0] > (q.ageBound[1] - q.ageBound[0])){
          $scope.feedback.errMsgs.push("The required Record Length is greater than the provided Age Bounds");
        }
      }
      return(q);
    };

    $scope.validate = function(cb){
      $scope.feedback.errMsgs = [];

      var _q = $scope.query;

      _q = $scope.removeEmpties(_q);

      // These fields must have 0 values, or 2 values.
      $scope.validateField("Age Bound", _q.ageBound);
      $scope.validateField("Latitude", _q.lat);
      $scope.validateField("Longitude", _q.lon);
      $scope.validateField("Altitude", _q.alt);

      // These fields must have units if values are present
      if (_q.ageBound.length > 0){
        if(_q.ageUnits.length === 0){
          $scope.feedback.errMsgs.push("When providing Age Bound, you must also provide Age Units");
        }
      } else {
        if (_q.recordLength.length > 0){
          if(_q.ageUnits.length === 0) {
            $scope.feedback.errMsgs.push("When providing Record Length, you must also provide Age Units");
          }
        }
      }

      _q = $scope.recordAgeBounds(_q);
      $scope.query = _q;

      $scope.feedback.errCt = $scope.feedback.errMsgs.length;
      cb();
    };

}]); // end Anonymous

// EXAMPLES


// $scope.resultObjs = [
//   {
//     "dsn": "MD982176.Stott.2004",
//     "url_dataset": "http://wiki.linked.earth/Special:URIResolver/MD982176.Stott.2004",
//     "url_download": "http://wiki.linked.earth/wiki/index.php/Special:WTLiPD?op=export&lipdid=MD982176.Stott.2004"
//   },
//  ...
// ];

// These fields match up with what parameters a LinkedEarth query will accept. They should be "plug-and-play" for
// the python script
// $scope.query = {
//   archiveType: ["marine sediment", "Marine Sediment"],
//   proxyObsType: ["Mg/Ca", "Mg Ca"],
//   infVarType: ["Sea Surface Temperature"],
//   sensorGenus: ["Globigerinoides"],
//   sensorSpecies: ["ruber"],
//   interpName: ["temperature", "Temperature"],
//   interpDetail: ["sea surface"],
//   ageUnits: ["yr BP"],
//   ageBound: [3000, 6000],
//   ageBoundType: ["entirely"],
//   recordLength: [1500],
//   resolution: [100],
//   lat: [-30, 30],
//   lon:  [100, 160],
//   alt:  [-10000, 0],
// };