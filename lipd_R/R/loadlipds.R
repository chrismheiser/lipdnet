# 1. Import the required modules
set.modules <- function(){
  library(Kmisc)
  library(rPython)
  library(jsonlite)
}

# 2. Ask user where files are stored


# 3. Get list of all LiPD files in current directory
get.files.lpd.ext <- function(){
  f <- list.files(path=getwd(), pattern='\\.lpd$')
  return(f)
}

# 4. Create a temporary directory for workspace
create.tmp.dir <- function(){
  d <- tempdir()
  return(d)
}

# 5. Unzip all LiPD files to the temporary directory
unzipper <- function(files, d){
  sapply(files, function(f){
    unzip(f, exdir = d)
  })
}

# 6. Import lipd data
import.lipd.data <- function(tmp, files_noext){

  # Move into the tmp folder
  setwd(tmp)

  # Loop over the LiPD folders
  out <- sapply(files_noext, function(lipd){
    out <- NULL
    print(lipd)

    # Move into this one LiPD folder
    setwd(lipd)

    # Move into the data folder if it exists
    if (dir.exists("data")){
      setwd("data")

      # Get all CSV files and data. Combined
      csvs <- get.files.csv()
      csvs.out <- sapply(csvs, function(x){
        datas <- import.csv.file(x)
        return(datas)
      })

      # Get all JSONLD files and data. Combined
      j <- get.files.json()
      j.data <- import.jsonld.file(j)

      # Append the JSONLD and CSV data together
      out <- append(j.data, csvs.out)
    }
    # Move back up to the tmp directory
    setwd(tmp)

    # Return data for this one LiPD file
    return(out)
  })
  # Return data for all LiPD files
  return(out)
}

# HELPERS

# Remove the file extension from string names
strip.extension <- function(file.list){
  x <- sapply(file.list, function(f){
    strip_extension(f)
  })
  x <- as.character(x)
  return(x)
}

# Get list of csv files in current directory and below
get.files.csv <- function(){
  f <- list.files(path=getwd(), pattern='\\.csv$', recursive=TRUE)
  return(f)
}

# Get list of jsonld files in current directory and below
get.files.json <- function(){
  f <- list.files(path=getwd(), pattern='\\.jsonld$', recursive=TRUE)
  return(f)
}

# Import data from one CSV file
import.csv.file <- function(f){
  t <- read.csv(f, header=FALSE)
  return(t)
}

# Try to import data from ONE of the jsonld files
import.jsonld.file <- function(f){
  #Import the data
  f.data <- lapply(f, function(x) fromJSON(x))
  # Add filenames to the data
  names(f.data) <- f
  # Set filename as a source field in the metadata
  for(i in f)
    f.data[[i]]$Source = i
  # Bind everything together
  do.call(rbind, f.data)
  return(f.data)
}

# Go back to the original working directory
return.to.root <- function(){
  setwd("~/Documents/code/geoChronR/lipd_R/")
}
