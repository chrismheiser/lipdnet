var t = angular.module('ngFile', ['ngFileUpload']);

t.run([function() {
  if (typeof(Storage) !== "undefined") {
      // Code for localStorage/sessionStorage.
      sessionStorage.clear();
      console.log("Session Storage has been cleared");
  } else {
      // Sorry! No Web Storage support..
      console.log("There is no support for Session Storage. Please try a different browser.")
  }
} ]);

t.controller('FileCtrl', ['$scope', 'Upload', '$timeout', '$q', '$http',
                          function ($scope, $default, Upload, $timeout, $q, $http) {
    $scope.obj = 'none';
    $scope.meta = $scope.$parent.meta;
    $scope.pageMeta = $scope.$parent.pageMeta;
    $scope.validated = $scope.$parent.validated;
    $scope.geoMarkers = $scope.$parent.geoMarkers;
    $scope.errors = {
      "missingKeys": [],
      "errStructure": [],
      "unknownKeys": [],
      "warningCount": 0,
      "errorCount": 0,
    }
    $scope.parseComplete = false;

    // refresh all the scopes and bubble changes to the parent
    $scope.refreshScopes = function(){
      $.each(["meta", "pageMeta", "validated", "obj", "errorCt", "geoMarkers"], function(key){
        $scope.updateScopesFromChild(key, $scope.$parse(key));
      });
    }

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

    // add a pause in between functions
    $scope.wait = function(ms){
       var start = new Date().getTime();
       var end = start;
       while(end < start + ms) {
         end = new Date().getTime();
      }
    }


    // parse chronData section
    $scope.parseChronData = function(value){
      console.log("parsing chron data");
      var colVars = {"Variable Name": "variableName", "Description": "description", "Units": "units"};
      try{
        if(typeof(value[0]) === "object" && value[0].hasOwnProperty("chronMeasurementTable")){
          // measurement table data
          var table = value[0].chronMeasurementTable[0];
          var numOfCols = table.columns.length
          // set the table level data
          $scope.meta.chronData.chronMeasurementTable.filename = table.filename;
          $scope.meta.chronData.chronMeasurementTable.tableName = table.chronTableName;
          // loop through and make one column entry on the web page for each column found in the table
          for(i=1; i<numOfCols; i++){
            // since tables start with 1 column by default, only add n-1 columns
            $scope.addColumnChron();
          }
          // loop through and set the inner column data
          for(i=0; i<numOfCols; i++){
            $.each(colVars, function(prettyName, lipdName){
              try{
                $scope.colsChron[i][prettyName] = table.columns[i][lipdName];
              }catch(err){
                console.log(err);
              }
            });
          }
        } else {
          console.log("Not a valid chronData table.");
          $scope.errorCt++;
        }

        if (typeof(value[0]) === "object" && value[0].hasOwnProperty("chronModel")){
          console.log("found chron model");
        } else {
          console.log("no chron model");
        }
      } catch(err) {
        console.log(err);
        $scope.errorCt++;
      }
    }
    // parse chronData section
    $scope.parsePaleoData = function(value){
      console.log("parsing paleo data");
      var colVars = {"Variable Name": "variableName", "Description": "description", "Units": "units"};
      try{
        if(typeof(value[0]) === "object" && value[0].hasOwnProperty("paleoMeasurementTable")){
          // measurement table data
          var table = value[0].paleoMeasurementTable[0];
          var numOfCols = table.columns.length
          // set the table level data
          $scope.meta.paleoData.paleoMeasurementTable.filename = table.filename;
          $scope.meta.paleoData.paleoMeasurementTable.tableName = table.paleoDataTableName;
          // loop through and make one column entry on the web page for each column found in the table
          for(i=1; i<numOfCols; i++){
            // since tables start with 1 column by default, only add n-1 columns
            $scope.addColumnPaleo();
          }
          // loop through and set the inner column data
          for(i=0; i<numOfCols; i++){
            $.each(colVars, function(prettyName, lipdName){
              try{
                $scope.colsPaleo[i][prettyName] = table.columns[i][lipdName];
              }catch(err){
                console.log(err);
              }
            });
          }
        } else {
          console.log("Not a valid paleoData table.");
          $scope.errorCt++;
        }
        // model table data
        if(typeof(value[0]) === "object" && value[0].hasOwnProperty("paleoModel")){
          console.log("found paleo model")
        } else {
          console.log("no paleo model.");
        }
      } catch(err) {
        console.log(err);
        $scope.errorCt++;
      }
    }

    $scope.parseGeo = function(value){
      $scope.geo.type = value.type;
      $scope.geo.geometry.type = value.geometry.type;
      $scope.geoMarkers[0].latitude = value.geometry.coordinates[0]
      $scope.geoMarkers[0].longitude = value.geometry.coordinates[1]
      $scope.geoMarkers[0].elevation = value.geometry.coordinates[2]

    }


    $scope.verifySection = function(){

    }

    // Parse and place the metadata in the correct fields on the page
    $scope.parseMetadata = function(dat){
      // do a $.each loop on the LiPD data and put it in $scope.userData whenever it's a valid key
      // keep track of the invalid keys and present them to the user.
      // "No match for these entries. Please enter the data into one of the valid fields above"

      // set the json data directly into the scope.
      $scope.meta = dat
      // Trigger the userData toggle, which animate the form fields to show all values.
      $scope.pageMeta.toggle = true;

      console.log("start looping metadata!")
      // start looping for all keys in the metadata
      $.each(dat,function(key, value){
        console.log(key);
        if(key == "chronData"){
          $scope.parseChronData(value);
        } else if(key == "paleoData"){
          $scope.parsePaleoData(value);
        } else if(key == "funding"){
          $scope.parseFunding(value);
        } else if(key == "investigators"){
          $scope.parseInvestigators(value);
        } else if(key == "pub"){
          $scope.parsePub(value);
        } else if(key == "geo"){
          $scope.parseGeo(value);
        } else {
          if(key.toLowerCase() == "lipdversion"){
            $scope.meta.lipdVersion = value;
          }
          $scope.meta[key] = value;
        }
      });
      // do a refresh on all the scopes so they bubble back up to the parent
      $scope.parseComplete = true;
      $scope.refreshScopes();
    };


    // ANONYMOUS FUNCTIONS

    // Set up zip.js object and its corresponding functions
    (function(obj) {

      	var requestFileSystem = obj.webkitRequestFileSystem || obj.mozRequestFileSystem || obj.requestFileSystem;

      	function onerror(message) {
      		alert(message);
      	}

      	function createTempFile(callback) {
      		var tmpFilename = "tmp.dat";
      		requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem) {
      			function create() {
      				filesystem.root.getFile(tmpFilename, {
      					create : true
      				}, function(zipFile) {
      					callback(zipFile);
      				});
      			}

      			filesystem.root.getFile(tmpFilename, null, function(entry) {
      				entry.remove(create, create);
      			}, create);
      		});
      	}

      	var model = (function() {
      		var URL = obj.mozURL || obj.URL;

      		return {
      			getEntries : function(file, onend) {
      				zip.createReader(new zip.BlobReader(file), function(zipReader) {
      					zipReader.getEntries(onend);
      				}, onerror);
      			},
      			getEntryFile : function(entry, creationMethod, onend, onprogress) {
      				var writer, zipFileEntry;

      				function getData() {
      					entry.getData(writer, function(blob) {
      						var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
      						onend(blobURL);
      					}, onprogress);
      				}

      				if (creationMethod == "Blob") {
      					writer = new zip.BlobWriter();
      					getData();
      				} else {
      					createTempFile(function(fileEntry) {
      						zipFileEntry = fileEntry;
      						writer = new zip.FileWriter(zipFileEntry);
      						getData();
      					});
      				}
      			},
      			getEntryFileData : function(entry, creationMethod, onend, onprogress) {
      				var writer, zipFileEntry;

      				function getData() {
      					entry.getData(writer, function(blob) {
      						var blobURL = creationMethod == "Blob" ? URL.createObjectURL(blob) : zipFileEntry.toURL();
      						onend(blobURL);
      					}, onprogress);
      				}

      				if (creationMethod == "Blob") {
      					writer = new zip.BlobWriter();
      					return getData();
      				} else {
      					createTempFile(function(fileEntry) {
      						zipFileEntry = fileEntry;
      						writer = new zip.FileWriter(zipFileEntry);
      						 onend(getData());
      					});
      				}
      			}
      		};
      	})();

    // Attach to respective DOM elements and set up listener for change event on file-input
    // When file is uploaded, it will trigger data to be set to sessionStorage and be parsed.
    (function() {

      // Attach to DOM elements related to zip upload
  		var fileInput = document.getElementById("file-input");
  		var unzipProgress = document.createElement("progress");
  		var fileList = document.getElementById("file-list");
  		var creationMethodInput = document.getElementById("creation-method-input");

      // Trigger download event when user clicks a zip file link.
  		function download(entry, li, a) {
  			model.getEntryFile(entry, creationMethodInput.value, function(blobURL) {
  				// create the click event
  				var clickEvent = document.createEvent("MouseEvent");
  				// when finished unzip, remove child node
  				if (unzipProgress.parentNode)
  					unzipProgress.parentNode.removeChild(unzipProgress);
  				// unzip progress initialize at 0
  				unzipProgress.value = 0;
  				unzipProgress.max = 0;
  				// add mouse event to click event
  				clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  				// 'a href' tag gets updated with the blob url to the file data
  				a.href = blobURL;
  				// 'download' tag gets updated with original entry filename
  				a.download = entry.filename;
  				// dispatch and execute the click event
  				a.dispatchEvent(clickEvent);
  			}, function(current, total) {
  				// start unzipping and track the progress
  				unzipProgress.value = current;
  				unzipProgress.max = total;
  				li.appendChild(unzipProgress);
  			});
  		}

  		// TODO
      // Create all download links upfront. Don't wait for user click-event. Just make them.
  		function getWithoutDownload(entry, li, a) {
  			model.getEntryFileData(entry, creationMethodInput.value, function(blobURL) {
  				if (unzipProgress.parentNode)
  					unzipProgress.parentNode.removeChild(unzipProgress);
  				unzipProgress.value = 0;
  				unzipProgress.max = 0;
  				a.href = blobURL;
  				a.download = entry.filename;
  			}, function(current, total) {
  				unzipProgress.value = current;
  				unzipProgress.max = total;
  				li.appendChild(unzipProgress);
  			});
  		}

  		if (typeof requestFileSystem == "undefined")
  			creationMethodInput.options.length = 1;

  		// When a file is chosen for upload, trigger the change event
  		fileInput.addEventListener('change', function() {
  			// disable the file input after a file has been chosen.
  			fileInput.disabled = true;
  			// get a list of file entries inside this zip
  			model.getEntries(fileInput.files[0], function(entries) {
  				fileList.innerHTML = "";
  				// loop for each file in the zip
  				entries.forEach(function(entry) {
  					var li = document.createElement("li");
  					var a = document.createElement("a");
  					// display the name of the file in the page
  					a.textContent = entry.filename;
  					// defaults link to nothing until click even is activated.
  					a.href = "#";
  					// when user clicks on file name in list, then trigger download file
  					a.addEventListener("click", function(event) {
  						// if click even activated, and file has not been downloaded yet, then go get data, create download link, and download
  						if (!a.download) {
  							download(entry, li, a);
  							event.preventDefault();
  							return false;
  						}
  						// if file was already downloaded, then skip the legwork and go straight to downloading the file
  					}, false);
  					// check if this is the jsonld file. If it is, we want to load the data into the sesson storage.
  					if(entry.filename.indexOf(".jsonld") >= 0){
  			      // get the data from the jsonld file, and set it to the sessionStorage
  			    	entry.getData(new zip.TextWriter(), function(text) {

  			        // Set the text contains the entry data as a String
  							sessionStorage.setItem("metadata", text);

                // wrap parse function in $apply, so the view is updated with the new information
                $scope.$apply(function(){
                  // parse text into a JSON object, and then parse the metadata
                  console.log("call parseMetadata form event listener. ")
                  $scope.parseMetadata(JSON.parse(text));
                });
  			      }, function(current, total) {
  			        // onprogress callback
  			      });
  					}

  					// replace 'a'  tag with our new modified 'a' tag
  					li.appendChild(a);
  					// replace 'li' tag with new modified 'li' tag
  					fileList.appendChild(li);
  				});
  			});
  			// once the change even has triggered, it cannot be triggered again until page refreshes.
  		}, false);
  	})();

  })(this);

}]);
