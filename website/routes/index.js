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

// Use the data in the objects given to update the tsid_master.csv
var updateTSidMaster = function(_objs, cb){
  console.log("index: updateTSidMaster");
  var _path = path.join(process.cwd(), "tmp", "tsid_master.csv");
  console.log("path to tsid master: " + _path);
  for (var _i=0; _i<_objs.length; _i++){
    var _csv_str = "";
    if(_i===0){
      _csv_str += "\r\n";
    }
    _csv_str += _objs[_i]["tsid"] + ", " + _objs[_i]["datasetname"] + ", " + _objs[_i]["variableName"] + ", , " +"\r\n";
    fs.appendFile(_path, _csv_str, function (err) {
    if (err) throw err;
    // console.log('data appended!');
    });
  }
  cb(_objs);
};

// Use the TSids in the objects given to update the tsid_only.csv file.
var updateTSidOnly = function(_objs){
  console.log("index: updateTSidOnly");
  var _path = path.join(process.cwd(), "tmp", "tsid_only.csv");
  console.log("path to tsid only: " + _path);
  for (var _i=0; _i<_objs.length; _i++){
    var _csv_str = "";
    if(_i===0){
      _csv_str += "\r\n";
    }
    _csv_str += _objs[_i]["tsid"] + "\r\n";
    fs.appendFile(_path, _csv_str, function (err) {
    if (err) console.log(err);
    // console.log('data appended!');
    });
  }
};

// Read the tsid_only.csv file, and put the TSids in a flat array.
var readTSidOnly = function(cb){
  console.log("index: readTSidOnly");
  var _path = path.join(process.cwd(), "tmp", "tsid_only.csv");
  console.log("path to tsid only: " + _path);
  var _data = [];
  try{
    console.log("try to read from csv file.");
    fastcsv
     .fromPath(_path)
     .on("data", function(_entry){
       // row comes as an array of one string. just grab the string.
        _data.push(_entry[0]);
     })
     .on("end", function(){
      //  console.log(_data);
       cb(_data);
     });
  } catch(err){
    console.log(err);
  }
};

// create a directory, but catch error when the dir already exists.
var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch(e) {
    if ( e.code == 'EEXIST' ){
      console.log("folder exists: " + path);
    } else {
      console.log(e);
    }
  }
};

// use the archiver model to create the LiPD file
var createArchive = function(pathTmpZip, pathTmpBag, filename, cb){
  console.log("Creating ZIP/LiPD archive...");
  var archive = archiver('zip');
  // path where the LiPD will ultimately be located in "/zip" dir.
  var pathTmpZipLipd = path.join(pathTmpZip, filename);
  // open write stream to LiPD file location
  var output = fs.createWriteStream(pathTmpZipLipd);
  console.log("Write Stream Open: " + pathTmpZipLipd);

  // "close" event. processing is finished.
  output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      // console.log('archiver has been finalized and the output file descriptor has closed.');
      console.log("LiPD Created at: " + pathTmpZipLipd);
      // callback to finish POST request
      cb();
  });

  // error event
  archive.on('error', function(err){
      console.log("archive error");
      throw err;
  });

  archive.pipe(output);
  // Add the data directory to the archive
  console.log("add dir to archive");
  try{
    // read in all filenames from the "/bag" dir
    var files = fs.readdirSync(pathTmpBag);
    for(var i in files) {
      // current file to process
      var currPath = path.join(pathTmpBag, files[i]);

      // if this is a bagit file (.txt), use "archive.file"
      if(path.extname(files[i]) === ".txt") {
        console.log("archiving file from: " + currPath);
        console.log("archiving file to: " + files[i]);
        archive.file(currPath, { name: files[i]});

      }
      // if this is the "/data" directory, use "archive.directory"
      else {
        console.log("archiving dir from: " + currPath);
        console.log("archiving dir to: /" + files[i]);
        archive.directory(currPath, "/" + files[i]);
      }

    }

  }catch(err){
    console.log(err);
  }

  // all files are done, finalize the archive
  archive.finalize();
}; // end createArchive

// Get the home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

// Receive a POST from the contact form on the home page
router.post('/', function(req, res, next){
  console.log(req.body);

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
  // console.log("POST: /files");

  // set data about the file
  var files = req.body.file;
  var filename = req.body.filename;
  // console.log("POST: build path names");

  // path that stores lipds
  var pathTop = path.join(process.cwd(), "tmp");
  var _pathTmpPrefix = path.join(pathTop, "lipd-");
  // create tmp folder at "/files/<lipd-xxxxx>"
  // console.log("POST: creating tmp dir...");
  var pathTmp = misc.makeid(_pathTmpPrefix, function(_pathTmp){
    // console.log("POST: created tmp dir str: " + _pathTmp);
    mkdirSync(_pathTmp);
    return _pathTmp;
  });

  // console.log("POST: tmp path: " + pathTmp);

  // tmp bagit level folder. will be removed before zipping.
  var pathTmpBag = path.join(pathTmp, "bag");
  var pathTmpZip = path.join(pathTmp, "zip");
  var pathTmpFiles = path.join(pathTmp, "files");

  // console.log("POST: make other dirs...");
  mkdirSync(pathTmpZip);
  mkdirSync(pathTmpFiles);

  // console.log("POST: created dir: " + pathTmpZip);
  // console.log("POST: created dir: " + pathTmpFiles);

  // use req data to write csv and jsonld files into "/files/<lipd-xxxxx>/files/"
  // console.log("POST: begin writing files");
  files.forEach(function(file){
    console.log("POST: writing: " + path.join(pathTmpFiles,  file.filename));
    fs.writeFileSync(path.join(pathTmpFiles, file.filename), file.dat);
  });

  // console.log("POST: Initiate Bagit...");
  // Call bagit process on folder of files
  gladstone.createBagDirectory({
     bagName: pathTmpBag,
     originDirectory: pathTmpFiles,
     cryptoMethod: 'md5',
     sourceOrganization: 'LiPD Project',
     contactName: 'Chris Heiser',
     contactEmail: 'lipd.contact@gmail.com',
     externalDescription: 'Source: LiPD Online Validator'
  }).then(function(resp){
    // When a successful Bagit Promise returns, start creating the ZIP/LiPD archive
    if(resp){
      createArchive(pathTmpZip, pathTmpBag, filename, function(){
        console.log("POST: response: " + path.basename(pathTmp));
        res.send(path.basename(pathTmp));
      });
    }
  });
  // console.log("POST complete");
});

router.get("/files/:tmp", function(req, res, next){
  // Tmp string provided by client
  console.log("GET: /files");
  var tmpStr = req.params.tmp;
  console.log("GET: tmpStr: " + tmpStr);
  // Path to the zip dir that holds the LiPD file
  var pathTmpZip = path.join(process.cwd(), "tmp", tmpStr, "zip");
  console.log("GET: " + pathTmpZip);
  // Read in all filenames from the dir
  console.log("GET: read zip dir");
  var files = fs.readdirSync(pathTmpZip);
  // Loop over the files found
  for(var i in files) {
    // Get the first lipd file you find (there should only be one)
     if(path.extname(files[i]) === ".lpd") {
       // set headers and initiate download.
       var pathLipd = path.join(pathTmpZip, files[i]);
       res.setHeader('Content-disposition', 'attachment; filename=' + files[i]);
       res.setHeader('Content-type', "application/zip");
       console.log("sending response to client.");
       res.download(pathLipd);
     }
  }
});

router.get("/create", function(req, res, next){
  res.render('create', {title: 'Create & Edit LiPD'});
});

router.get("/modal", function(req, res, next){
  res.render('modal', {title: ''});
});

router.get("/modalJson", function(req, res, next){
  res.render('modalJson', {title: ''});
});

router.get("/modalCsv", function(req, res, next){
  res.render('modalCsv', {title: ''});
});

router.get("/modalTxt", function(req, res, next){
  res.render('modalTxt', {title: ''});
});

// API
router.post("/api/validator", function(req, res, next){
  console.log("------------------------");
  console.log("enter /api/validator");
  // We are using this as a validation call for our desktop utilities.
  // GET with some JSON, and we'll tell you if it pass/fail and what errors came up.

  try {
    // receive some json data
    try{
      // When receiving a request from Python (and possibly others),
      // we have to parse the JSON object from the JSON string first.
      console.log("index: Parsing JSON.");
      var json_data = JSON.parse(req.body["json_payload"]);
    } catch(err){
      // If parsing didn't work, it's likely we don't need it. This is probably valid JSON already.
      console.log("index: Parsing JSON failed. Ending request: " + err);
      res.status(400).send("HTTP 400: Parsing JSON failed: " + err);
      // var json_data = req.body["json_payload"];
    }
    // console.log("JSON DATA");
    // console.log(json_data);
    console.log("index: Starting process...");
    lipdValidator.sortBeforeValidate(json_data, function(j){
      console.log("index: sortBeforeValidate callback");
      lipdValidator.validate(j, function(x){
        try {
          console.log("index: Validate callback, preparing response");
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify(x, null, 3));
          console.log("index: Response sent to origin");
          // console.log(x.feedback);
        } catch(err) {
          console.log("index: Error preparing response. Ending request: " + err);
          res.status(400).send("HTTP 400: Error preparing response: " + err);
        }
      });
    });
  } catch(err) {
    console.log("index: Validation failed: " + err);
    res.status(400).send("HTTP 400: Validation failed: " + err);
  }

  // console.log("exit /api/validator");
});


// Use data from a LiPD file to create TSids, register them in the master list, and send data in response
router.post("/api/tsid/create", function(req, res, next){
  console.log("/api/tsid/create");
  try {
    // Number of TSids that need to be generated
    var _count = req.body.count;
    // One object per variable that needs a TSid created.
    // example = [{"TSid": "", "dataSetName": "", "variableName": "", "spreadsheetKey": "", "worksheetKey":""}, ..]
    var _objs = req.body.data;
    console.log("Creating TSids: " + _count);
    if (_count > 200){
      res.status(400).send({"error": "Requested too many TSids. Please request a smaller amount per call."});
      res.end();
    }
    readTSidOnly(function(_tsids){
      // Now we have an array of all the registered TSids
      misc.reconcileTSidCreate(_tsids, _objs, function(_x){
        // console.log("At the end!");
        // console.log(_x);
        // append the new TSids to tsid_only.csv
        updateTSidOnly(_x);
        // append the new object data (w/ tsids) to tsid_master.csv
        updateTSidMaster(_x, function(_results){
          console.log("TSids created successfuly");
          // since the update was successsful, add the new JSON objects to the response and send.
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify(_results, null));
        });
      });
    });
  } catch (err) {
    console.log(err);
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
          console.log("TSids registered successfuly");
          res.status(200).send({"response": "Registered TSids successfuly"});
        });
      });
    });
  } catch(err){
    console.log(err);
    logger.info(err);
    res.end();
  }

});


module.exports = router;
