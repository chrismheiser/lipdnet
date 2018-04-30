// Controller - Validate Form

var q = angular.module('ngQuery', ["ngMaterial", "ui.bootstrap", "cgBusy", "toaster", "ngColors"]);

q.controller('QueryCtrl', ['$scope', '$log', '$timeout', '$q', '$http', "$uibModal","$sce", "toaster",
  function ($scope, $log, $timeout, $q, $http, $uibModal, $sce, toaster) {

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

    $scope.query = {
      archiveType: ["marine sediment", "Marine Sediment"],
      proxyObsType: ["Mg/Ca", "Mg Ca"],
      infVarType: ["Sea Surface Temperature"],
      sensorGenus: ["Globigerinoides"],
      sensorSpecies: ["ruber"],
      interpName: ["temperature", "Temperature"],
      interpDetail: ["sea surface"],
      ageUnits: ["BP"],
      ageBound: [3000, 6000],
      ageBoundType: ["entirely"],
      recordLength: [1500],
      resolution: [100],
      lat: [-30, 30],
      lon:  [100, 160],
      alt:  [-10000, 0],

    };

    $scope.addRmArr = function(section, val){

    };

    $scope.getTooltip = function(section, key){
      return create.fieldMetadataLibrary(section, key);
    };


    $scope.syn = function(key){

    };


}]); // end Anonymous
