import.lipds <- function(){
  curr.dir <- getwd()
  files <- list.files(path=curr.dir, pattern='\\.lpd$')
  dfs <- apply(files,
                function(f){
                    # Save the root dir before we start changing locations
                    start.dir <- getwd()
                    print(start.dir)

                    tmpdir <- tempfile()

                    dir.create(tmpdir)

                    # Create a name for the dir where we'll unzip
                    zipdir <- tmpdir()

                    # Unzip the file into the dir
                    unzip(f, exdir=tmpdir)

                    # Get a list of files in the dir
                    all.files <- list.files(zipdir, rec=TRUE)
                    csv.files <- list.files(zipdir, rec=TRUE, pattern="\\.csv$")
                    json.files <- list.files(zipdir, rec=TRUE, pattern="\\.json$|\\.jsonld$")

                    # Move into the temp directory
                    setwd(tmpdir)

                    # json.data <- apply(json.files,
                    #                       function(f){
                    #                         fp <- file.path(".", f)
                    #                         dat <- fromJSON(file = fp)
                    #                         return(dat)
                    #                       }
                    #   )
                    #
                    # csv.data <- apply(csv.files,
                    #                      function(f){
                    #                        fp <- file.path(".", f)
                    #                        dat <- read.csv(fp)
                    #                        return(dat)
                    #                      }
                    #   )
                    #
                    # df <- data.frame(json.data, csv.data)

                    # Go back to top directory
                    setwd(cdir)

                    # Return data
                    return(df)
                }
  )
  return(dfs)
}

test.fn <- function(){
  files <- list.files(path=getwd(), pattern='\\.lpd$')
  td <- tempdir()
  tf <- tempfile(tmpdir=td, fileext=".lpd")
  print(files[1])
  o <- unzip(files[1], exdir=td, overwrite=TRUE)
  return(o)
}

open.zips <- function(){
  files <- list.files(path=getwd(), pattern='\\.lpd$')
  sapply(files, function(f){
    unzip(f)
  })
}

get.filenames.ext <- function(){
  files <- list.files(path=getwd(), pattern='\\.lpd$')
  return(files)
}

get.filenames.noext <- function(){
  files_ext <- get.filenames.ext()
  x <- sapply(files_ext, function(f){
    strip_extension(f)
  })
  return(x)
}

# Nick Meeting
  # Create the temp directory
  d <- tempdir()
  # Go to temp dir
  setwd(d)

  #  Unzip files to temp dir
  unzip(file, exdir = "some/path/")

  # Make sure the file is properly bagged
  # Load in the JSON
  # Check for LiPD Version number
    # Handle based on which version is found
  # Add MD5 to json for each file in the zip


