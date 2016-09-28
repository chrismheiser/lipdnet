var t = angular.module('ngFile', ['ngFileUpload']);

t.controller('FileCtrl', ['$scope', 'Upload', '$timeout', '$q', '$http', function ($scope, Upload, $timeout, $q, $http) {
    $scope.obj = 'none';


    // Link this function to a button that will push the lipd data to the mongo db
    $scope.uploadToSession = function(file){

      // Use upload to bring file into session data
      Upload.upload({
          url: '/upss',
          data: {file: file}
      }).then(function (resp) {
          console.log('Success ' + resp.config.data.file.name + ' uploaded. Response: ' + resp.data);
          console.log(resp.data);
          $scope.obj = resp.data;
      }, function (resp) {
          console.log('Error status: ' + resp.status);
      }, function (evt) {
          // This has yet to work correctly. Not sure why this event is not ever triggering
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          // console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      });
    };


    // Upload is called when a user selects a local file from the 'browse for file' gui.
    $scope.uploadToDb = function (file) {

      // Use Upload module to send file data to mongodb, and then auto-fill the form fields
      Upload.upload({
          url: '/updb',
          data: {file: file}
      }).then(function (resp) {

          // Check in console that everything was sent okay.
          console.log('Success ' + resp.config.data.file.name + ' uploaded. Response: ' + resp.data);
          console.log(resp.data);
          // Scrape the metadata from the response object, and set it to our scope object.
          // We mostly want the unique upload path, but may have use for the other data later.
          $scope.obj = resp.data;

      }, function (resp) {

          console.log('Error status: ' + resp.status);

      }, function (evt) {

          // This has yet to work correctly. Not sure why this event is not ever triggering
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          // console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);

      });
    };



    // Link this function to a button that will download the lipd file to the users computer
    $scope.downloadToLocal = function(file){

    };

    $scope.pullFromDb = function(data){

      // Get the unique upload path
      var np = $scope.obj.filename;
      console.log('PULL PATH: ' + np )

      // Return the lipd data. Use the unqiue path to http get the stored LiPD metadata
      return $http.get(np).success(function(data){
          // If the http call was a success, then we got the LiPD metadata
          // $scope.content = data;
          // Set the lipd metadata to the browser sessionStorage
          sessionStorage.setItem("lipd", JSON.stringify(data));
          // Check console that correct data was received
          console.log(data);
      });
    };

    $scope.parse = function(data){
      // do a $.each loop on the LiPD data and put it in $scope.userData whenever it's a valid key
      // keep track of the invalid keys and present them to the user.
      // "No match for these entries. Please enter the data into one of the valid fields above"
    };

    $scope.processData = function(){
      // step one
      // Pull is automatically called when a file is uploaded and a unique upload path is found.

      // step two
      // Parse through LiPD metadata and assign data to FormCtrl UserData object wherever possible
      // Adding to UserData will automatically insert data into fields since they are linked with angular


      // create a promise object
      var deferred = $q.defer();

      // use our above functions to create a promise chain. then set the output to the $scope.content
      $scope.content = deferred.promise.then(pull()).then(parse(data));

      // figure out how to set the content to the $scope.userData as well
      $scope.userData = $scope.content
      $scope.content = $scope.processData();
    };


}]);
