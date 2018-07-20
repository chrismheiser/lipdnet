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
var port = process.env.PORT || 3000;
var dev = port === 3000;
var router = express.Router();


// HELPERS
var batchDownloadWiki = function(dsns, cb){
  var _errCt = 0;
  var _errNames = [];
  var request = require('request');

  // Options for creating a temp folder
  var _opts = {"pathTmpPrefix": path.join(process.cwd(), "tmp", "wiki-"), "pathTmp": ""};
  // Create a temp directory with the options, and return the path at pathTmp
  _opts = createTmpDir(_opts);
  console.log(_opts);

  // For each dataset, make a download request from the LinkedEarth server
  for(var _i=0; _i<dsns.length; _i++){

    console.log(dsns[_i]);

    // // Send out ONE request, and download the LiPD file to our server
    // console.log("link");
    // console.log('http://wiki.linked.earth/wiki/index.php/Special:WTLiPD?op=export&lipdid=' + dsns[_i]);
    // // Pack up the options that we want to give the LinkedEarth Wiki
    // var options = {
    //   uri: 'http://wiki.linked.earth/wiki/index.php/Special:WTLiPD?op=export&lipdid=' + dsns[_i],
    //   method: 'GET',
    //   timeout: 3000
    // };
    // // If we're on the production server, then we need to add in the proxy option
    // if (!dev){
    //   options.proxy = "http://rishi.cefns.nau.edu:3128";
    // }
    // try{
    //   console.log("downloadall: Sending request to LinkedEarth Wiki");
    //   request(options, function (err1, res1, body1) {
    //     console.log("downloadall: LinkedEarth Wiki: Response Status: ", res1.statusCode);
    //     if(err1){
    //       console.log("downloadall: LinkedEarth Wiki: Error making the request");
    //     } else {
    //       console.log("downloadall: LinkedEarth Wiki: I think it...worked? ");
    //       // console.log(res1);
    //       // console.log(body1);
    //     }
    //   }).pipe(fs.createWriteStream(dsns[_i] + ".lpd"));
    // } catch(err){
    //   // _errNames.push(dsns[_i]);
    //   // _errCt++;
    //   console.log("downloadall: Overall error, this could be anything: " + err);
    // }
  }

  cb()
};

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

var parseWikiQueryResults = function(results, cb){
  var _query_results = [];
  for(var _m=0; _m<results.length; _m++) {
      var _item = {};
      var _dsn_link = results[_m]["binding"][0]["uri"][0];
      var _dsn = _dsn_link.match(/http:\/\/wiki.linked.earth\/Special:URIResolver\/(.*)/);
      _item["dsn"] = _dsn[1];
      _item["url_dataset"] = _dsn_link;
      _item["url_download"] = 'http://wiki.linked.earth/wiki/index.php/Special:WTLiPD?op=export&lipdid=' + _dsn[1];
      _query_results.push(_item);
  }
  cb(_query_results);
};

var createTmpDir = function(master, res){
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
var createSubdirs = function(master, res){
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

// END HELPERS


// PAGE ROUTES

router.get('/', function(req, res, next) {
  res.render('index', { title: 'LiPD' });
});

router.post('/', function(req, res, next){
  // Receive a POST from the contact form on the home page
  // logger.info(req.body);
});

router.get("/playground", function(req, res, next){
  // Render the playground page
  res.render('playground', {title: 'Playground'});
});

router.post("/files", function(req, res, next){
  // Request data : Client sends LiPD data. Create csv, json, and text files. Zip contents into a LiPD file stored on the server.
  // Response data : A string ID that corresponds to the LiPD file on the server.

  logger.info("POST: /files");
  // Request
  var master = {};
  master = parseRequest(master, req, res);
  console.log(master);
  master = createTmpDir(master, res);
  console.log(master);
  master = createSubdirs(master, res);
  try{
    // Use the request data to write csv and jsonld files into "/tmp/<lipd-xxxxx>/files/"
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
  // Request: Client sends a string ID of the LiPD file that they want to download.
  // Response: Initiate a download of the LiPD file to the client.
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
  // Request: Client sends LiPD data. Send it to PythonAnywhere script to convert it to NOAA text(s). Write NOAA texts to server.
  // Response: A string ID that corresponds to the NOAA file (or zip of multi NOAA files) on the server.

  try{
    // Parse the angular request data into a form that we can use
    var master = {};
    // console.log(JSON.stringify(req.body.dat));
    master = parseRequestNoaa(master, req, res);
    // console.log(JSON.stringify(master.dat));
    master = createTmpDir(master, res);
    console.log(master.name);
    // console.log(JSON.stringify(master.dat));
    try {
      // Bring in the request module to work some magic
      var request = require('request');
      // Pack up the options that we want to give the request module
      var options = {
        uri: 'http://cheiser.pythonanywhere.com/api/noaa',
        method: 'POST',
        json: master.dat,
        timeout: 3000
      };

      // If we're on the production server, then we need to add in the proxy option
      if (!dev){
        options.proxy = "http://rishi.cefns.nau.edu:3128";

      }

      // Send the request to the NOAA API
      console.log("Sending LiPD data to NOAA Conversion API: ", master.name);
      // console.log("PORT : ", port);
      // console.log(JSON.stringify(master.dat));
      request(options, function (error, response, body) {
        console.log("Response Status: ", response.statusCode);
        console.log("Response error: ");
        console.log(error);
        if(dev){
          console.log("Response Body: ");
          console.log(body);
        }

        // If the response is a string, then it is an error message coming from a Python API Exception
        if (typeof body === 'string' || body instanceof String){
          // If the response code is a 502, then something is wrong with the server and it needs to be looked at.
          if(response.statusCode === 502){
            res.writeHead(502, "It looks like our conversion server is down. We're very sorry! :(", {'content-type' : 'text/plain'});
          }
          // The process completed, but we didn't get any NOAA text data back. Which means an error occurred or there wasn't enough data.
          else {
            res.writeHead(204, "There was an error during the conversion process and no NOAA text files were created. Message from API: " + body, {'content-type': 'text/plain'});
          }
          console.log("Exiting NOAA POST request");
          res.end();
        }
        else {
          // Did the process complete and respond with data?
          if (!error && response.statusCode === 200) {
            // Huzzah! We have a good response
            // console.log("# NOAA files received: ", body.length);
            logger.info("NOAA tmp folder ID: " + path.basename(master.pathTmp));
            try {
              // Write the NOAA data to the tmp folder as text files
              console.log("Received Data from API");
              writeFiles(body, master.pathTmp, res, function(){
                // Success! All the files are written and we can send the client back an ID for the download
                if(fs.readdirSync(master.pathTmp).length !== 0){
                  console.log("Exiting NOAA POST request");
                  res.status(200).send(path.basename(master.pathTmp));
                }
                // Fallback code. We shouldn't reach this code because the API should send an error string which would be handled above.
                else {
                  res.writeHead(204, "There was an error during the conversion process and no NOAA text files were created. Message from API: " + body, {'content-type' : 'text/plain'});
                  console.log("Exiting NOAA POST request");
                  res.end();
                }
              });
            } catch(err){
              // Something went wrong while trying to process the API response.
              console.log("/noaa post: Error while writing txt files to tmp: ", err);
              console.log("Exiting NOAA POST request");
              res.writeHead(500, "Error while writing text files to server", {'content-type' : 'text/plain'});
              res.end();
            }
          } else{
            // Something went wrong in the Python process and the API gave us a bad response.
            console.log("/noaa post: Bad response from NOAA API: ", error);
            console.log("Exiting NOAA POST request");
            res.writeHead(403, "Bad response from API.", {'content-type' : 'text/plain'});
            res.end();
          }
        }
      });
    } catch(err){
      // Communication problems while attempting to send a request to the API
      console.log("/noaa post: Error preparing & sending NOAA API request: ", err);
      console.log("Exiting NOAA POST request");
      res.writeHead(500, "Unable to prepare data for API: " + err, {'content-type' : 'text/plain'});
      res.end();
    }
  } catch(err){
    // There was a problem parsing the data from the client-side. We never even made it to the API request!
    console.log("/noaa post: Error parsing data request sent from client-side: " + err);
    console.log("Exiting NOAA POST request");
    res.writeHead(500, "Error parsing data request from client-side: " + err, {'content-type' : 'text/plain'});
    res.end();
  }
});

router.get("/noaa/:tmp", function(req, res, next){
  // Request: Client sends a string ID of the NOAA file that they want to download.
  // Response: Initiate a download of the NOAA file to the client.
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

router.post("/query", function(req, res, next){
  // Request: A JSON object of query parameters. Send these parameters to PythonAnywhere script to get query text-blob. Send query text blob to LinkedEarth Wiki to get query results.
  // Response: Query dataset name results. Parsed and formatted in an array to be useful on client-side

  // Bring in the request module to work some magic
  var request = require('request');
  // Pack up the options that we want to give the Python request
  var options = {
    uri: 'http://cheiser.pythonanywhere.com/api/wikiquery',
    method: 'POST',
    json: req.body,
    timeout: 3000
  };
  // If we're on the production server, then we need to add in the proxy option
  if (!dev){
    options.proxy = "http://rishi.cefns.nau.edu:3128";
  }
  try{
    console.log("query: Python: Sending request...");
    request(options, function (err1, res1, body1) {
      console.log("query: Python: Response Status: ", res1.statusCode);
      if(err1){
        console.log("query: Python: Error making the request");
        res.writeHead(res1.statusCode, "Error talking to the API", {'content-type' : 'text/plain'});
        res.end();
      }
      // If the Python script has an error, it'll return an empty string.
      else if(typeof(res1.body) === 'undefined' || res1.body === ""){
        res.writeHead(500, "Error creating the query string. Cannot query Wiki.", {'content-type' : 'text/plain'});
        res.end();
      }
      // If the Python request came back successfully, then start creating the Wiki request
      else if (!err1 && res1.statusCode === 200) {
        console.log("query: Wiki: Preparing to send");
        options = {
          uri: "http://wiki.linked.earth/store/ds/query",
          qs: {"query": res1.body}
        };
        if (!dev){
          options.proxy = "http://rishi.cefns.nau.edu:3128";
        }
        console.log("query: Wiki: Sending request...");
        request(options, function(err2, res2, body2){
          console.log("query: Wiki: Response Status: ", res2.statusCode);
          if(err2){
            console.log("query: Wiki: Error making the request");
            res.writeHead(res2.statusCode, "Error talking to the LE API", {'content-type' : 'text/plain'});
            res.end();
          }
          // All good, keep going.
          if (!err2 && res2.statusCode === 200) {
            // Bring in xml2js to parse the Wiki results into a usable form. XML *sigh*
            var parseString = require('xml2js').parseString;
            var _xml = res2.body;
            parseString(_xml, function (err, result) {
              try {
                // If there are results, they'll be in this location.
                // If there aren't results, this location won't exist and we'll trigger the error catch
                var _results = result.sparql.results[0].result;
              } catch(err) {
                console.log("No Results");
                res.status(200).send([]);
              }
              try{
                // Now that we have results(in the form of dataset links), start to compile them in a useful format.
                parseWikiQueryResults(_results, function(_organized_results){
                  // All done! This is the end of a complete and successful query.
                  res.status(200).send(_organized_results);
                });
              } catch(err){
                console.log("query: Wiki: error sorting the results: ", err);
                res.writeHead(500, "Error sorting results received from LinkedEarth Wiki", {'content-type' : 'text/plain'});
                res.end();
              }
            });
          } else {
            console.log("query: Wiki: Error making the request");
            res.writeHead(res2.statusCode, "Error talking to the Wiki API", {'content-type' : 'text/plain'});
            res.end();
          }
        });
      } else {
        console.log("query: Python: Error making the request");
        res.writeHead(res1.statusCode, "Error talking to the Python API", {'content-type' : 'text/plain'});
        res.end();
      }
    });
  } catch(err){
    console.log("query: Overall error, this could be anything: " + err);
    res.writeHead(500, "Error: " + err);
    res.end();
  }
});

router.get("/query", function(req, res, next){
  // Render the query page
  res.render('query', {title: 'Query Datasets'});
});

router.get("/downloadall/:tmp", function(req, res, next){
  // Render the playground page


});

router.post("/downloadall", function(req, res, next){
  // Array of dataset names to retrieve
  var _dsns = req.body.dsns;

  // Create a tmp folder
  // var _tmp_dir = ;

  batchDownloadWiki(_dsns, function(){
    console.log("in batch download  callback");
    res.status(200).send("hehe");
  });



});

router.get("/merge", function(req, res, next){
  // Render the compare page
  res.render('merge', {title: 'Merge'});
});

// END PAGE ROUTES

// MODALS AND PIECES

router.get("/modal-file", function(req, res, next){
  res.render('modal/modal-file', {title: ''});
});

router.get("/modal-block", function(req, res, next){
  res.render('modal/modal-block', {title: ''});
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

// END MODALS AND PIECES


// API ENDPOINTS
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
