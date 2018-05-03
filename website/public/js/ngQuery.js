// Controller - Validate Form

var q = angular.module('ngQuery', ["ngMaterial", "ui.bootstrap", "cgBusy", "toaster", "ngColors", "ngFileUpload"]);

q.controller('QueryCtrl', ['$scope', '$log', '$timeout', '$q', '$http', "$uibModal","$sce", "toaster", "Upload",
  function ($scope, $log, $timeout, $q, $http, $uibModal, $sce, toaster, Upload) {

    $scope.dropdowns = {
      // sensorGenus
      // sensorSpecies
      // ageBound
      // ageBoundType
      // recordLength
      // resolution
      // interpName
      // interpDetail

      // ageUnits
      // archiveType
      // proxyObsType
      // infVarType
      // lat
      // lon
      // alt


      "ageBoundType": ["any", "entire", "entirely"],
      "archiveType": create.archiveTypeList(),
      "timeUnit": create.timeUnitList(),
      "inferredVariableType": create.inferredVariableTypeList(),
      "proxyObservationType": create.proxyObservationTypeList(),
    };

    // These fields match up with what parameters a LinkedEarth query will accept. They should be "plug-and-play" for
    // the python script
    $scope.query = {
      archiveType: ["marine sediment", "Marine Sediment"],
      proxyObsType: ["Mg/Ca", "Mg Ca"],
      infVarType: ["Sea Surface Temperature"],
      sensorGenus: ["Globigerinoides"],
      sensorSpecies: ["ruber"],
      interpName: ["temperature", "Temperature"],
      interpDetail: ["sea surface"],
      ageUnits: ["yr BP"],
      ageBound: [3000, 6000],
      ageBoundType: ["entirely"],
      recordLength: [1500],
      resolution: [100],
      lat: [-30, 30],
      lon:  [100, 160],
      alt:  [-10000, 0],

    };

    $scope.formattedQuery = "";
    $scope.queryPretty = JSON.stringify($scope.query, null, 2);

    $scope.addRmArr = function(section, val){

    };

    $scope.getTooltip = function(section, key){
      return create.fieldMetadataLibrary(section, key);
    };


    $scope.submitQuery = function(){
      $scope.uploadQuery($scope.query, function(resp){
        console.log("Received backend response");
        console.log(resp);
        $scope.formattedQuery = resp.data;
        if (resp.status !== 200){
          window.alert("HTTP " + resp.status + ": Error getting query from Python\n" + resp.statusText);
        } else {
          console.log("Looks good! Received query string.");
        }
      });
    };

    $scope.uploadQuery = function (opts, cb) {
      // Upload *validated* lipd data to backend
      Upload.upload({
        url: '/query',
        data: opts
      }).then(function (resp) {
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

    $scope.addSynonym = function(key){
      var _library = {
        "marine sediment": ["Marine Sediment"],
        "Mg/Ca": ["mg ca", "Mg Ca"],
        "temperature": ["Temperature", "temp"],
        "BP": ["year BP", "yr BP", "yr bp", "year bp"],
        "AD": ["year AD", "yr AD", "yr ad", "year ad"],
        "sst": ["SST", "Sea Surface Temperature", "sea surface temperature"],

      };

    };


}]); // end Anonymous
