var t = angular.module('ngFile', ['ngFileUpload']);

// t.run([function() {
//   if (typeof(Storage) !== "undefined") {
//       // Code for localStorage/sessionStorage.
//       sessionStorage.clear();
//       console.log("Session Storage has been cleared");
//   } else {
//       // Sorry! No Web Storage support..
//       console.log("There is no support for Session Storage. Please try a different browser.")
//   }
// } ]);

t.controller('FileCtrl', ['$scope', 'Upload', '$timeout', '$q', '$http',
                          function ($scope, $default, Upload, $timeout, $q, $http) {
    $scope.obj = 'none';
    // refresh all the scopes and bubble changes to the parent
    // $scope.refreshScopes = function(){
    //   $.each(["meta", "pageMeta", "validated", "obj", "errorCt", "geoMarkers"], function(key){
    //     $scope.updateScopesFromChild(key, $scope.$parse(key));
    //   });
    // }

    // Upload VALIDATED lipd data to the database
    $scope.uploadToDb = function (file) {
      // TODO Test upload with the new if statement
      // check that the data has been validated before trying to upload
      if($scope.validated){
        // Use Upload module to send file data to mongodb, and then auto-fill the form fields
        Upload.upload({
            url: '/updb',
            // TODO Test upload when using $scope.userData as source
            // TODO In the future, this should be the whole LiPD file, not just the raw scope metadata
            data: {file: $scope.meta}
            // data: {file: file}
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
      }
    };

    // Link this function to a button that will download the lipd file to the users computer
    $scope.downloadToLocal = function(file){
      // compile data in form fields into a JSON Object

      // Stringify and store that data into SessionStorage

      // Overwrite the jsonld file in the ZIP js data

      // use Zip JS to compress and download the file

    };

    // Use a given filename / response object to pull its document from the database
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

}]);
