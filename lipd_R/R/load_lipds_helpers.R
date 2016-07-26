###############################################
## Load LiPD - Helpers
## Misc functions that aid the loading of LiPD
## files
###############################################

#' Import each of the required modules for the package
#' @export
#' @return none
set.modules <- function(){
  library(Kmisc, quietly=TRUE)
  library(RJSONIO, quietly=TRUE)
  library(rPython, quietly=TRUE)
  library(jsonlite, quietly=TRUE)
}

# TODO: Ask user where files are stored
# This isn't working yet because the tcltk package keeps crashing upon import


#' Get list of all LiPD files in current directory
#' @export
#' @return f List of LiPD files w. ext
get.list.lpd.ext <- function(){
  f <- list.files(path=getwd(), pattern='\\.lpd$')
  return(f)
}

#' Create a temporary working directory
#' @export
#' @return d Temporary directory path
create.tmp.dir <- function(){
  d <- tempdir()
  return(d)
}

#' Unzip all LiPD files to the temporary directory
#' @export
#' @param files LiPD files to unzip
#' @param tmp Temporary directory
#' @return none
unzipper <- function(files, tmp){
  sapply(files, function(f){
    unzip(f, exdir = tmp)
  })
}

#' Remove the file extension from string names
#' @export
#' @param files_ext List of LiPD filenames w. ext
#' @return none
strip.extension <- function(files_ext){
  x <- sapply(files_ext, function(f){
    strip_extension(f)
  })
  x <- as.character(x)
  return(x)
}

#' Get list of csv files in current directory and below
#' @export
#' @return f List of csv files
get.list.csv <- function(){
  f <- list.files(path=getwd(), pattern='\\.csv$', recursive=TRUE)
  return(f)
}

#' Get list of jsonly files in current directory and below
#' @export
#' @return f List of jsonld files
get.list.jsonld <- function(){
  f <- list.files(path=getwd(), pattern='\\.jsonld$', recursive=TRUE)
  return(f)
}

#' Read in data from a csv file
#' @export
#' @return t Data frame of csv data
import.file.csv <- function(f){
  t <- read.csv(f, header=FALSE)
  return(t)
}

#' Read in data from a jsonld file
#' @export
#' @return l List of jsonld data
import.file.jsonld <- function(f){
  l <- fromJSON(f)
  return(l)
}

#' Return to a predetermined folder each time a process quits early from an error
#' @export
#' @return none
return.to.root <- function(){
  setwd("~/Documents/code/geoChronR/lipd_R/")
}

#' Remove CSV and metadata layer from our lipd library.
#' @export
#' @param D LiPD Library
#' @param lpds List of LiPD files in the library
#' @return D Modified lipd library
remove.layers <- function(D, lpds){
  for (i in 1:length(lpds)){
    name <- lpds[[i]]
    D[[name]] <- D[[name]][["metadata"]]
  }
  return(D)
}
