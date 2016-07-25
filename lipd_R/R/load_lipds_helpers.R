###############################################
## Load LiPD - Helpers
## Misc functions that aid the loading of LiPD
## files
###############################################

# Import the required modules
set.modules <- function(){
  library(Kmisc, quietly=TRUE)
  library(RJSONIO, quietly=TRUE)
  library(rPython, quietly=TRUE)
  library(jsonlite, quietly=TRUE)
}

# TODO: Ask user where files are stored
# This isn't working yet because the tcltk package keeps crashing upon import

# Get list of all LiPD files in current directory
get.list.lpd.ext <- function(){
  f <- list.files(path=getwd(), pattern='\\.lpd$')
  return(f)
}

# Create a temporary directory for workspace
create.tmp.dir <- function(){
  d <- tempdir()
  return(d)
}

# Unzip all LiPD files to the temporary directory
unzipper <- function(files, tmp){
  sapply(files, function(f){
    unzip(f, exdir = tmp)
  })
}

# Remove the file extension from string names
strip.extension <- function(files_ext){
  x <- sapply(files_ext, function(f){
    strip_extension(f)
  })
  x <- as.character(x)
  return(x)
}

# Get list of csv files in current directory and below
get.list.csv <- function(){
  f <- list.files(path=getwd(), pattern='\\.csv$', recursive=TRUE)
  return(f)
}

# Get list of jsonld files in current directory and below
get.list.jsonld <- function(){
  f <- list.files(path=getwd(), pattern='\\.jsonld$', recursive=TRUE)
  return(f)
}

# Import data from one CSV file
import.file.csv <- function(f){
  t <- read.csv(f, header=FALSE)
  return(t)
}

# Try to import data from one jsonld file
import.file.jsonld <- function(f){
  f.data <- fromJSON(f)
  return(f.data)
}

# Go back to the original working directory
return.to.root <- function(){
  setwd("~/Documents/code/geoChronR/lipd_R/")
}

