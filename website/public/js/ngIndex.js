var p = angular.module("ngIndex", []);

p.controller('IndexCtrl', function ($scope) {
    $scope.gettingStarted = [
      {
        "title": "create a LiPD file from scratch",
        "descriptions": [
          "Use the online Playground: enter data and download your dataset as a LiPD file",
          "Use the LiPD Utilities (Python): enter your data into our Excel template, and use the LiPD Utilities to convert the excel file to a LiPD file"
        ]
      },
      {
        "title": "create many LiPD files from scratch",
        "descriptions": [
          "Use the LiPD Utilities (Python): enter your data into our Excel template, and use the LiPD Utilities " +
          "to convert the excel file to a LiPD file. This is currently the easiest way as creating many files one-by-one in the Playground can be tedious."
        ]
      },
      {
        "title": "edit a LiPD file",
        "descriptions": [
          "Use the online Playground: upload your LiPD file, edit, and download as a new LiPD file",
          "Use the LiPD Utilities: read the LiPD file to the workspace, make manual edits, and write as a new file"
        ]
      },
      {
        "title": "analyze LiPD data",
        "descriptions": [
          "Use the LiPD Utilities to read a LiPD file and use the desired functions. Consider adding the GeoChronR or PyleoClim packages for additional functions."
        ]

      }
    ];


    $scope.quickLinks = [
      {
        "icon": "toys",
        "title": "LiPD Playground",
        "link": "./playground",
        "tooltip": "Get a hands-on LiPD experience in the playground by creating or editing a LiPD file. Don't forget to take the tour!"
      },
      {
        "icon": "code",
        "title": "LiPD Playground Github",
        "link": "https://github.com/chrismheiser/lipdnet",
        "tooltip": "The Github repository for the LiPD Playground. Please use it to make suggestions on improving the Playground and to report bugs"
      },
      {
        "icon": "code",
        "title": "LiPD Utilities Github",
        "link": "http://nickmckay.github.io/LiPD-utilities/",
        "tooltip": "The Github repository is the main hub for our Matlab, Python, and R code."
      },
      {
        "icon": "chrome_reader_mode",
        "title": "LiPD Utilities Docs",
        "link": "http://nickmckay.github.io/LiPD-utilities/",
        "tooltip": "An overview on how to download and use the LiPD Utilities. Docs are available in Matlab, Python, and R languages"
      },
      {
        "icon": "code",
        "title": "GeoChronR",
        "link": "http://nickmckay.github.io/GeoChronR/",
        "tooltip": "An R package for analyzing and visualizing paleoclimate data in LiPD"
      },
      {
        "icon": "code",
        "title": "PyleoClim",
        "link": "http://linkedearth.github.io/Pyleoclim_util/",
        "tooltip": "A Python package for analyzing and visualizing paleoclimate data in LiPD"
      },
      {
        "icon": "public",
        "title": "LinkedEarth Wiki",
        "link": "http://wiki.linked.earth/Main_Page",
        "tooltip": "The LinkedEarth Wiki contains a database of viewable LiPD datasets, guides for learning various tasks, and community activities"
      },
      {
        "icon": "search",
        "title": "NOAA + LiPD examples",
        "link": "https://www1.ncdc.noaa.gov/pub/data/paleo/pages2k/NAm2kHydro-2017/",
        "tooltip": "A sample of NOAA text template files that have been generated from LiPD files"
      },
      {
        "icon": "chrome_reader_mode",
        "title": "LiPD Ontology",
        "link": "http://linked.earth/ontology/core/1.2.0/index-en.html",
        "tooltip": "A controlled vocabulary of terms used in LiPD"
      },
      {
        "icon": "chrome_reader_mode",
        "title": "LinkedEarth Ontology",
        "link": "http://linked.earth/ontology/",
        "tooltip": "A controlled vocabulary of terms used in LinkedEarth"
      },
      {
        "icon": "cloud_download",
        "title": "LiPD Excel Template",
        "link": "https://github.com/nickmckay/LiPD-utilities/raw/master/Examples/LiPD_template.xlsx",
        "tooltip": "Create a LiPD file by entering your data into the Excel template and converting it using the LiPD Utilities (Python)"
      }


    ];

    $scope.faqs = [
      {
        "question": "What are LiPD Utilities and why do I need them?",
        "answer": "The LiPD Utilities are functions that allow you to create, edit, and analyze LiPD data."
      },
      {
        "question": "What languages are the LiPD Utilities available in?",
        "answer": "R, Matlab, and Python."
      },
      {
        "question": "Why would you code the LiPD Utilities in different languages?",
        "answer": "We want to give LiPD access to as many people as possible, regardless of computer setup. We think that covering the main scientific languages is a good place to start."
      },
      {
        "question": "Do I need to learn new functions for each package?",
        "answer": "Yes and no. Each package contains the same set of 'core' functions. Each package has some extra functions that leverage the strengths of that specific language as well. All functions are noted in the individual package documentation."
      },
      {
        "question": "It's not working OR it could work better!",
        "answer": "Please let us know! Each Github repository has an 'Issues' tab that helps us track bug reports and suggestions for improving." +
        "All relevant Github repositories are listed below in 'Quick Links'. Post your comments and concerns and we will get to them as soon as possible!"
      },
      {
        "question": "Where can I find LiPD files?",
        "answer": "LiPD files are currently hosted on the LinkedEarth Wiki and NOAA Paleo. Both sites are linked below in 'Quick Links'."
      },
      {
        "question": "Why do you have the LiPD Utilities and the LiPD Playground? Aren't they the same thing?",
        "answer": "Not exactly. The LiPD Playground is great for creating and editing files on a file-by-file basis. " +
        "It also works well for doing a quick glance at the data and making sure it looks correct. The LiPD Utilities are " +
        "better at batch data and data analysis. For example, creating multiple LiPD files from Excel templates, extracting and " +
        "analyzing a time series, or editing a specific piece of data in multiple files."
      },
      {
        "question": "How do PyleoClim and GeoChronR packages fit into all this?",
        "answer": "PyleoClim and GeoChronR are complementary packages to the LiPD Utilities. The LiPD Utilities help " +
        "facilitate the basic functions of reading, writing, and managing your LiPD files. GeoChronR and PyleoClim are meant to handle more advanced functions for analyzation and visualization in R and Python respectively."
      }
    ];

  });