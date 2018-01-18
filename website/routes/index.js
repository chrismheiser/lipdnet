var express = require('express');
var fs = require("fs");
var archiver = require('archiver');
var gladstone = require('gladstone');
var path = require("path");
var process = require("process");
var fastcsv = require("fast-csv");
var logger = require("../node_modules_custom/node_log.js");
var lipdValidator = require("../node_modules_custom/node_validator.js");
var misc = require("../node_modules_custom/node_misc.js");
var router = express.Router();

// var http = require("http");
// http.get("http://cheiser.pythonanywhere.com/test", function(res) {
//   console.log("Got response: " + res.statusCode);
// }).on('error', function(e) {
//   console.log("Got error: " + e.message);
// });
//
//
//

var downloadResponse = function(options, res){
  // set headers and initiate download.
  var pathFinal = path.join(options.path, options.file);
  res.setHeader('Content-disposition', 'attachment; filename=' + options.file);
  res.setHeader('Content-type', options.content);
  logger.info(options.message);
  res.download(pathFinal);
};

var writeFiles = function(dat, dst, res, cb){
  try{
    // console.log("writeFiles");
    dat.forEach(function(file){
      for(var _filename in file){
        try{
          logger.info("writing file: " + path.join(dst,  _filename));
          fs.writeFileSync(path.join(dst, _filename), file[_filename]);
        } catch(err){
          res.status(500).send("Unable to process file: " + _filename);
        }
      }
    });
  } catch(err){
    console.log("writeFiles: ", err);
  }
  cb();
};

var parseRequest = function(master, req, res){
  try {
    // set data about the file
    master.files = req.body.file;
    master.filename = req.body.filename;

    // path that stores lipds
    master.pathTop = path.join(process.cwd(), "tmp");
    master.pathTmpPrefix = path.join(master.pathTop, "lipd-");
    return master;
  } catch (err){ 
    logger.info("index.js: parseRequest: " + err);
    res.status(500).send("POST: parseRequest: Error creating LiPD: " + err);
  }
};

var parseRequestNoaa = function(master, req, res){
  try {
    // set data about the file
    master.dat = req.body.dat;
    master.name = req.body.name;

    // path that stores noaas
    master.pathTop = path.join(process.cwd(), "tmp");
    master.pathTmpPrefix = path.join(master.pathTop, "noaa-");
    return master;
  } catch (err){
    logger.info("index.js: parseRequestNoaa: " + err);
    res.status(500).send("POST: parseRequestNoaa: Error creating Noaa: " + err);
  }
};

var createTmpDir = function(master){
  try {
    // create tmp folder at "/tmp/<lipd-xxxxx>"
    // logger.info("POST: creating tmp dir...");
    master.pathTmp = misc.makeid(master.pathTmpPrefix, function(_pathTmp){
      // logger.info("POST: created tmp dir str: " + _pathTmp);
      try{
        logger.info("mkdir: " + _pathTmp);
        mkdirSync(_pathTmp);
      } catch(err){
        logger.info("createTmpDir: Couldn't mkdirs" + err);
      }
      return _pathTmp;
    });
    return master;
  }catch(err){
    logger.info("createTmpDir: error making tmp IDs: " + err);
    res.status(500).send("createTmpDir: error making tmp IDs: " + err);
  }
};

// Create the subfolders
var createSubdirs = function(master, pathTmp){
    logger.info("createSubdirs");
    try{
      // tmp bagit level folder. will be removed before zipping.
      master.pathTmpBag = path.join(master.pathTmp, "bag");
      master.pathTmpZip = path.join(master.pathTmp, "zip");
      master.pathTmpFiles = path.join(master.pathTmp, "files");

      // logger.info("POST: make other dirs...");
      mkdirSync(master.pathTmpZip);
      mkdirSync(master.pathTmpFiles);
      return master;
      // logger.info("POST: created dir: " + pathTmpZip);
      // logger.info("POST: created dir: " + pathTmpFiles);
    } catch(err){
      logger.info("index.js: createSubdirs: " + err);
      res.status(500).send("POST: createSubdirs: Error creating LiPD: " + err);
    }
};

// Use the data in the objects given to update the tsid_master.csv
var updateTSidMaster = function(_objs, cb){
  logger.info("index: updateTSidMaster");
  var _path = path.join(process.cwd(), "tmp", "tsid_master.csv");
  logger.info("path to tsid master: " + _path);
  for (var _i=0; _i<_objs.length; _i++){
    var _csv_str = "";
    if(_i===0){
      _csv_str += "\r\n";
    }
    _csv_str += _objs[_i]["tsid"] + ", " + _objs[_i]["datasetname"] + ", " + _objs[_i]["variableName"] + ", , " +"\r\n";
    fs.appendFile(_path, _csv_str, function (err) {
    if (err) throw err;
    // logger.info('data appended!');
    });
  }
  cb(_objs);
};

// Use the TSids in the objects given to update the tsid_only.csv file.
var updateTSidOnly = function(_objs){
  logger.info("index: updateTSidOnly");
  var _path = path.join(process.cwd(), "tmp", "tsid_only.csv");
  logger.info("path to tsid only: " + _path);
  for (var _i=0; _i<_objs.length; _i++){
    var _csv_str = "";
    if(_i===0){
      _csv_str += "\r\n";
    }
    _csv_str += _objs[_i]["tsid"] + "\r\n";
    fs.appendFile(_path, _csv_str, function (err) {
    if (err) logger.info(err);
    // logger.info('data appended!');
    });
  }
};

// Read the tsid_only.csv file, and put the TSids in a flat array.
var readTSidOnly = function(cb){
  logger.info("index: readTSidOnly");
  var _path = path.join(process.cwd(), "tmp", "tsid_only.csv");
  logger.info("path to tsid only: " + _path);
  var _data = [];
  try{
    logger.info("try to read from csv file.");
    fastcsv
     .fromPath(_path)
     .on("data", function(_entry){
       // row comes as an array of one string. just grab the string.
        _data.push(_entry[0]);
     })
     .on("end", function(){
      //  logger.info(_data);
       cb(_data);
     });
  } catch(err){
    logger.info(err);
  }
};

// create a directory, but catch error when the dir already exists.
var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch(e) {
    if ( e.code == 'EEXIST' ){
      logger.info("folder exists: " + path);
    } else {
      logger.info(e);
    }
  }
};


var walk = function(directoryName) {
  fs.readdir(directoryName, function(e, files) {
    if (e) {
      console.log('Error: ', e);
      return;
    }
    files.forEach(function(file) {
      var fullPath = path.join(directoryName,file);
      fs.stat(fullPath, function(e, f) {
        if (e) {
          console.log('Error: ', e);
          return;
        }
        if (f.isDirectory()) {
          walk(fullPath);
        } else {
          console.log('- ' + fullPath);
        }
      });
    });
  });
};

var createArchiveNoaa = function(pathTmpNoaa, cb){
  logger.info("Creating NOAA archive...");
  var archive = archiver('zip');
  var _origin = process.cwd();
  process.chdir(pathTmpNoaa);
  // path where the NOAA archive write to
  var pathTmpNoaaZip = path.join(pathTmpNoaa, "noaa_archive.zip");
  // open write stream to LiPD file location
  var output = fs.createWriteStream(pathTmpNoaaZip);
  logger.info("Write Stream Open: " + pathTmpNoaaZip);

  // "close" event. processing is finished.
  output.on('close', function () {
    logger.info(archive.pointer() + ' total bytes');
    // logger.info('archiver has been finalized and the output file descriptor has closed.');
    logger.info("ZIP Created at: " + pathTmpNoaaZip);
    // callback to finish POST request
    process.chdir(_origin);
    cb();
  });

  // error event
  archive.on('error', function(err){
    logger.info("archive error");
    throw err;
  });

  archive.pipe(output);
  // Add the data directory to the archive
  try {
    logger.info("Archiving NOAA text files: " + pathTmpNoaa);
    try {
      // read in all filenames from the "/bag" dir
      var files = fs.readdirSync(pathTmpNoaa);
      for (var i in files) {
        // if this is a text file (.txt) archive it
        if (path.extname(files[i]) === ".txt") {
          logger.info("archiving: " + files[i]);
          archive.file(files[i], {name: files[i]});
        }
      }
    } catch (err) {
      logger.info(err);
    }
  }catch(err){
    logger.info(err);
  }
  // all files are done, finalize the archive
  archive.finalize();
};

// use the archiver model to create the LiPD file
var createArchive = function(pathTmp, pathTmpZip, pathTmpBag, filename, cb){
  try{
    logger.info("Creating ZIP/LiPD archive...");
    var archive = archiver('zip');
    var _origin = process.cwd();
    process.chdir(pathTmp);
    // path where the LiPD will ultimately be located in "/zip" dir.
    var pathTmpZipLipd = path.join(pathTmpZip, filename);
    // open write stream to LiPD file location
    var output = fs.createWriteStream(pathTmpZipLipd);
    logger.info("Write Stream Open: " + pathTmpZipLipd);

    // "close" event. processing is finished.
    output.on('close', function () {
      logger.info(archive.pointer() + ' total bytes');
      // logger.info('archiver has been finalized and the output file descriptor has closed.');
      logger.info("LiPD Created at: " + pathTmpZipLipd);
      // callback to finish POST request
      process.chdir(_origin);
      cb();
    });

    // error event
    archive.on('error', function(err){
      logger.info("archive error");
      throw err;
    });

    archive.pipe(output);
    // Add the data directory to the archive
    try{
      logger.info("Archiving bag directory: " + pathTmpBag);
      archive.directory("bag");
      logger.info("Archive bag success");
    }catch(err){
      logger.info("Error archive bag directory: " + err);
    }

    // all files are done, finalize the archive
    archive.finalize();
  } catch(err){
    console.log("Error: createArchive: " + err);
  }

}; // end createArchive

// Get the home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

// Receive a POST from the contact form on the home page
router.post('/', function(req, res, next){
  // logger.info(req.body);
});

// Get the schema page
router.get('/schema', function(req, res, next){
    res.render('schema', {title: 'Schema'});
});

// Get the upload page
router.get('/validator', function(req, res, next){
  res.render('validator', {title: 'Validator'});
});

router.post("/files", function(req, res, next){
  logger.info("POST: /files");
  // REQ
  //
  var master = {};
  master = parseRequest(master, req, res);
  master = createTmpDir(master);
  master = createSubdirs(master);
  try{
    // use req data to write csv and jsonld files into "/files/<lipd-xxxxx>/files/"
    writeFiles(master.files, master.pathTmpFiles, res, function(){});

    logger.info("Start Bagit...");
    // Call bagit process on folder of files
    gladstone.createBagDirectory({
       bagName: master.pathTmpBag,
       originDirectory: master.pathTmpFiles,
       cryptoMethod: 'md5',
       sourceOrganization: 'LiPD Project',
       contactName: 'Chris Heiser',
       contactEmail: 'lipd.contact@gmail.com',
       externalDescription: 'Source: LiPD Online Validator'
    }).then(function(resp){
      // create the tagmanifest bagit file. We have to wait because it needs the other bagit files to be written first.
      gladstone.createTagmanifest({
        bagName: master.pathTmpBag,
        originDirectory: master.pathTmpFiles,
        cryptoMethod: 'md5',
        sourceOrganization: 'LiPD Project',
        contactName: 'Chris Heiser',
        contactEmail: 'lipd.contact@gmail.com',
        externalDescription: 'Source: LiPD Online Validator'
      }).then(function(resp2){
        // When a successful Bagit Promise returns, start creating the ZIP/LiPD archive
        if(resp2){
          createArchive(master.pathTmp, master.pathTmpZip, master.pathTmpBag, master.filename, function(){
            logger.info("Callback createArchive");
            logger.info("POST: " + path.basename(master.pathTmp));
            res.status(200).send(path.basename(master.pathTmp));
          });
        } else {
          logger.info(resp2);
          res.status(500).send("POST: Error: Bagit promise not fulfilled");
        }
      });
    });
  } catch(err) {
    logger.info(err);
    res.status(500).send("POST: Error creating LiPD: " + err);
  }
});

router.get("/files/:tmp", function(req, res, next){
  try {
    // Tmp string provided by client
    logger.info("/files get");
    var tmpStr = req.params.tmp;
    logger.info("/files get: " + tmpStr);
    // walk(path.join(process.cwd(), "tmp", tmpStr));
    // Path to the zip dir that holds the LiPD file
    var pathTmpZip = path.join(process.cwd(), "tmp", tmpStr, "zip");
    // Read in all filenames from the dir
    logger.info("/files get: LiPD File: " + pathTmpZip);
    var files = fs.readdirSync(pathTmpZip);
    // Loop over the files found
    for(var i in files) {
      // Get the first lipd file you find (there should only be one)
       if(path.extname(files[i]) === ".lpd") {
         var options = {"path": pathTmpZip, "file": files[i], "content": "application/zip", "message": "/files get: Sending LiPD to client"};
         downloadResponse(options, res);
       }
    }
  } catch(err) {
    logger.info(err);
    res.status(500).send("GET: Error downloading LiPD file: " + err);
  }
});

router.post("/noaa", function(req, res, next){
  try{
    // Parse the angular request data into a form that we can use
    var master = {};
    master = parseRequestNoaa(master, req, res);
    master = createTmpDir(master);
    try {
      // Bring in the request module to work some magic
      var request = require('request');
      // Pack up the options that we want to give the request module
      var options = {
        uri: 'http://cheiser.pythonanywhere.com/api/noaa',
        method: 'POST',
        json: master.dat,
        timeout: 5000,
        proxy: "http://rishi.cefns.nau.edu:3128"
      };
      // Send the request to the NOAA API
      console.log("Sending LiPD data to NOAA Conversion API: ", master.name);
      // console.log("PORT : ", app.get("port"));
      request(options, function (error, response, body) {
        console.log("Response Status: ", response.statusCode);
        // Did the call work?
        if (!error && response.statusCode == 200) {
          // Huzzah! We have a good response
          // console.log("# NOAA files received: ", body.length);
          logger.info("NOAA tmp folder ID: " + path.basename(master.pathTmp));
          // Write the NOAA data to the tmp folder as text files
          try {
            console.log("Received Data from NOAA API");
            writeFiles(body, master.pathTmp, res, function(){
              if(fs.readdirSync(master.pathTmp).length !== 0){
                res.status(200).send(path.basename(master.pathTmp));
              } else {
                res.status(response.statusCode).send("/noaa post: Error occurred during conversion/write process");
              }
            });
          } catch(err){
            console.log("/noaa post: Error while writing txt files to tmp: ", err);
            res.status(response.statusCode).send("/noaa post: Error while writing txt files to tmp: " + error);
          }
        } else{
          // Yikes, something went wrong on in the flask app. Initiate damage control.
          console.log("/noaa post: Bad response from NOAA API: ", error);
          res.status(response.statusCode).send("/noaa post: Bad response from NOAA API: " + error);
        }
      });
    } catch(err){
      // Yikes, communication problems.
      console.log("/noaa post: Error preparing & sending NOAA API request: ", err);
      res.status(500).send("/noaa post: Error preparing & sending NOAA API request: " + err);

    }
  } catch(err){
    // Yikes, I messed this up somewhere.
    console.log("/noaa post: Error parsing data request sent from angular: " + err);
    res.status(500).send("/noaa post: Error parsing data request sent from angular: " + err);

  }
});

router.get("/noaa/:tmp", function(req, res, next){
  try {
    logger.info("/noaa get: Ya! Take it away, Ern!");
    // NOAA ID provided by client
    var tmpStr = req.params.tmp;
    logger.info("/noaa get: NOAA ID: " + tmpStr);
    // walk(path.join(process.cwd(), "tmp", tmpStr));
    // Full path to the zip dir that holds the NOAA file(s)
    // var pathTmp = path.join(process.cwd(), "tmp");
    var pathTmpNoaa = path.join(process.cwd(), "tmp", tmpStr);
    // Read in all filenames from the dir
    logger.info("/noaa get: Reading from: " + pathTmpNoaa);
    var files = fs.readdirSync(pathTmpNoaa);
    console.log("Found files, I hope: ");
    console.log("File Count: ", files.length);
    console.log(files);
    if (files.length === 1){
      var options = {"path": pathTmpNoaa, "file": files[0], "content": "text/plain", "message": "/noaa get: Sending NOAA txt to client"};
      downloadResponse(options, res);
    } else if (files.length > 1){
      // zip up the files into a single download
      createArchiveNoaa(pathTmpNoaa, function(){
        var options = {"path": pathTmpNoaa, "file": "noaa_archive.zip", "content": "application/zip", "message": "/noaa get: Sending NOAA zip to client"};
        downloadResponse(options, res);
      });
    } else {
      res.status(500).send("/noaa get: Error, no NOAA files were created for the given ID");
    }

  } catch(err) {
    logger.info("/noaa get: Error downloading NOAA file(s): ", err);
    res.status(500).send("/noaa get: Error downloading NOAA file(s): ", err);
  }
});

router.get("/create", function(req, res, next){
  res.render('create', {title: 'Create & Edit LiPD'});
});

router.get("/modal-file", function(req, res, next){
  res.render('modal/modal-file', {title: ''});
});

router.get("/modal-interp-create", function(req, res, next){
  res.render('modal/modal-interp-create', {title: ''});
});

router.get("/modal-interp-data", function(req, res, next){
  res.render('modal/modal-interp-data', {title: ''});
});

router.get("/modal-alert", function(req, res, next){
  res.render('modal/modal-alert', {title: ''});
});

router.get("/modal-ask", function(req, res, next){
  res.render('modal/modal-ask', {title: ''});
});

router.get("/loading", function(req, res, next){
  res.render("loading", {title: ""});
});

// API
router.post("/api/validator", function(req, res, next){
  logger.info("------------------------");
  logger.info("enter /api/validator");
  // We are using this as a validation call for our desktop utilities.
  // GET with some JSON, and we'll tell you if it pass/fail and what errors came up.

  try {
    // receive some json data
    var _json_data = {};
    try{
      // When receiving a request from Python (and possibly others),
      // we have to parse the JSON object from the JSON string first.
      logger.info("index: Parsing JSON.");
      _json_data = JSON.parse(req.body.json_payload);
    } catch(err){
      // If parsing didn't work, it's likely we don't need it. This is probably valid JSON already.
      logger.info("index: Parsing JSON failed. Ending request: " + err);
      res.status(400).send("HTTP 400: Parsing JSON failed: " + err);
      // var json_data = req.body["json_payload"];
    }
    logger.info("index: Starting process...");
    lipdValidator.validate_w_restructure(_json_data, {"fileUploaded": true}, function(j){
      logger.info("index: validate_w_restructure callback");
      try {
        logger.info("index: Validate callback, preparing response");
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(j, null, 3));
        logger.info("index: Response sent to origin");
      } catch(err) {
        logger.info("index: Error preparing response. Ending request: " + err);
        res.status(400).send("HTTP 400: Error preparing response: " + err);
      }
    });
  } catch(err) {
    logger.info("index: Validation failed: " + err);
    res.status(400).send("HTTP 400: Validation failed: " + err);
  }

  // logger.info("exit /api/validator");
});


// Use data from a LiPD file to create TSids, register them in the master list, and send data in response
router.post("/api/tsid/create", function(req, res, next){
  logger.info("/api/tsid/create");
  try {
    // Number of TSids that need to be generated
    var _count = req.body.count;
    // One object per variable that needs a TSid created.
    // example = [{"TSid": "", "dataSetName": "", "variableName": "", "spreadsheetKey": "", "worksheetKey":""}, ..]
    var _objs = req.body.data;
    logger.info("Creating TSids: " + _count);
    if (_count > 200){
      res.status(400).send({"error": "Requested too many TSids. Please request a smaller amount per call."});
      res.end();
    }
    readTSidOnly(function(_tsids){
      // Now we have an array of all the registered TSids
      misc.reconcileTSidCreate(_tsids, _objs, function(_x){
        // logger.info("At the end!");
        // logger.info(_x);
        // append the new TSids to tsid_only.csv
        updateTSidOnly(_x);
        // append the new object data (w/ tsids) to tsid_master.csv
        updateTSidMaster(_x, function(_results){
          logger.info("TSids created successfuly");
          // since the update was successsful, add the new JSON objects to the response and send.
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify(_results, null));
        });
      });
    });
  } catch (err) {
    logger.info(err);
    logger.info(err);
    res.end();
  }
});

// Given some TSids from a LiPD file, register its TSids in our master list.
router.post("/api/tsid/register", function(req, res, next){
  logger.info("/api/tsid/register");
  // Receive an array of JSON objects. Each with 4 fields:
  // example = {"TSid", "dataSetName", "variableName", "spreadsheetKey", "worksheetKey"}
  try{
    var _objs = req.body.data;
    readTSidOnly(function(_tsids){
      misc.reconcileTSidRegister(_tsids, _objs, function(_x){
        updateTSidOnly(_x);
        // append the new object data (w/ tsids) to tsid_master.csv
        updateTSidMaster(_x, function(_results){
          // since the update was successsful, add the new JSON objects to the response and send.
          // res.setHeader('Content-Type', 'application/json');
          // res.send(JSON.stringify(_results, null));
          logger.info("TSids registered successfuly");
          res.status(200).send({"response": "Registered TSids successfuly"});
        });
      });
    });
  } catch(err){
    logger.info(err);
    logger.info(err);
    res.end();
  }

});


module.exports = router;
