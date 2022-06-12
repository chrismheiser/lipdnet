var express = require('express');
var fs = require("fs");
var archiver = require('archiver');
var gladstone = require('gladstone');
var path = require("path");
var process = require("process");
var fastcsv = require("fast-csv");
var request = require('request');
var logger = require("../node_modules_custom/node_log.js");
var lipdValidator = require("../node_modules_custom/node_validator.js");
var misc = require("../node_modules_custom/node_misc.js");
var port = process.env.PORT || 3000;
var dev = port === 3000;
var router = express.Router();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Disable console logs in production
if(!dev){
    console.log = function(){};
}


// HELPERS

/**
 * 12.18.18 :  Snapshot of the Wiki ontology data. Use if our real-time requests aren't working.
 */
var _ontology_fallback = {
        "variableType": ["measured", "inferred"],
        "inferredVariableType": [
            "d18o",
            "uncertainty temperature",
            "temperature1",
            "temperature2",
            "temperature3",
            "uncertainty temperature1",
            "thermocline temperature",
            "sedimentation rate",
            "relative sea level",
            "sea surface salinity",
            "accumulation rate",
            "mean accumulation rate",
            "accumulation rate, total organic carbon",
            "accumulation rate, calcium carbonate",
            "sampledata",
            "subsurface temperature",
            "Radiocarbon age",
            "Sea surface temperature",
            "Carbonate ion concentration",
            "Year",
            "Temperature",
            "Salinity",
            "Age"
        ],
        "archiveType": [
            "borehole",
            "bivalve",
            "documents",
            "molluskshell",
            "lake",
            "Hybrid",
            "Tree",
            "Coral",
            "Marine sediment",
            "Wood",
            "Lake sediment",
            "Sclerosponge",
            "Glacier ice",
            "Rock",
            "Speleothem"
        ],
        "proxyObservationType": [
            "diffusespectralreflectance",
            "julianday",
            "d18o",
            "trw",
            "dust",
            "chloride",
            "sulfate",
            "nitrate",
            "depth",
            "mg",
            "x-rayfluorescence",
            "dd",
            "ghostmeasured",
            "trsgi",
            "mg ca",
            "samplecount",
            "segment",
            "ringwidth",
            "residual",
            "ars",
            "corrs",
            "rbar",
            "sd",
            "se",
            "eps",
            "core",
            "uk37prime",
            "upper95",
            "lower95",
            "year old",
            "thickness",
            "na",
            "deltadensity",
            "blueintensity",
            "varvethickness",
            "reconstructed",
            "agemin",
            "agemax",
            "sampleid",
            "depth top",
            "depth bottom",
            "r650 700",
            "r570 630",
            "r660 670",
            "rabd660 670",
            "watercontent",
            "c n",
            "bsi",
            "mxd",
            "effectivemoisture",
            "pollen",
            "unnamed",
            "sr ca",
            "calcification1",
            "calcification2",
            "calcification3",
            "calcificationrate",
            "composite",
            "calcification4",
            "notes1",
            "calcification5",
            "calcification",
            "calcification6",
            "calcification7",
            "trsgi1",
            "trsgi2",
            "trsgi3",
            "trsgi4",
            "iceaccumulation",
            "f",
            "cl",
            "ammonium",
            "k",
            "ca",
            "duration",
            "hindex",
            "varveproperty",
            "x radiograph dark layer",
            "d18o1",
            "sedaccumulation",
            "massacum",
            "melt",
            "sampledensity",
            "37:2alkenoneconcentration",
            "alkenoneconcentration",
            "alkenoneabundance",
            "bit",
            "238u",
            "distance",
            "232th",
            "230th/232th",
            "d234u",
            "230th/238u",
            "230th age uncorrected",
            "230th age corrected",
            "d234u initial",
            "totalorganiccarbon",
            "cdgt",
            "c/n",
            "caco3",
            "pollencount",
            "drybulkdensity",
            "37:3alkenoneconcentration",
            "min sample",
            "max sample",
            "age uncertainty",
            "is date used original model",
            "238u content",
            "238u uncertainty",
            "232th content",
            "232th uncertainty",
            "230th 232th ratio",
            "230th 232th ratio uncertainty",
            "230th 238u activity",
            "230th 238u activity uncertainty",
            "decay constants used",
            "corrected age",
            "corrected age unceratainty",
            "modern reference",
            "al",
            "s",
            "ti",
            "mn",
            "fe",
            "rb",
            "sr",
            "zr",
            "ag",
            "sn",
            "te",
            "ba",
            "numberofobservations",
            "total organic carbon",
            "bsio2",
            "calciumcarbonate",
            "wetbulkdensity",
            "Diffuse spectral reflectance",
            "N",
            "C",
            "P",
            "Mn/Ca",
            "B/Ca",
            "notes",
            "Precipitation",
            "Reflectance",
            "Sr/Ca",
            "d13C",
            "Ba/Ca",
            "Density",
            "Al/Ca",
            "Floral",
            "Zn/Ca",
            "Mg/Ca",
            "Radiocarbon",
            "Si",
            "Uk37",
            "TEX86",
            "Age"
        ],
        "units": [
            "ad",
            "year ce",
            "year ad",
            "mm",
            "kyr bp",
            "yr",
            "bp",
            "kyr",
            "yrs bp",
            "kabp",
            "yrs",
            "yr bp",
            "Year"
        ],
};

/**
 * Wiki ontology data. This variable stores real-time requests (or fallback data). This data is sent to front-end.
 */
var _ontology_query = {
    "inferredVariableType": [],
    "archiveType": [],
    "proxyObservationType": [],
    "units": [],
    "variableType": ["measured", "inferred"],

};

/**
 * All 'labels' imported and processed from the ontology.json file
 */
var _ontology_json = [];

/**
 * Global counter for recursive getOntologyLabels function below
 */
var count = 0;

/**
 * Store filenames of LiPD files that were uploaded to the Lipdverse Dropbox in the past 24 hours.
 */
var newLipdverseFiles = [];

/**
 * Get Wiki ontology labels by sorting through the /data/ontology.json file. Break the file down to just key-value pairs
 * within a Json object. Recursively collect all the "label" items from within the ontology file.
 *
 * @param   {*}    json   Ontology data parsed from the /data/ontology.json file
 * @param   {*}    cb     Callback function, or null. Next fn goes to cleanOntology()
 */
var getOntologyLabels = function(json, cb) {
    // The count keeps track of when we're done iterating and recursively diving. Once back to 1 count, we can callback.
    count++;
    // If incoming data is a string, bubble up.
    if(typeof(json) === "string") {
    }
    // Data is an array
    else if (Array.isArray(json)){
        // Loop for each item in array
        for(var _i=0; _i < json.length; _i++){
            // Recursive call, no callback.
            getOntologyLabels(json[_i], null);
            count--;
        }
    }
    // Data is an object
    else if(typeof(json) === "object"){
        // Loop over each key
        for(var _key in json){
            if(json.hasOwnProperty(_key)){
                // The keys we want are classified as labels
                if (_key === "rdfs:label"){
                    // Does this key have a value field?
                    if(json[_key].hasOwnProperty("@value")){
                        // Yes, push the key - value pair onto the ontology array.
                        _ontology_json.push(json[_key]["@value"]);
                    }
                }
                // Key is not a label
                else {
                    // Recursive call, no callback
                    getOntologyLabels(json[_key], null);
                    count--;
                }
            }
        }
    }
    // If the count is back to 1, and the callback is a function (rather than null), we can use the callback.
    if (count-1 === 0 && cb)
        // Called within mergeOntologies(). Next step is to cleanOntology()
        cb();
};

/**
 * Clean the Wiki ontology by removing duplicates or similar entries. We want the vocabulary to be somewhat-controlled
 * so that we don't have many variations of the same terms. The cleanup follows the list of requirements below to
 * remove unwanted terms.
 *
 * REQUIREMENTS
 *
 * 1. remove any words that have "." period equivalents
 *    ie. 'yr bp' and "yr b.p."
 * 2. remove any words that have no spacing equivalents
 *    ie.  "glacier ice" and "GlacierIce"
 * 3. remove any words that have uppercase equivalents
 *    ie. "Glacierice" and "glacierice"
 *
 * @return  none   Data is updated in global scope
 */
var cleanOntology = function(){
    // Lowercase all items.
    // Loop for each key in the ontology object
    for(var _key in _ontology_query) {
        if(_ontology_query.hasOwnProperty(_key)) {
            // Loop over the value in array for this key
            for(var _k = 0; _k < _ontology_query[_key].length; _k++) {
                try{
                    // Lowercase all values, and remove the period characters
                    _ontology_query[_key][_k] = _ontology_query[_key][_k].toLowerCase().replace(/\./g, "");
                } catch(err){
                    // Pass, if there's an error we don't care.
                }
            }
        }
    }

    // Find all the unwanted keys
    // Loop for each key in the ontology object (again)
    for(var _key2 in _ontology_query) {
        if (_ontology_query.hasOwnProperty(_key2)) {
            // Array to store unwanted keys
            var _bad = [];
            // Loop for each value in array for this key
            for (var _k2 = 0; _k2 < _ontology_query[_key2].length; _k2++) {
                var _word = _ontology_query[_key2][_k2];
                // Is there a space in this word?
                if(_word.indexOf(" ") !== -1){
                    // Get rid of the space to look for a 'no-space' equivalent
                    var _nospaceword = _word.replace(" ", "");
                    // Is there a no space equivalent
                    if(_ontology_query[_key2].indexOf(_nospaceword) !== -1){
                        // No space equivalent exists, add it to array for removal.
                        _bad.push(_nospaceword);
                    }
                }

                // Are there duplicates of this word in the key array? Is the word tracked in the bad array yet?
                if(countDuplicates(_ontology_query[_key2], _word) > 1 && _bad.indexOf(_word) === -1){
                    // Duplicate key, add it to array for removal
                    _bad.push(_word);
                }
            }

            // Remove all the words in the bad array that we don't want anymore.
            for(var _p=0; _p<_bad.length; _p++){
                // Get the current key for removal
                var _removeword = _bad[_p];
                // Since there might be multiple instances of bad words, we have to loop to remove all of them.
                for(var _rm=0; _rm<countDuplicates(_ontology_query[_key2], _removeword); _rm++){
                    // Find index the array index for this key
                    var _idx = _ontology_query[_key2].indexOf(_removeword);
                    // Does it exist?
                    if (_idx > -1) {
                        // Yes, exists. Remove the word from the array.
                        _ontology_query[_key2].splice(_idx, 1);
                    }
                }
            }
        }
    }

    // Go through the ontology json data and replace any wiki items with the ontology counterpart. (better formatting)
    for(var _h=0; _h<_ontology_json.length; _h++){
        // Ontology word to look for
        var _word1 = _ontology_json[_h];
        for(var _key3 in _ontology_query) {
            if (_ontology_query.hasOwnProperty(_key3)) {
                // Is the ontology version in here in a lowercase version?
                var _idx2 = _ontology_query[_key3].indexOf(_word1.toLowerCase());
                // Does it exist?
                if (_idx2 > -1) {
                    // Remove the wiki version
                    _ontology_query[_key3].splice(_idx2, 1);
                    // Add the ontology version
                    _ontology_query[_key3].push(_word1);
                }
            }
        }
    }

};

/**
 * Count how many times a word occurs in an array
 *
 * @param  {Array}  arr    Array of words
 * @param  {String} word   Word to look for in array.
 * @return {Number} _count The number of times the word occurs in the array.
 */
var countDuplicates = function(arr, word){
    var _count = 0;
    // Loop for each word in array
    for(var i = 0; i < arr.length; i++){
        // Does it match?
        if(arr[i] === word)
            // Count it.
            _count++;
    }
    // Return word count
    return _count;
};

/**
 * Read the ontology file that is stored in /data/ontology.json
 *
 * @param {Function}  cb  Callback function, goes to getOntologyLabels() next.
 */
var readOntologyFile = function(cb){
    try{
        // Read the file with the file stream module
        fs.readFile('./data/ontology.json', function (err, data) {
            cb(err, data);
        });
    } catch(err){
        console.log("index.js: readOntologyFile: " + err);
    }
};

/**
 * Merge two snapshots of the wiki ontology. One snapshot is a file stored on the server. The second snapshot is
 * queried and pulled from the LinkedEarth Wiki on load. Preference is given to the query since it is more up-to-date.
 *
 * @return   none   Ontology data is updated in the global space.
 */
var mergeOntologies = function(){
    // Read the ontology file from /data/ontology.json into memory
    readOntologyFile(function(err, _data){
        try{
            if (err){
                // If error don't continue. Not a big deal.
                console.log("index.js: readOntologyFile: Couldn't read ontology.json: " + err);
            } else {
                // Parse the file data as JSON and then reorganize it into an object sorted by keys.
                getOntologyLabels(JSON.parse(_data), function(){
                    // Compare and combine the file data (constant) with the Wiki query data (up-to-date).
                    // Give the query data preference, since it's likely newer.
                    cleanOntology();
                    console.log("index.js: cleanOntology: end");
                });
            }
        }catch(err){
            console.log("index.js: mergeOntologies: " + err);
        }
    });
};

/**
 * Sort the results of the LinkedEarth Wiki ontology results. Get all the string values from the XML response.
 *
 * @param {Object}   results   LinkedEarth
 * @param {Function} cb        Callback function. Next step is to set data to global scope
 */
var parseWikiQueryOntology = function(results, cb){
    try {
        var _tmp = [];
        // If there are results, they'll be in this location.
        // If there aren't results, this location won't exist and we'll trigger the error catch
        var _data = results.sparql.results[0].result;
        for(var _m=0; _m<_data.length; _m++) {
            // console.log(_results[_m]["binding"][0]["literal"][0]);
            // Push the current data result onto the array
            _tmp.push(_data[_m]["binding"][0]["literal"][0]);
        }
        // Send the organized data through to the next step.
        cb(_tmp);
    } catch(err) {
        // There was a problem. We don't want to update our ontology if there was an error.
        console.log("index.js: parseWikiQueryOntology: No Results? : " + err);
        // Send back an empty array so we don't have partially finished or partially complete data.
        cb([]);
    }
};

/**
 * Send SPARQL request to LinkedEarth Wiki for one ontology field.
 *
 * @param   {String}   field   Wiki field to query for. (inferredVariableType, proxyObservationType, units, archiveType)
 * @param   {String}   query   The query string to add to the end of the URI
 * @return  none               Data is stored in the global scope
 */
var _getWikiOntologyField = function(field, query){
        // Pack up the options that we want to give the Python request
        var options = {
            uri: "http://wiki.linked.earth/store/ds/query",
            method: 'POST',
            timeout: 3000,
            qs: {"query": query}
        };

        try{
            // Send out the POST request
            request(options, function (err, res, body){
                // Error or bad response
                if (err || typeof body === "undefined") {
                    // Something went wrong. Fallback to hardcoded data.
                    console.log("_getWikiOntologyField: Wiki query failed. Fallback to hardcoded data.");
                    _ontology_query[field] = _ontology_fallback[field];
                }
                // The query was successful
                else {
                    // Sift through the ugly XML data
                    var parseString = require('xml2js').parseString;
                    // Store the body of the response
                    var _xml = res.body;
                    // Parse the XML into a JSON object
                    parseString(_xml, function (err, result) {
                        // Error or bad response
                        if (err || typeof result === "undefined"){
                            // Something went wrong. Fall back to hardcoded data.
                            console.log("_getWikiOntologyField: parseString: Bad Response");
                            _ontology_query[field] = _ontology_fallback[field];
                        } else {
                            // XML data parsed correctly. Use the results to set the data to our environment.
                            parseWikiQueryOntology(result, function(arr){
                                if(arr){
                                    // Successful responses and parses. This is the ultimate goal. Set the data.
                                    _ontology_query[field] = arr;
                                }
                            });
                        }
                    });
                }
            });
        } catch(err){
            // There was an error before sending out the request.
            // Note the error and move to the next ontology field loop. No ontology data is updated for this field.
            console.log("index.js: getWikiOntologyField: Request failed: " + err);
        }

};

/**
 * Use SPARQL queries to get possible field entries for the specific listed fields. Loop over each of the fields
 * and query them one at a time.
 *
 * @return   none    Data is stored in the global scope
 */
var getWikiOntology = function(){
    // The prefix to each query is the same.
    var _prefix = "PREFIX core: <http://linked.earth/ontology#>PREFIX wiki: <http://wiki.linked.earth/Special:" +
        "URIResolver/>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>";

    // These are the query strings for each of the fields.
    var _fields = {
        "inferredVariableType": "SELECT distinct ?a WHERE { ?w core:inferredVariableType ?t. ?t rdfs:label ?a }",
        "archiveType": "SELECT distinct ?a WHERE {{ ?dataset wiki:Property-3AArchiveType ?a. }UNION{ ?w core:proxyArchiveType ?t. ?t rdfs:label ?a }}",
        "proxyObservationType": "SELECT distinct ?a WHERE { ?w core:proxyObservationType ?t. ?t rdfs:label ?a }",
        "units": "SELECT distinct ?b WHERE { ?w core:inferredVariableType ?a. ?w core:hasUnits ?b . { ?a rdfs:label \"Age\" . }UNION { ?a rdfs:label \"Year\" . }}",
    };

    // Send out a query request for each of the fields we're keeping a local copy of.
    for(var field in _fields){
        if(_fields.hasOwnProperty(field)){
            // Go send the POST request for this field
            _getWikiOntologyField(field, _prefix + _fields[field]);
        }
    }
};

/**
 * Compile ontology by getting the local and remote data, and then merging the data after.
 *
 * @return  none    Data is stored in the global scope
 */
var compileOntology = function(){
    console.log("index.js: compileOntology: start");
    try{
        // Retrieve LinkedEarth Wiki ontology data through queries.
        getWikiOntology();
        // Fake a sync function so the query items come back first before continuing
        setTimeout(function(){
            // Merge the remote ontology and the local ontology
            mergeOntologies();
        }, 4000);
    } catch(err){
        // Error, no problem. We'll use the local ontology
        console.log("index.js: compileOntology: " + err);
    }
};

// TODO Need to finish this. Batch download button for /query page
/**
 * Batch download wiki files is for allows you to download multiple files at once through the results of the /query
 * page.
 *
 * @param  {Array}     dsns   Dataset names of the LiPD files the user wants to download from the Wiki server
 * @param  {Function}  cb     Callback function. Next step is to zip up all files that were downloaded, so we can
 *
 */
var batchDownloadWiki = function(dsns, cb){
  // Track number of errors that occur
  var _errCt = 0;
  // Track which datasets caused errors
  var _errNames = [];
  // We'll need the request module to do a GET request.
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

  // Go zip up all the files that we retrieved.
  cb()
};

/**
 *  Create a zip archive for one LiPD file. All lipd directories and files are in one zip. (json, txt, csv)
 *
 * @param   {String}   pathTmp      Path to Temp directory
 * @param   {String}   pathTmpZip   Path to Zip directory
 * @param   {String}   pathTmpBag   Path to Bagit directory
 * @param   {String}   filename     LiPD filename
 * @param   {String}   cb           Callback
 */
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

// Create a zip file of multiple NOAA text files. Bundle them for a single download event.
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

// Create the subfolders needed for creating a LiPD file. Each folder has its own purpose during the process.
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

var createTmpDir = function(master, res){
    try {
        // create tmp folder at "/tmp/<`xxxxx>"
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

// Initiate a download response. Necessary for sending clients the files they want. Used for all our downloads.
var downloadResponse = function(options, res){
  // set headers and initiate download.
  var pathFinal = path.join(options.path, options.file);
  res.setHeader('Content-disposition', 'attachment; filename=' + options.file);
  res.setHeader('Content-type', options.content);
  logger.info(options.message);
  res.download(pathFinal);
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

// LiPD parse request. Put request data into one organized object.
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

// NOAA parse request. Put request data into one organized object.
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

// Wiki: Parse all the resil
var parseWikiQueryResults = function(results, cb){
  var _query_results = [];
  // There are results to process.
    try{
        for(var _m=0; _m<results.length; _m++) {
            var _item = {};
            var _dsn_link = results[_m]["binding"][0]["uri"][0];
            var _dsn = _dsn_link.match(/http:\/\/wiki.linked.earth\/Special:URIResolver\/(.*)/);
            _item["dsn"] = _dsn[1];
            _item["url_dataset"] = _dsn_link;
            _item["url_download"] = 'http://wiki.linked.earth/wiki/index.php/Special:WTLiPD?op=export&lipdid=' + _dsn[1];
            _query_results.push(_item);
        }
    } catch(err){
        // Don't do anything. We don't really care about "results" being undefined and not having a length.
        // We'll return the empty array conveying that there were no results.
    }
  cb(_query_results);
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

var sendDigestEmail = function(){
    try{
        // Use nodemailer 2.7.2 to dispatch daily e-mail.
        var nodemailer = require('nodemailer');
        var _recipients = "";
        var _user = JSON.parse(fs.readFileSync("./tokens.json"))["email"]["user"];
        var _pass = JSON.parse(fs.readFileSync("./tokens.json"))["email"]["pass"];
        if(newLipdverseFiles.length !== 0){
            var _body = "Lipd.net activity: " + newLipdverseFiles.length + " new file(s)\n\n";
            for(var _i = 0; _i < newLipdverseFiles.length; _i++){
                // Create block of text for this one file
                var _filetxt = "\nDataset: " + newLipdverseFiles[_i].filename + "\n" +
                "Time: " + newLipdverseFiles[_i].time + "\n" +
                "Upload Status: " + newLipdverseFiles[_i].uploadStatus + "\n" +
                "Link: " +  newLipdverseFiles[_i].url + "\n";
                // Add block of text to full e-mail body.
                _body = _body + _filetxt;
            }
            // create reusable transporter object using the default SMTP transport
            var _transportConfig = {
                service: "Gmail",
                auth: {
                    user: _user,
                    pass: _pass
                }
            };
            if(!dev){
                _recipients = 'Chris <cmh553@nau.edu>, Nick McKay <nicholas.mckay@nau.edu>';
            } else {
                _recipients = 'Chris <cmh553@nau.edu>';
            }
            var transporter = nodemailer.createTransport(_transportConfig);
            // nodemailer.createTransport('smtps://' + _user + ':' + _pass + '@smtp.gmail.com');

            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: "Lipd.net <lipd.manager@gmail.com>", // sender address
                to: _recipients, // list of receivers
                subject: 'Daily Lipdverse Uploads', // Subject line
                text: _body, // plaintext body
                // html: '<b></b>'
            };

            logger.info("Sending lipdverse e-mail update");
            // send mail with defined transport object
            try{
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        logger.info(error);
                    }
                    // Empty the Lipdverse files for the next round tomorrow.
                    newLipdverseFiles = [];
                    logger.info('sendDigestEmail: E-mail sent.');
                    logger.info(info);
                });
            } catch(err){
                logger.info("Error sending e-mail.");
                logger.info(err);
            }

        } else {
            logger.info("sendDigestEmail: No e-mail sent. No new files to report.")
        }
    } catch(err){
        logger.info("sendDigestEmail: ", err);
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

/**
 * Upload a local LiPD file to Dropbox, create a public share link, and return the share link (direct link to file)
 * Dropbox user: lipd.manager
 *
 * Uses SDK docs from :  https://dropbox.github.io/dropbox-sdk-js/global.html
 *
 * @param    {String}   filepath   File path to the directory storing the LiPD file being uploaded. Local on the server
 * @param    {String}   filename   Filename of the LiPD file being uploaded.
 * @param    {String}   mode       Dropbox App to upload to: lipdverse or wiki
 * @param    {Function} cb         Callback that ends the request.
 */
var uploadToAws = function(filepath, filename, mode, cb) {
    try {
        var _emailUpdateMetadata = {
            "filename": filename,
            "time": new Date(),
            "uploadStatus": "NA",
            "url": "NA"
        };
        // Load the aws sdk
        var AWS = require('aws-sdk');
        var _creds = JSON.parse(fs.readFileSync("./tokens.json"))["aws"];
        var content = fs.readFileSync(path.join(filepath, filename));
        // There are two AWS buckets. One for lipdverse, and one for wiki.
        var bucket = "lipdnet";
        if (mode === "wiki"){
            bucket = "linkedearthwiki";
        }
        // Set up the creds for the AWS call
        AWS.config.update({
            accessKeyId: _creds["access"],
            secretAccessKey: _creds["secret"],
            sslEnabled: false,
            s3ForcePathStyle: true
        });

        // If we're in production, add in the proxy.
        if (!dev) {
            AWS.config.update();
        }

        // Create params for putObject call
        var objectParams = {
            Bucket: bucket,
            Key: filename,
            Body: content,
            ACL:'public-read'
        };

        // Create object upload promise
        var uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();

        // After upload success, cb the URL.
        uploadPromise.then(
            function (data) {
                logger.info("Successful AWS Upload: " + bucket + "/" + filename);
                var _direct_url = "https://s3-us-west-2.amazonaws.com/" + bucket + "/" + filename;
                logger.info("URL to file: " + _direct_url);
                _emailUpdateMetadata.uploadStatus = "Success";
                _emailUpdateMetadata.url = _direct_url;
                newLipdverseFiles.push(_emailUpdateMetadata);
                cb(_direct_url)
            }).catch(
                function(err){
                    _emailUpdateMetadata.uploadStatus = "Fail";
                    newLipdverseFiles.push(_emailUpdateMetadata);
                    logger.info("Failed AWS Upload: " + err);
                    cb("");
            });
    } catch (err) {
        _emailUpdateMetadata.uploadStatus = "Fail";
        newLipdverseFiles.push(_emailUpdateMetadata);
        logger.info("uploadToAws error: " + err);
        cb("");
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

/**
 * Write csv, json, and txt data locally as files.
 *
 * @param {Object}   dat    File data sorted as {filename: file content} pairs
 * @param {String}   dst    Location on server where to write the file to.
 * @param {Object}   res    Response object
 * @param {Function} cb     Callback function
 */
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

/**
 * Create the side file for a lipdverse LiPD file upload. This text file contains info about the file including:
 * Filename, User's name, E-mail, If the file is a new file or an updated file, and notes about the changes where
 * applicable.
 *
 * @param {String}  filename    LiPD filename
 * @param {Object}  dat         User info and info about the upload
 * @param {String}  dst         Location on server where to write the file to.
 * @return  None                File is written to server and that's all that's needed.
 */
var writeLipdverseText = function(filename, dat, dst){
    try{
        // Since this is a side text file, add 'info' to the LiPD name so we know which LiPD file to link it to.
        var _filename_txt = filename + "-info.txt";
        // Turn the json data into a text string to write to file.
        var _content = "Filename: " + filename + "\nName: " + dat.name + "\nE-mail: " + dat.email + "\nNew or Update?: " +
            dat.updateMsg + "\nNotes: " + dat.notes;
        logger.info("writing lipdverse file: " + path.join(dst, _filename_txt));
        // Write text file to server.
        fs.writeFileSync(path.join(dst, _filename_txt), _content);
    } catch(err){
        logger.info("writeLipdverseText error: " + err);
    }
};


// END HELPERS


// Call the cleaning function every 2 minutes
setInterval(sendDigestEmail, 86400000); //24 hr
// setInterval(sendDigestEmail, 7200000); // 2 hr
// setInterval(sendDigestEmail, 900000); // 15 min
// setInterval(sendDigestEmail, 30000); // 5 min

/**
 * Retrieve and compile ontology on a set interval.
 */
try{
    // Run once on initialization. All other updates are done on the timer below.
    compileOntology();
    // Refresh the LinkedEarth Wiki ontology data every 1 WEEK, or once every time node is restarted
    setInterval(compileOntology, 604800000);
}catch(err){
    // Error. Use the existing or local ontology instead.
    console.log(err);
}


// PAGE ROUTES

/**
 * Upload a LiPD file to Dropbox to be reviewed for upload to the LiPD
 *
 */
router.get("/lipdverse/:fileid", function(req, res, next){
    try {
        // File ID provided by client
        logger.info("/lipdverse GET");
        // Get the file ID from the request object
        var fileID = req.params.fileid;
        logger.info("/files get: " + fileID);
        // Path to the zip dir that holds the LiPD file
        var pathTmpZip = path.join(process.cwd(), "tmp", fileID, "zip");
        var pathTmp = path.join(process.cwd(), "tmp", fileID);
        // Read in all filenames from the dir
        logger.info("/files get: LiPD File: " + pathTmpZip);
        var files = fs.readdirSync(pathTmpZip);
        // Loop over the files found
        for(var i in files) {
            // Get the first lipd file you find (there should only be one)
            if(path.extname(files[i]) === ".lpd") {
                // Upload the LiPD file to AWS
                uploadToAws(pathTmpZip, files[i], "lipdverse", function(){
                    // Upload the text file to AWS. This has the metadata about the file.
                    uploadToAws(pathTmp, files[i] + "-info.txt", "lipdverse", function(){
                        // Everything is good. End.
                        res.status(200).send("Success");
                    });
                });
            }
        }
    } catch(err) {
        logger.info(err);
        res.status(500).send("lipdverse: GET: Error uploading LiPD file to dropbox: " + err);
    }
});

router.post("/remote", function(req, res, next){
    try {
        // Store the URL for the remote LiPD file to retrieve.
        var _source = req.body.source;
        // Bring in the request module to work some magic
        var request = require('request');
        // Pack up the options that we want to give the request module
        var options = {
            uri: _source,
            method: 'GET',
            timeout: 3000,
            responseType: "blob",
            encoding: null,
            followAllRedirects: true,
            rejectUnauthorized: false
        };

        // Send the request to get the remote LiPD file.
        request(options, function (error, response, body) {
            // If the response is a string, then it is likely an error message.
            if (typeof body === 'string' || body instanceof String) {
                // If the response code is a 502, then something is wrong with the server and it needs to be looked at.
                if (response.statusCode === 502) {
                    res.writeHead(502, "There was an error getting the requested file.", {'content-type': 'text/plain'});
                }
                // The process completed, but we didn't get any NOAA text data back. Which means an error occurred or there wasn't enough data.
                else {
                    res.writeHead(204, "The request completed, but the data isn't a LiPD file.", {'content-type': 'text/plain'});
                }
            }
            // Successful response. Send the whole object back to the client side for zip.js to finish unpacking.
            else {
                response["responseURL"] = _source;
                res.status(200).send(response);
            }
        });
    } catch(err){
        console.log(err);
        res.writeHead(500, "/remote: Error getting remote data: ", err);
        res.end();
    }
});

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

/**
 * Create a LiPD file with the metadata and values data provided. This involves:
 * 1. Creating separate directories
 * 2. Writing the txt, csv, and json files
 * 3. Running bagit (gladstone) on the files
 * 4. Zipping up the files into one LiPD file
 *
 * @param  {Object}   req   Request object
 * @param  {String}   res   Response string is file ID the
 * @param  {Function} next  Callback, not in use
 * @return                  File ID or error string
 */
router.post("/files", function(req, res, next){
  // Request data : Client sends LiPD data. Create csv, json, and text files. Zip contents into a LiPD file stored on the server.
  // Response data : A string ID that corresponds to the LiPD file on the server.

  logger.info("POST: /files");
  // Request
  var master = {};
  master = parseRequest(master, req, res);
  master = createTmpDir(master, res);
  master = createSubdirs(master, res);
  try{
      // If this is a LiPD file meant for Lipdverse, then write the metadata text file to go with it.
      if(typeof req.body.lipdverseText !== "undefined"){
          writeLipdverseText(req.body.filename, req.body.lipdverseText, master.pathTmp);
      }

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

/**
 * Client requests a LiPD file download.
 *
 * Request: Client sends a string ID of the LiPD file that they want to download.
 * Response: Initiate a download of the LiPD file to the client.
 *
 * req.params.tmp =  Path to Temp directory
 *
 * @param  {Object}   req   Request object
 * @param  {Object}   res   Response object
 * @param  {Function} next  Callback, not used
 * @return none             Download is triggered in response
 */
router.get("/files/:tmp", function(req, res, next){
  try {
    // File ID provided by client
    logger.info("/files get");
    // Get the file ID from the request object
    var fileID = req.params.tmp;
    logger.info("/files get: " + fileID);
    // walk(path.join(process.cwd(), "tmp", fileID));
    // Path to the zip dir that holds the LiPD file
    var pathTmpZip = path.join(process.cwd(), "tmp", fileID, "zip");
    // Read in all filenames from the dir
    logger.info("/files get: LiPD File: " + pathTmpZip);
    var files = fs.readdirSync(pathTmpZip);
    // Loop over the files found
    for(var i in files) {
      // Get the first lipd file you find (there should only be one)
       if(path.extname(files[i]) === ".lpd") {
         var options = {"path": pathTmpZip, "file": files[i], "content": "application/zip", "message": "/files get: Sending LiPD to client"};
         // Send response and trigger a file download
         downloadResponse(options, res);
       }
    }
  } catch(err) {
    logger.info(err);
    res.status(500).send("GET: Error downloading LiPD file: " + err);
  }
});

/**
 * Convert LiPD data to NOAA data
 *
 * Request:
 * Client sends LiPD data. Send it to PythonAnywhere script to convert it to NOAA text file(s).Write NOAA file(s) to
 * server.
 *
 * Response:
 * A string file ID that corresponds to the NOAA txt file (or zip of multi NOAA files) on the server.
 *
 * @param   {Object}   req   Request object
 * @param   {String}   res   Response string. File ID for created NOAA file
 * @param   {Function} next  Callback, not in use
 * @return  none             File ID sent in response
 */
router.post("/noaa", function(req, res, next){
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

      // Send the request to the NOAA API
      console.log("Sending LiPD data to NOAA Conversion API: ", master.name);
      // console.log("PORT : ", port);
      // console.log(JSON.stringify(master.dat));
      request(options, function (error, response, body) {
        console.log("Received Response");
        console.log(typeof response);

        if(dev){
            if (typeof response !== "undefined"){
                console.log("Response Status: ", response.statusCode);
            } else {
                console.log("No response");
            }
            console.log("Response error: ");
            console.log(error);
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

/**
 * Download NOAA
 * Retrieve and download a NOAA file. This may be a single txt file, or a zip archive that contains several txt files.
 * The request parameters contain the ID for the NOAA file that we want to retrieve from NodeJS and serve back as a
 * download.
 * Ex file ID: "noaa-EG31DS"
 *
 * @param  {Object}   req    Request object. The req.params.tmp indicates which file to serve.
 * @param  {String}   res    String error response or file download
 * @param  {Function} next   Callback, not in use
 * @return none              Download is triggered in response
 */
router.get("/noaa/:fileid", function(req, res, next){
  // Request: Client sends a string ID of the NOAA file that they want to download.
  // Response: Initiate a download of the NOAA file to the client.
  try {
    logger.info("/noaa get: Fetch the NOAA file requested");
    // NOAA ID provided by client
    var fileid = req.params.fileid;
    logger.info("/noaa get: NOAA ID: " + fileid);
    // walk(path.join(process.cwd(), "tmp", tmpStr));
    // Full path to the zip dir that holds the NOAA file(s)
    // var pathTmp = path.join(process.cwd(), "tmp");
    var pathTmpNoaa = path.join(process.cwd(), "tmp", fileid);
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
        // Completed successfully.
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

  // Pack up the options that we want to give the Python request
  var options = {
    uri: 'http://cheiser.pythonanywhere.com/api/wikiquery',
    method: 'POST',
    json: req.body,
    timeout: 3000
  };

  try{

    process.on("uncaughtException", function(err){
        console.log("UncaughtException! : " + err.message);
        console.log(err.stack);
        process.exit(1);

    });
    console.log("query: Python: Sending request...");
    request(options, function (err1, res1, body1) {
        // Sometimes if the proxy request we send gets an ERRCONREFUSED, the response is undefined. Tell the user
        // to try one more time, because it often only happens rarely, and almost never in the same session.
        if(typeof res1 === "undefined"){
            console.log("query: Python response: There was no response object. Undefined. ERRCONNREFUSED");
            res.writeHead(500, "The query request didn't send successfully. Please try the same request again.", {'content-type' : 'text/plain'});
            res.end();
        } else {
            console.log("query: Python: Response Status: ", res1.statusCode);
            if(err1){
                console.log("query: Python: Error making the request");
                res.writeHead(res1.statusCode, "Error talking to the PythonAnywhere API", {'content-type' : 'text/plain'});
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

                console.log("query: Wiki: Sending request...");
                request(options, function(err2, res2, body2){
                    console.log("query: Wiki: Response Status: ", res2.statusCode);
                    if(err2){
                        console.log("query: Wiki: Error making the request");
                        res.writeHead(res2.statusCode, "Error talking to the Wiki API", {'content-type' : 'text/plain'});
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

router.get("/downloadall/:fileid", function(req, res, next){

});

router.post("/downloadall", function(req, res, next){
  // Array of dataset names to retrieve

    // TODO finish this process
  var _dsns = req.body.dsns;
  console.log(_dsns);

  // Create a tmp folder
  // var _tmp_dir = ;

  // batchDownloadWiki(_dsns, function(){
  //   console.log("in batch download  callback");
  //   res.status(200).send("hehe");
  // });



});

router.get("/merge", function(req, res, next){
  // Render the compare page
  res.render('merge', {title: 'Merge'});
});

router.post("/wiki", function(req, res, next){
    // Send Dropbox link back to client side.
    logger.info("/wiki POST");
    try{
        var _filename = req.body.filename;
        var _id = req.body.id;
        var _pathTmpZip = path.join(process.cwd(), "tmp", _id, "zip");
        var files = fs.readdirSync(_pathTmpZip);
        // Loop over the files found
        for(var i in files) {
            // Get the first lipd file you find (there should only be one)
            if(path.extname(files[i]) === ".lpd") {
                // Upload the file to Dropbox, and return the direct url to the LiPD file.
                uploadToAws(_pathTmpZip, files[i], "wiki", function(_url){
                    logger.info("Uploading file to Wiki via URL: ", _url);
                    // Send the full Wiki URL upload link with direct LiPD file URL attached.
                    res.status(200).send("http://wiki.linked.earth/Special:WTLiPD?op=importurl&name=" + _filename + "&url=" + _url);
                    res.end();
                });
            }
        }
    } catch(err){
        console.log(err);
        res.end();
    }
});

// END PAGE ROUTES

// MODALS AND PIECES

router.get("/modal-wiki", function(req, res, next){
    res.render('modal/modal-wiki', {title: ''});
});

router.get("/modal-lipdverse", function(req, res, next){
    res.render('modal/modal-lipdverse', {title: ''});
});

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

router.get("/modal-jsonfix", function(req, res, next){
    res.render('modal/modal-jsonfix', {title: ''});
});

router.get("/modal-validationrules", function(req, res, next){
    res.render('modal/modal-validationrules', {title: ''});
});

router.get("/loading", function(req, res, next){
  res.render("loading", {title: ""});
});

// END MODALS AND PIECES


// API ENDPOINTS

router.get("/api/ontology", function(req, res, next){
    res.status(200).send(JSON.stringify(_ontology_query));
});

/**
 *
 *
 */
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
  logger.info("exit /api/validator");
});

/**
 * Create a TSid
 * Use data from a LiPD file to create TSids, register them in the master list, and send data in response
 *
 * @param   {Object}  req    Request object
 * @return  {String}  res    Response object
 *                           Success: Stringified json object.
 *                           Failure: Error string.
 */
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
        // Append the new TSids to tsid_only.csv
        updateTSidOnly(_x);
        // Append the new object data (w/ tsids) to tsid_master.csv
        updateTSidMaster(_x, function(_results){
          logger.info("TSids created successfuly");
          // Since the update was successsful, add the new JSON objects to the response and send.
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify(_results, null));
        });
      });
    });
  } catch (err) {
    logger.info(err);
    res.end();
  }
});

/**
 * Register new TSids to our master list.
 * Receive TSids from LiPD files and check them against our master list. Add TSids to the master list where
 * necessary
 *
 * Current TSid master list is : tsid_master.csv
 *
 * req.body.data is an {Array} of objects that holds necessary information to register a TSid.
 * Ex: req.body.data
 * {"TSid": "", "dataSetName": "", "variableName": "", "spreadsheetKey": "", "worksheetKey": ""}
 *
 *
 * @param   {Object}  req   Request object
 * @return  {Object}  res   Response object
 *                          Success: Success {String}
 *                          Failure: Error {String}
 *
 */
router.post("/api/tsid/register", function(req, res, next){
  logger.info("/api/tsid/register");
  try{
    // Array of objects, each with 4 fields needed to register TSid
    var _objs = req.body.data;
    readTSidOnly(function(_tsids){
      misc.reconcileTSidRegister(_tsids, _objs, function(_x){
        updateTSidOnly(_x);
        // Append the new object data (w/ tsids) to tsid_master.csv
        updateTSidMaster(_x, function(_results){
          // Since the update was successful, add the new JSON objects to the response and send.
          // res.setHeader('Content-Type', 'application/json');
          // res.send(JSON.stringify(_results, null));
          logger.info("TSids registered successfully");
          res.status(200).send({"response": "Registered TSids successfully"});
        });
      });
    });
  } catch(err){
    logger.info(err);
    res.end();
  }
});

/**
 * Use a DOI url to retrieve data from doi.org API.
 *
 * Ex:
 * req.body.url = http://dx.doi.org/10.1126/science.1143791
 *
 * @param   {Object}  req   Request object
 * @return  {Object}  res   Response object
 *                          Success: Publication data {Object}
 *                          Failure: Error {String}
 */
router.post("/api/doi", function(req, res, next){
    try {
        // Pack up the options that we want to give the request module
        var url = req.body.url;
        logger.info("Retreiving DOI : " + url);
        var options = {
            uri:     url,
            method: 'GET',
            timeout: 3000,
            headers: {"accept": "application/rdf+xml;q=0.5, application/citeproc+json;q=1.0"}
        };
        request(options, function (error, response, body) {
            // Did the process complete and respond with data?
            if (typeof response !== "undefined"){
              if (response.statusCode >= 200 || response.statusCode <= 299) {
                logger.info("/api/doi Status: " + response.statusCode);
                res.status(response.statusCode).send(response.body);
              } else {
                logger.info("/api/doi Error: " + error);
                logger.info("/api/doi Status: " + response.statusCode);
                res.status(response.statusCode).send("Error: " + response.statusCode);
                res.end();
              }
            } else {
              logger.info("/api/doi Error: " + error);
              logger.info("Error: Response Undefined");
              res.status(500).send("Error: Response Undefined");
              res.end();
            }
        });
    } catch(err){
        logger.info("/api/doi exception: " + err);
        res.status(500).send("Error: Exception");
        res.end();
    }

});


/**
 * PaleoRec Predict Next Value. Hosted on PythonAnywhere Flask API
 *
 * @param   {Object}   req   Request object
 * @param   {String}   res   Response string
 * @param   {Function} next  Callback, not in use
 * @return  none             List of items for next recommendation
 */
router.get("/api/predictNextValue/:url", function(req, res, next){
    try{
      var params = req.params.url;
      console.log(params);
      console.log("Sending /predictNextValue request: " + params)

      try {
        // Bring in the request module to work some magic
        var request = require('request');
        // Pack up the options that we want to give the request module
        var options = {
          uri: "http://cheiser.pythonanywhere.com/predictNextValue?" + params,
          method: 'GET',
          timeout: 3000
        };

        // Send the request to the NOAA API
        console.log("Sending request /api/predictNextValue");
        request(options, function (error, response, body) {
          console.log("/api/predictNextValue: Response received");
          if(dev){
              if (typeof response !== "undefined"){
                  console.log("Response Status: ", response.statusCode);
              } else {
                  console.log("No response");
              }
              console.log("/api/predictNextValue error: " + error);
              //{"result":{"0":["ARS","Core","Trsgi","Rbar","SE"]}}
              console.log("/api/predictNextValue body");
              console.log(body);
          }

          // Did the process complete and respond with data?
          if (!error && response.statusCode <= 299 && response.statusCode >= 200) {
            // 200, good response
            try {
              // Write the NOAA data to the tmp folder as text files
              console.log("200 response");
              console.log(body)
              res.status(200).send(body);
            } catch(err){
              // Something went wrong while trying to process the API response.
              console.log("200 response, /predictNextValue error: ", err);
              res.writeHead(500, "API Error: Invalid response", {'content-type' : 'text/plain'});
              res.end();
            }
          } else{
            // Something went wrong in the Python process and the API gave us a bad response.
            console.log("API Error: Invalid response code", error);
            res.writeHead(403, "API Error: Invalid response", {'content-type' : 'text/plain'});
            res.end();
          }
        });
      } catch(err){
        console.log("/predictNextValue: catchall error");
        res.writeHead(500, "/predictNextValue: catchall error", {'content-type' : 'text/plain'});
        res.end();
      }
    } catch(err){
      console.log("/predictNextValue: catchall error");
      res.writeHead(500, "/predictNextValue: catchall error", {'content-type' : 'text/plain'});
      res.end();
    }
  });
  

/**
 * PaleoRec: Archive Types. Hosted on PythonAnywhere Flask API
 *
 * @param   {Object}   req   Request object
 * @param   {String}   res   Response string
 * @param   {Function} next  Callback, not in use
 * @return  none             List of items for next recommendation
 */
router.get("/api/archiveTypes", function(req, res, next){
  try{
    console.log("Sending /api/archiveTypes request");
    try {
      // Bring in the request module to work some magic
      var request = require('request');
      // Pack up the options that we want to give the request module
      var options = {
        uri: "http://cheiser.pythonanywhere.com/getArchives",
        method: 'GET',
        timeout: 3000
      };

      // Send the request to the NOAA API
      console.log("Sending request /api/archiveTypes");
      request(options, function (error, response, body) {
        console.log("PythonAnywhere API: Response received");
        console.log(typeof response);
        if(dev){
            if (typeof response !== "undefined"){
                console.log("Response Status: ", response.statusCode);
            } else {
                console.log("No response");
            }
            console.log("Response error: ");
            console.log(error);

            //{"result":{"0":["ARS","Core","Trsgi","Rbar","SE"]}}
            console.log("Response Body: ");
            console.log(body);
        }

          // Did the process complete and respond with data?
          if (!error && response.statusCode === 200) {
            // 200, good response
            try {
              // Write the NOAA data to the tmp folder as text files
              console.log("200 response");
              console.log(body)
              res.status(200).send(body);
            } catch(err){
              // Something went wrong while trying to process the API response.
              console.log("200 response, /archiveTypes error: ", err);
              res.writeHead(500, "API Error: Invalid response", {'content-type' : 'text/plain'});
              res.end();
            }
          } else{
            // Something went wrong in the Python process and the API gave us a bad response.
            console.log("API Error: Invalid response code", error);
            res.writeHead(403, "API Error: Invalid response", {'content-type' : 'text/plain'});
            res.end();
          }
      });
    } catch(err){
      console.log("/archiveTypes: catchall error");
      res.writeHead(500, "/archiveTypes: catchall error", {'content-type' : 'text/plain'});
      res.end();
    }
  } catch(err){
    console.log("/archiveTypes: catchall error");
    res.writeHead(500, "/archiveTypes: catchall error", {'content-type' : 'text/plain'});
    res.end();
  }
});

module.exports = router;
